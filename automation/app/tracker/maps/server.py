"""Servidor HTTP local para servir os assets e template do mapa em 127.0.0.1."""

import http.server
import logging
import os
import threading
from typing import Optional

logger = logging.getLogger(__name__)


class LocalAssetServer:
    """Servidor HTTP interno, rodando em thread de segundo plano, escutando apenas em localhost."""

    def __init__(self, directory: str):
        self.directory = os.path.abspath(directory)
        self.port: int = 0
        self._server: Optional[http.server.ThreadingHTTPServer] = None
        self._thread: Optional[threading.Thread] = None

    def start(self) -> int:
        """Inicia o servidor em uma porta aleatória disponível e retorna a porta."""
        if self._server is not None:
            return self.port

        directory = self.directory

        class CustomHandler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=directory, **kwargs)

            def log_message(self, format_str, *args):
                # Suprime logs verbose de requisições estáticas para evitar poluir o console
                logger.debug(f"LocalAssetServer: {format_str % args}")

            def end_headers(self):
                # Adiciona headers de CORS para desenvolvimento local se necessário
                self.send_header("Access-Control-Allow-Origin", "*")
                super().end_headers()

        # Vincula a 127.0.0.1 na porta 0 (porta livre aleatória escolhida pelo SO)
        self._server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), CustomHandler)
        self.port = self._server.server_address[1]

        self._thread = threading.Thread(
            target=self._server.serve_forever,
            name="tracker-map-assets-server",
            daemon=True
        )
        self._thread.start()
        logger.info(f"Servidor local iniciado em http://127.0.0.1:{self.port} servindo {self.directory}")
        return self.port

    def stop(self):
        """Encerra o servidor HTTP local de forma limpa."""
        if self._server is not None:
            self._server.shutdown()
            self._server.server_close()
            self._server = None
            self._thread = None
            logger.info("Servidor local de assets encerrado.")
