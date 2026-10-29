import http.server
import socketserver
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8888
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable caching so client always gets latest JS/HTML
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Concise logging
        sys.stdout.write(f"[{self.log_date_time_string()}] {args[0]} {args[1]}\n")
        sys.stdout.flush()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
            print(f"==================================================")
            print(f" RoadVision AI 2026 Platform Server Online")
            print(f" URL: http://localhost:{PORT}")
            print(f" Directory: {DIRECTORY}")
            print(f"==================================================")
            sys.stdout.flush()
            httpd.serve_forever()
    except Exception as e:
        print(f"Server error: {e}", file=sys.stderr)
        sys.exit(1)
