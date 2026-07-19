import time
import socket
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.engine import SessionLocal
from app.db.models import FotoIngestJob
from app.workers.job_processor import JobProcessor
from app.config import settings

logger = logging.getLogger(__name__)

class WorkerRunner:
    def __init__(self):
        # Identificador único para este worker para registrar quem bloqueou o job
        self.worker_name = f"worker-{socket.gethostname()}-{time.time()}"
        self.running = True

    def stop(self):
        self.running = False

    def claim_job(self, db: Session) -> FotoIngestJob | None:
        """
        Reivindica um job pendente ou em fila de forma atômica e compatível.
        Usa um padrão de UPDATE com verificação de linha afetada para garantir concorrência segura.
        """
        now_utc = datetime.utcnow()
        
        # 1. Encontra um ID de job elegível
        # Filtra por status 'queued' ou 'retry' onde next_attempt_at é nulo ou no passado
        sql_find = text("""
            SELECT id FROM foto_ingest_jobs 
            WHERE status IN ('queued', 'retry') 
              AND (next_attempt_at IS NULL OR next_attempt_at <= :now)
            ORDER BY created_at ASC 
            LIMIT 1
        """)
        
        result = db.execute(sql_find, {"now": now_utc}).fetchone()
        if not result:
            return None
            
        job_id = result[0]
        
        # 2. Tenta bloquear o job usando UPDATE atômico com verificação de concorrência
        sql_lock = text("""
            UPDATE foto_ingest_jobs 
            SET status = 'downloading', 
                locked_at = :now, 
                locked_by = :worker_name,
                started_at = :now
            WHERE id = :id 
              AND status IN ('queued', 'retry')
        """)
        
        lock_result = db.execute(sql_lock, {
            "now": now_utc,
            "worker_name": self.worker_name,
            "id": job_id
        })
        db.commit()
        
        # Se alterou exatamente 1 linha, a reivindicação foi bem-sucedida
        if lock_result.rowcount > 0:
            job = db.query(FotoIngestJob).filter(FotoIngestJob.id == job_id).first()
            return job
            
        return None

    def recover_stale_locks(self, db: Session):
        """
        Garante que jobs travados por falhas abruptas ou quedas do worker
        (locked há mais de 15 minutos e não terminados) voltem para a fila.
        """
        now_utc = datetime.utcnow()
        from datetime import timedelta
        stale_time = now_utc - timedelta(minutes=15)
        
        sql_recover = text("""
            UPDATE foto_ingest_jobs 
            SET status = 'retry',
                next_attempt_at = :now,
                locked_at = NULL,
                locked_by = NULL,
                error_code = 'stale_lock_recovered',
                error_message = 'Processamento travado reiniciado automaticamente pelo runner'
            WHERE status IN ('downloading', 'processing', 'uploading', 'publishing')
              AND locked_at <= :stale_time
        """)
        
        result = db.execute(sql_recover, {
            "now": now_utc,
            "stale_time": stale_time
        })
        db.commit()
        
        if result.rowcount > 0:
            logger.warning(f"Recuperados {result.rowcount} jobs travados/expirados.")

    def run(self):
        """
        Loop de execução contínuo do Worker.
        """
        logger.info(f"Iniciando loop do worker Python ({self.worker_name})")
        
        db = SessionLocal()
        try:
            # Recupera locks antigos na inicialização
            self.recover_stale_locks(db)
        except Exception as e:
            logger.error(f"Erro ao recuperar locks na inicialização: {e}")
        finally:
            db.close()

        while self.running:
            db = None
            job_processed = False
            
            try:
                db = SessionLocal()
                # 1. Recupera locks antigos periodicamente
                self.recover_stale_locks(db)
                
                # 2. Tenta obter um job para processar
                job = self.claim_job(db)
                if job:
                    logger.info(f"Job {job.id} reivindicado. Iniciando processamento...")
                    JobProcessor.process_job(db, job)
                    job_processed = True
            except Exception as e:
                logger.error(f"Erro inesperado no loop principal do worker: {e}")
                # Aguarda 5 segundos em caso de falha de conexao para evitar loop infinito rapido
                time.sleep(5)
            finally:
                if db:
                    db.close()
                
            # Se processou algum job, tenta buscar o proximo imediatamente
            # Senao, dorme pelo intervalo configurado antes de consultar a fila novamente
            if not job_processed:
                time.sleep(settings.POLL_INTERVAL_SECONDS)
                
        logger.info("Loop do worker finalizado.")
# Exemplo de uso direto
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    runner = WorkerRunner()
    try:
        runner.run()
    except KeyboardInterrupt:
        logger.info("Interrompido pelo usuário. Desligando...")
        runner.stop()
