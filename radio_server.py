from __future__ import annotations

import os
import socket
import sys
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


HOST = "0.0.0.0"
PORT = 8765
PROJECT_DIR = Path(__file__).resolve().parent
COMPUTER_URL = f"http://127.0.0.1:{PORT}/index.html"


def get_lan_ip() -> str:
    probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        probe.connect(("8.8.8.8", 80))
        return str(probe.getsockname()[0])
    except OSError:
        try:
            return socket.gethostbyname(socket.gethostname())
        except OSError:
            return "BILGISAYAR_IP_ADRESI"
    finally:
        probe.close()


PHONE_URL = f"http://{get_lan_ip()}:{PORT}/index.html"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        # Sunucu penceresi kapansa veya çıktı kanalı ayrılsa bile HTTP yanıtlarını
        # etkilememesi için her istek için konsola log yazma.
        return


class RadioServer(ThreadingHTTPServer):
    allow_reuse_address = False
    allow_reuse_port = False


def info(message: str) -> None:
    if sys.stdout is not None:
        print(message)


def main() -> None:
    os.chdir(PROJECT_DIR)

    try:
        server = RadioServer((HOST, PORT), QuietHandler)
    except OSError:
        # Sunucu zaten açıksa yeni kopya başlatma; çalışan radyoyu aç.
        webbrowser.open(COMPUTER_URL)
        return

    info("OmurFM hazir.")
    info(f"Bilgisayar: {COMPUTER_URL}")
    info(f"Telefon:    {PHONE_URL}")
    info("Telefon ve bilgisayar ayni Wi-Fi aginda olmalidir.")

    threading.Timer(0.8, lambda: webbrowser.open(COMPUTER_URL)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
