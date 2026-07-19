import os
import paramiko
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class StorageSFTP:
    @staticmethod
    def _get_ssh_client() -> paramiko.SSHClient:
        """
        Cria e conecta o cliente SSH usando credenciais do .env.
        Suporta chave privada SSH ou senha padrão.
        """
        ssh = paramiko.SSHClient()
        # Auto-aceitar chaves do host remoto (em produção real fixaríamos o hostkey)
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        try:
            if settings.SFTP_PRIVATE_KEY_PATH and os.path.exists(settings.SFTP_PRIVATE_KEY_PATH):
                logger.info(f"Conectando SFTP via chave privada: {settings.SFTP_PRIVATE_KEY_PATH}")
                key = paramiko.RSAKey.from_private_key_file(settings.SFTP_PRIVATE_KEY_PATH)
                ssh.connect(
                    hostname=settings.SFTP_HOST,
                    port=settings.SFTP_PORT,
                    username=settings.SFTP_USER,
                    pkey=key,
                    timeout=15
                )
            else:
                logger.info("Conectando SFTP via senha")
                ssh.connect(
                    hostname=settings.SFTP_HOST,
                    port=settings.SFTP_PORT,
                    username=settings.SFTP_USER,
                    password=settings.SFTP_PASSWORD,
                    timeout=15
                )
            return ssh
        except Exception as e:
            logger.error(f"Erro de conexão SSH/SFTP: {e}")
            raise e

    @staticmethod
    def _sftp_makedirs(sftp: paramiko.SFTPClient, remote_directory: str):
        """
        Cria diretórios recursivamente no servidor remoto SFTP.
        """
        dirs = []
        dir_path = remote_directory.replace("\\", "/")
        
        # Divide o caminho absoluto para criar nível por nível
        parts = dir_path.strip("/").split("/")
        current = ""
        
        # Preserva raiz absoluta no Linux
        if dir_path.startswith("/"):
            current = "/"
            
        for part in parts:
            if not part:
                continue
            if current == "/":
                current += part
            else:
                current += "/" + part
            dirs.append(current)
            
        for d in dirs:
            try:
                sftp.stat(d) # Testa se o diretório existe
            except FileNotFoundError:
                logger.info(f"Criando diretório remoto: {d}")
                sftp.mkdir(d)

    @classmethod
    def upload_variants(cls, job_uuid: str, year: str, month: str, variants_metadata: dict) -> dict:
        """
        Faz o upload de todas as variantes de imagem locais para a pasta correspondente no Plesk via SFTP.
        Realiza upload atômico salvando como .uploading e renomeando ao concluir.
        Retorna dicionário contendo as URLs públicas finais.
        """
        ssh = cls._get_ssh_client()
        sftp = ssh.open_sftp()
        
        # Determina caminho remoto no Plesk
        # Ex: /var/www/vhosts/festadoscaminhoneiros.com.br/fotos.festadoscaminhoneiros.com.br/img/2026/07/{uuid}
        target_dir = f"{settings.SFTP_REMOTE_PATH}/{year}/{month}/{job_uuid}"
        cls._sftp_makedirs(sftp, target_dir)

        uploaded_urls = {}

        try:
            for variant_type, data in variants_metadata.items():
                uploaded_urls[variant_type] = {}
                
                # Upload dos dois formatos: WebP e JPG
                formats = {
                    "webp": (data["local_webp_path"], f"{variant_type}.webp"),
                    "jpg": (data["local_jpg_path"], f"{variant_type}.jpg")
                }
                
                for fmt, (local_path, remote_name) in formats.items():
                    remote_file_path = f"{target_dir}/{remote_name}"
                    temp_remote_path = f"{remote_file_path}.uploading"
                    
                    logger.info(f"Subindo {variant_type} ({fmt}) para {temp_remote_path}")
                    # Envia arquivo temporário
                    sftp.put(local_path, temp_remote_path)
                    
                    # Validação de integridade simples (compara tamanho)
                    local_size = os.path.getsize(local_path)
                    remote_stat = sftp.stat(temp_remote_path)
                    if remote_stat.st_size != local_size:
                        raise ValueError(
                            f"Falha de integridade no upload de {remote_name}: tamanho local ({local_size}) difere do remoto ({remote_stat.st_size})"
                        )
                        
                    # Renomeia para o arquivo final (atômico)
                    try:
                        sftp.remove(remote_file_path)
                    except FileNotFoundError:
                        pass
                    sftp.rename(temp_remote_path, remote_file_path)
                    
                    # URL pública: https://fotos.festadoscaminhoneiros.com.br/img/2026/07/{uuid}/{variant}.{format}
                    public_url = f"{settings.PUBLIC_IMAGE_BASE_URL}/{year}/{month}/{job_uuid}/{remote_name}"
                    uploaded_urls[variant_type][fmt] = public_url
                    uploaded_urls[variant_type][f"{fmt}_path"] = remote_file_path
                    
            logger.info(f"Upload completo de todas as variantes para job {job_uuid}.")
            return uploaded_urls

        except Exception as e:
            logger.error(f"Erro ao realizar upload SFTP: {e}")
            raise e
        finally:
            sftp.close()
            ssh.close()
