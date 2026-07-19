"""
importar_fotos_local.py  -  VERSAO OTIMIZADA (batch)
=====================================================
Pipeline em 3 fases separadas para processar milhares de fotos rapidamente:

  FASE 1 - Processamento local paralelo
    Usa todos os CPUs da maquina para converter as imagens simultaneamente.
    Cada worker gera 8 arquivos (thumbnail/preview/full_1x/full_2x em WebP+JPG).

  FASE 2 - Upload bulk SFTP (1 unica conexao)
    Abre UMA UNICA conexao SSH/SFTP e sobe todos os arquivos em sequencia.
    Elimina o overhead de ~2s de handshake por foto do fluxo antigo.

  FASE 3 - Insert em lote no banco
    Uma unica transacao com todos os registros de uma vez.

Uso:
    python automation/scripts/importar_fotos_local.py [PASTA]

    PASTA padrao: C:\\\\Users\\\\Usuario\\\\Desktop\\\\Processamento

Legenda (opcional):
    Crie um arquivo .txt com o mesmo nome da foto para adicionar legenda.
    Ex:  minha_foto.jpg  ->  minha_foto.txt
"""

import os
import sys
import uuid
import shutil
import logging
import time
from datetime import datetime
from concurrent.futures import ProcessPoolExecutor, as_completed

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_AUTOMATION_DIR = os.path.dirname(_SCRIPT_DIR)
if _AUTOMATION_DIR not in sys.path:
    sys.path.insert(0, _AUTOMATION_DIR)

from app.config import settings
from app.db.engine import SessionLocal
from app.db.models import FotoGaleria, FotoVariante
from app.services.image_processor import ImageProcessor
from app.services.placeholder import PlaceholderGenerator

import paramiko

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("importar_fotos")

DEFAULT_PASTA = r"C:\Users\Usuario\Desktop\Processamento"
EXTENSOES = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}

SFTP_BASE = "/var/www/vhosts/festadoscaminhoneiros.com.br/fotos.festadoscaminhoneiros.com.br/img"


# ---------------------------------------------------------------------------
# Funcoes de suporte
# ---------------------------------------------------------------------------

def _ler_legenda(caminho):
    base = os.path.splitext(caminho)[0]
    txt = base + ".txt"
    if os.path.isfile(txt):
        with open(txt, "r", encoding="utf-8", errors="ignore") as fh:
            c = fh.read().strip()
        return c if c else None
    return None


def _limpar_spool(job_uuid):
    try:
        d = os.path.join(settings.SPOOL_DIR, "variants", job_uuid)
        if os.path.exists(d):
            shutil.rmtree(d)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# FASE 1 - Worker de processamento local (roda em processo separado)
# ---------------------------------------------------------------------------

def _worker_processar(args):
    """
    Executado em processo separado pelo ProcessPoolExecutor.
    Processa UMA foto e retorna o dicionario de metadados, sem fazer upload.
    """
    caminho, nome, job_uuid, year, month = args

    # Re-importa porque cada processo tem seu proprio espaco de memoria
    import sys, os
    sys.path.insert(0, _AUTOMATION_DIR)
    from app.services.image_processor import ImageProcessor
    from app.services.placeholder import PlaceholderGenerator

    try:
        meta = ImageProcessor.process_image(caminho, job_uuid)
        lqip = PlaceholderGenerator.generate_lqip_base64(caminho)
        return {
            "ok": True,
            "nome": nome,
            "caminho": caminho,
            "job_uuid": job_uuid,
            "year": year,
            "month": month,
            "meta": meta,
            "lqip": lqip,
        }
    except Exception as exc:
        return {
            "ok": False,
            "nome": nome,
            "caminho": caminho,
            "job_uuid": job_uuid,
            "year": year,
            "month": month,
            "erro": str(exc),
        }


# ---------------------------------------------------------------------------
# FASE 2 - Upload bulk (1 conexao SFTP para tudo)
# ---------------------------------------------------------------------------

def _upload_bulk(processados, sftp):
    """
    Faz o upload de todos os arquivos de variantes em uma unica conexao SFTP.
    Retorna lista de dicts com as URLs finais para cada foto.
    """
    resultados = []
    total = len(processados)

    for i, item in enumerate(processados, 1):
        job_uuid = item["job_uuid"]
        year = item["year"]
        month = item["month"]
        meta = item["meta"]

        remote_dir = f"{SFTP_BASE}/{year}/{month}/{job_uuid}"

        # Cria diretorio remoto (ignora se ja existir)
        try:
            sftp.mkdir(remote_dir)
        except Exception:
            pass

        urls = {}
        for vname, vdata in meta["variants"].items():
            urls[vname] = {}
            for fmt in ("webp", "jpg"):
                local_path = vdata[f"local_{fmt}_path"]
                remote_path_uploading = f"{remote_dir}/{vname}.{fmt}.uploading"
                remote_path_final = f"{remote_dir}/{vname}.{fmt}"
                sftp.put(local_path, remote_path_uploading)
                sftp.rename(remote_path_uploading, remote_path_final)
                urls[vname][fmt] = (
                    f"https://fotos.festadoscaminhoneiros.com.br/img"
                    f"/{year}/{month}/{job_uuid}/{vname}.{fmt}"
                )

        item["urls"] = urls
        resultados.append(item)

        if i % 50 == 0 or i == total:
            logger.info(f"  Upload: {i}/{total} fotos enviadas...")

    return resultados


# ---------------------------------------------------------------------------
# FASE 3 - Insert em lote no banco
# ---------------------------------------------------------------------------

def _inserir_banco(processados_com_urls, now):
    db = SessionLocal()
    total = len(processados_com_urls)
    try:
        for i, item in enumerate(processados_com_urls, 1):
            nome = item["nome"]
            job_uuid = item["job_uuid"]
            meta = item["meta"]
            urls = item["urls"]
            lqip = item["lqip"]
            legenda = _ler_legenda(item["caminho"])

            foto = FotoGaleria(
                id_fotografo=1,
                id_grupo_whatsapp=12,
                url_imagem_original_zapi="local://" + nome,
                url_imagem_processada=urls["full_1x"]["webp"],
                url_thumbnail=urls["thumbnail"]["webp"],
                largura_px=meta["width"],
                altura_px=meta["height"],
                orientation=meta["orientation"],
                aspect_ratio=meta["aspect_ratio"],
                dominant_color=meta["dominant_color"],
                blur_hash=None,
                mime_type="image/webp",
                data_envio_msg=now,
                descricao_foto=legenda,
                aprovada=True,
                destaque=False,
                visualizacoes=0,
                zapi_message_id="local-" + job_uuid,
                status="published",
                uuid=job_uuid,
            )
            db.add(foto)
            db.flush()

            for vname, vdata in meta["variants"].items():
                db.add(FotoVariante(
                    id_foto=foto.id_foto,
                    variant=vname,
                    width=vdata["w"],
                    height=vdata["h"],
                    size_bytes=vdata["size_webp"],
                    color_depth=8,
                    url_avif=None,
                    url_webp=urls[vname]["webp"],
                    url_jpg=urls[vname]["jpg"],
                    placeholder=lqip if vname in ("thumbnail", "preview") else None,
                ))

        db.commit()
        logger.info(f"  Banco: {total} fotos inseridas em 1 transacao.")
    except Exception as exc:
        db.rollback()
        raise exc
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Orquestrador principal
# ---------------------------------------------------------------------------

def main(pasta):
    pasta = os.path.abspath(pasta)
    processadas_dir = os.path.join(pasta, "processadas")
    os.makedirs(processadas_dir, exist_ok=True)

    try:
        entradas = os.listdir(pasta)
    except FileNotFoundError:
        logger.error(f"Pasta nao encontrada: {pasta}")
        sys.exit(1)

    fotos = sorted(
        f for f in entradas
        if os.path.isfile(os.path.join(pasta, f))
        and os.path.splitext(f)[1].lower() in EXTENSOES
    )

    if not fotos:
        logger.warning(f"Nenhuma imagem encontrada em: {pasta}")
        sys.exit(0)

    now = datetime.now()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    num_workers = max(1, os.cpu_count() - 1)  # deixa 1 CPU livre para o SO

    print()
    print("=" * 66)
    print("  IMPORTACAO LOCAL EM LOTE - GALERIA")
    print("=" * 66)
    print(f"  Pasta          : {pasta}")
    print(f"  Fotos          : {len(fotos)}")
    print(f"  Workers CPU    : {num_workers}")
    print(f"  SFTP           : {settings.SFTP_HOST}")
    print("=" * 66)
    print()

    t0 = time.time()

    # -------------------------------------------------------------------------
    # FASE 1: Processamento paralelo local
    # -------------------------------------------------------------------------
    logger.info(f"[FASE 1] Processando {len(fotos)} fotos com {num_workers} workers...")

    args_list = [
        (
            os.path.join(pasta, nome),
            nome,
            str(uuid.uuid4()),
            year,
            month,
        )
        for nome in fotos
    ]

    processados_ok = []
    processados_erro = []

    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        futures = {executor.submit(_worker_processar, args): args[1] for args in args_list}
        concluidos = 0
        for future in as_completed(futures):
            result = future.result()
            concluidos += 1
            if result["ok"]:
                processados_ok.append(result)
            else:
                processados_erro.append(result)
                logger.error(f"  ERRO processando {result['nome']}: {result['erro']}")
            if concluidos % 100 == 0 or concluidos == len(fotos):
                logger.info(f"  Fase 1: {concluidos}/{len(fotos)} processados ({len(processados_ok)} ok, {len(processados_erro)} erros)")

    t1 = time.time()
    logger.info(f"[FASE 1] Concluida em {t1-t0:.1f}s  ({len(processados_ok)} ok, {len(processados_erro)} erros)")
    print()

    if not processados_ok:
        logger.error("Nenhuma foto processada com sucesso. Abortando.")
        sys.exit(1)

    # -------------------------------------------------------------------------
    # FASE 2: Upload bulk SFTP (1 conexao)
    # -------------------------------------------------------------------------
    logger.info(f"[FASE 2] Abrindo conexao SFTP e subindo {len(processados_ok)} fotos ({len(processados_ok)*8} arquivos)...")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(
        settings.SFTP_HOST, settings.SFTP_PORT,
        settings.SFTP_USER, settings.SFTP_PASSWORD,
        timeout=30
    )
    sftp = ssh.open_sftp()
    sftp.get_channel().settimeout(60)

    try:
        processados_com_urls = _upload_bulk(processados_ok, sftp)
    finally:
        sftp.close()
        ssh.close()

    t2 = time.time()
    logger.info(f"[FASE 2] Upload concluido em {t2-t1:.1f}s")
    print()

    # -------------------------------------------------------------------------
    # FASE 3: Insert em lote no banco
    # -------------------------------------------------------------------------
    logger.info(f"[FASE 3] Inserindo {len(processados_com_urls)} registros no banco...")
    _inserir_banco(processados_com_urls, now)

    t3 = time.time()
    logger.info(f"[FASE 3] Banco atualizado em {t3-t2:.1f}s")
    print()

    # -------------------------------------------------------------------------
    # Mover originais para 'processadas/' e limpar spool
    # -------------------------------------------------------------------------
    logger.info("Movendo originais para 'processadas/' e limpando spool...")
    for item in processados_com_urls:
        nome = item["nome"]
        caminho = item["caminho"]
        job_uuid = item["job_uuid"]

        dest = os.path.join(processadas_dir, nome)
        if os.path.exists(dest):
            base, ext = os.path.splitext(nome)
            dest = os.path.join(processadas_dir, f"{base}_{job_uuid[:6]}{ext}")
        if os.path.exists(caminho):
            shutil.move(caminho, dest)
        txt_src = os.path.splitext(caminho)[0] + ".txt"
        if os.path.exists(txt_src):
            shutil.move(txt_src, os.path.splitext(dest)[0] + ".txt")

        _limpar_spool(job_uuid)

    # -------------------------------------------------------------------------
    # Relatorio final
    # -------------------------------------------------------------------------
    t_total = t3 - t0
    print()
    print("=" * 66)
    print("  RELATORIO FINAL")
    print("=" * 66)
    print(f"  Total na pasta     : {len(fotos)}")
    print(f"  Publicadas         : {len(processados_com_urls)}")
    print(f"  Erros (Fase 1)     : {len(processados_erro)}")
    print()
    print(f"  Tempo Fase 1 (CPU) : {t1-t0:.1f}s")
    print(f"  Tempo Fase 2 (SFTP): {t2-t1:.1f}s")
    print(f"  Tempo Fase 3 (DB)  : {t3-t2:.1f}s")
    print(f"  TEMPO TOTAL        : {t_total:.1f}s  ({t_total/60:.1f} min)")
    print(f"  Velocidade media   : {len(processados_com_urls)/t_total:.1f} fotos/s")
    if processados_erro:
        print()
        print("  Fotos com erro (nao movidas):")
        for item in processados_erro:
            print(f"    x {item['nome']}: {item['erro']}")
    print("=" * 66)
    print()

    if processados_erro:
        sys.exit(1)


if __name__ == "__main__":
    pasta_arg = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PASTA
    main(pasta_arg)
