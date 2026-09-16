#!/usr/bin/env python3
"""Local on-set server for the film-prop banking dashboard."""

from __future__ import annotations

import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import socket

ROOT = Path(__file__).resolve().parent
STATE_PATH = ROOT / "data" / "state.json"
PORT = int(os.environ.get("PORT", "8080"))


def load_state() -> dict:
    if STATE_PATH.exists():
        try:
            return json.loads(STATE_PATH.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


def save_state(payload: dict) -> dict:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(payload, indent=2))
    return payload


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/api/state":
            state = load_state()
            if not state:
                self.send_response(204)
                self.end_headers()
                return
            self._json(200, state)
            return
        return super().do_GET()

    def do_POST(self):
        if self.path.split("?", 1)[0] != "/api/state":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._json(400, {"error": "invalid json"})
            return
        if not isinstance(payload, dict):
            self._json(400, {"error": "expected an object"})
            return
        self._json(200, save_state(payload))

    def log_message(self, format, *args):
        print("[%s] %s" % (self.log_date_time_string(), format % args))


def local_ip() -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        sock.close()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    ip = local_ip()
    print(f"Film bank prop running on http://127.0.0.1:{PORT}", flush=True)
    print(f"On-set phone URL:        http://{ip}:{PORT}", flush=True)
    print(f"Admin portal:            http://{ip}:{PORT}/admin.html", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped")
