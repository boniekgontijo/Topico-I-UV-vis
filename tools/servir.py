"""Servidor local de desenvolvimento sem cache (python3 tools/servir.py [porta])."""
import functools, http.server, socket, sys

class SemCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
try:
    servidor = http.server.ThreadingHTTPServer(("", porta), functools.partial(SemCache, directory="public"))
except OSError:
    sys.exit(f"A porta {porta} já está em uso: o site provavelmente já está rodando em outro terminal.\n"
             f"Abra http://localhost:{porta} ou feche o outro terminal antes de rodar de novo.")
try:  # IP do Mac na rede local (nenhum pacote é enviado)
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
except OSError:
    ip = "IP-do-Mac"
print(f"Site no ar:\n  neste Mac:   http://localhost:{porta}\n  celulares:   http://{ip}:{porta}  (mesmo Wi-Fi)\n"
      f"  professor:   http://{ip}:{porta}/professor.html\nCtrl+C para parar.", flush=True)
try:
    servidor.serve_forever()
except KeyboardInterrupt:
    pass
