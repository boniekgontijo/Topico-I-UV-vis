"""Servidor local de desenvolvimento sem cache (python3 tools/servir.py [porta])."""
import functools, http.server, sys

class SemCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
http.server.ThreadingHTTPServer(("", porta), functools.partial(SemCache, directory="public")).serve_forever()
