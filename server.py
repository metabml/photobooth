from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import threading

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
        self.send_header('Cross-Origin-Embedder-Policy', 'credentialless')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
        SimpleHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        self.path = self.path.split('?')[0]
        if self.path == '/':
            self.path = '/index.html'
        try:
            return SimpleHTTPRequestHandler.do_GET(self)
        except Exception as e:
            print(f"Error serving {self.path}: {e}")
            self.send_error(404, f"File not found: {self.path}")

def run_server_local():
    port = 8000
    httpd = HTTPServer(('localhost', port), CORSRequestHandler)
    print(f"Serving at http://localhost:{port}")
    print(f"Current directory: {os.getcwd()}")

    def stop_server():
        input("Press Enter to stop the server...\n")
        httpd.shutdown()
        print("Server stopped.")

    # Run the server shutdown in a separate thread
    stop_thread = threading.Thread(target=stop_server)
    stop_thread.start()

    # Start the server
    httpd.serve_forever()
    stop_thread.join()

def run_server():
    # Use environment variable for port, default to 8000
    port = int(os.environ.get('PORT', 8000))
    # Bind to all interfaces
    httpd = HTTPServer(('0.0.0.0', port), CORSRequestHandler)
    print(f"Serving at http://0.0.0.0:{port}")
    print(f"Current directory: {os.getcwd()}")

if __name__ == '__main__':
    run_server_local()
