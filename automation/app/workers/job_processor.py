import os
import uuid
import shutil
import logging
import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.models import FotoIngestJob, FotoGaleria, FotoVariante
from app.services.media_downloader import MediaDownloader
from app.services.image_processor import ImageProcessor
from app.services.placeholder import PlaceholderGenerator
from app.services.storage_sftp import StorageSFTP
from app.config import settings

logger = logging.getLogger(__name__)

class JobProcessor:
    @staticmethod
    def cleanup_local_files(job_uuid: str, original_file_path: str = None):
        """
        Limpa arquivos temporários locais gerados durante o processamento.
        """
        try:
            # Apaga pasta de variantes
            variants_dir = os.path.join(settings.SPOOL_DIR, "variants", job_uuid)
            if os.path.exists(variants_dir):
                shutil.rmtree(variants_dir)
                
            # Apaga imagem original baixada
            if original_file_path and os.path.exists(original_file_path):
                os.remove(original_file_path)
                
            # Apaga arquivos temporários residuais
            incoming_dir = os.path.join(settings.SPOOL_DIR, "incoming")
            part_path = os.path.join(incoming_dir, f"{job_uuid}.part")
            if os.path.exists(part_path):
                os.remove(part_path)
        except Exception as e:
            logger.warning(f"Erro ao limpar arquivos locais para job {job_uuid}: {e}")

    @staticmethod
    def send_reaction_zapi(phone: str, message_id: str, reaction: str):
        instance_id = settings.ZAPI_INSTANCE_ID.strip()
        token = settings.ZAPI_TOKEN.strip()
        client_token = settings.ZAPI_CLIENT_TOKEN.strip()
        if not instance_id or not token or not client_token:
            logger.warning(
                "Reação Z-API não enviada: configuração de autenticação incompleta"
            )
            return

        url = (
            f"https://api.z-api.io/instances/{instance_id}/token/{token}"
            "/send-reaction"
        )
        headers = {
            "Client-Token": client_token,
            "Content-Type": "application/json",
        }
        payload = {
            "phone": phone,
            "reaction": reaction,
            "messageId": message_id,
        }
        phone_suffix = str(phone)[-4:] if phone else "????"

        try:
            timeout = httpx.Timeout(10.0, connect=5.0)
            with httpx.Client(timeout=timeout) as client:
                res = client.post(url, json=payload, headers=headers)
                if not 200 <= res.status_code < 300:
                    logger.error(
                        "Reação Z-API %s não aceita para telefone final %s: HTTP %s",
                        reaction,
                        phone_suffix,
                        res.status_code,
                    )
                    return
                logger.info(
                    "Reação Z-API %s enviada para telefone final %s: HTTP %s",
                    reaction,
                    phone_suffix,
                    res.status_code,
                )
        except httpx.TimeoutException as exc:
            logger.error(
                "Timeout ao enviar reação Z-API %s (%s)",
                reaction,
                type(exc).__name__,
            )
        except httpx.RequestError as exc:
            logger.error(
                "Falha de rede ao enviar reação Z-API %s (%s)",
                reaction,
                type(exc).__name__,
            )
        except Exception as exc:
            logger.error(
                "Falha interna ao enviar reação Z-API %s (%s)",
                reaction,
                type(exc).__name__,
            )

    @classmethod
    def process_job(cls, db: Session, job: FotoIngestJob) -> bool:
        """
        Executa o pipeline completo de processamento de um job de ingestão.
        Realiza download, conversão, upload e publicação no MySQL.
        Retorna True se publicado com sucesso, False se falhou.
        """
        job_uuid = str(uuid.uuid4())
        logger.info(f"Iniciando processamento do job {job.id} (UUID: {job_uuid})")
        
        # Ano e mês atuais para estruturar os diretórios remotos
        now = datetime.now()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        
        original_file_path = None
        
        try:
            # 1. DOWNLOAD
            job.status = "downloading"
            job.started_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Job {job.id}: Baixando imagem de {job.media_url}")
            original_file_path, sha256_hash = MediaDownloader.download_image(job.media_url, job_uuid)
            
            job.content_sha256 = sha256_hash
            db.commit()

            # 2. PROCESSAMENTO (PILLOW)
            job.status = "processing"
            db.commit()
            
            logger.info(f"Job {job.id}: Processando variantes com Pillow")
            image_metadata = ImageProcessor.process_image(original_file_path, job_uuid)
            
            # Gera Base64 LQIP
            logger.info(f"Job {job.id}: Gerando Base64 LQIP")
            lqip_placeholder = PlaceholderGenerator.generate_lqip_base64(original_file_path)

            # 3. UPLOAD SFTP
            job.status = "uploading"
            db.commit()
            
            logger.info(f"Job {job.id}: Enviando variantes via SFTP")
            uploaded_urls = StorageSFTP.upload_variants(job_uuid, year, month, image_metadata["variants"])

            # 4. PUBLICAÇÃO NO BANCO (TRANSAÇÃO ATÔMICA)
            job.status = "publishing"
            db.commit()
            
            logger.info(f"Job {job.id}: Publicando no MySQL")
            
            # 4.1 Inserir foto_galeria
            # Legenda/caption enviada via WhatsApp vira a descrição da foto
            caption_text = job.caption if job.caption else None
            
            # Identificar período do dia baseado na hora atual
            current_hour = datetime.now().hour
            if 6 <= current_hour < 12:
                periodo = "MANHA"
            elif 12 <= current_hour < 18:
                periodo = "TARDE"
            elif 18 <= current_hour < 24:
                periodo = "NOITE"
            else:
                periodo = "MADRUGADA"

            foto = FotoGaleria(
                id_fotografo=1, # Geral / Padrão
                id_grupo_whatsapp=12, # Geral / Padrão
                url_imagem_original_zapi=job.media_url,
                url_imagem_processada=uploaded_urls["full_1x"]["webp"], # Compatibilidade legado
                url_thumbnail=uploaded_urls["thumbnail"]["webp"], # Compatibilidade legado
                largura_px=image_metadata["width"],
                altura_px=image_metadata["height"],
                orientation=image_metadata["orientation"],
                aspect_ratio=image_metadata["aspect_ratio"],
                dominant_color=image_metadata["dominant_color"],
                blur_hash=None, # Usamos o LQIP/placeholder Base64 na variante
                mime_type="image/webp",
                data_envio_msg=job.received_at,
                descricao_foto=caption_text,
                aprovada=True,
                destaque=False,
                visualizacoes=0,
                zapi_message_id=job.zapi_message_id,
                status="published",
                uuid=job_uuid
            )
            db.add(foto)
            db.flush() # Gera o id_foto gerado por auto-incremento

            # 4.2 Inserir foto_variantes
            for variant_name, data in image_metadata["variants"].items():
                # Para thumbnail e preview adicionamos o LQIP placeholder
                variant_placeholder = lqip_placeholder if variant_name in ("thumbnail", "preview") else None
                
                variante = FotoVariante(
                    id_foto=foto.id_foto,
                    variant=variant_name,
                    width=data["w"],
                    height=data["h"],
                    size_bytes=data["size_webp"], # Tamanho da variante principal
                    color_depth=8,
                    url_avif=None,
                    url_webp=uploaded_urls[variant_name]["webp"],
                    url_jpg=uploaded_urls[variant_name]["jpg"],
                    placeholder=variant_placeholder
                )
                db.add(variante)

            # Vincula job à foto publicada e atualiza status
            job.foto_id = foto.id_foto
            job.status = "published"
            job.completed_at = datetime.utcnow()
            
            # Confirma tudo atomicamente
            db.commit()
            logger.info(f"✓ Job {job.id} processado e publicado com sucesso como foto_id {foto.id_foto}!")
            
            # Envia reação 📸 de sucesso para a Z-API
            if job.sender_phone and job.zapi_message_id:
                cls.send_reaction_zapi(job.sender_phone, job.zapi_message_id, "📸")
                
            return True

        except Exception as e:
            db.rollback()
            error_msg = str(e)
            logger.error(f"❌ Erro ao processar job {job.id}: {error_msg}")
            
            # Incrementa tentativas e atualiza status
            job.attempt_count += 1
            job.error_message = error_msg
            
            if job.attempt_count >= settings.MAX_WORKER_ATTEMPTS:
                job.status = "dead"
                job.error_code = "max_attempts_exceeded"
            else:
                job.status = "retry"
                # Backoff simples: espera exponencial (30s, 2m, 10m, 30m)
                delay_minutes = [0.5, 2, 10, 30][min(job.attempt_count - 1, 3)]
                from datetime import timedelta
                job.next_attempt_at = datetime.utcnow() + timedelta(minutes=delay_minutes)
                job.error_code = "temporary_failure"
                
            db.commit()
            return False
        finally:
            # Limpa arquivos temporários locais
            cls.cleanup_local_files(job_uuid, original_file_path)
