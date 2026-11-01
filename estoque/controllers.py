"""Recebe os pedidos da interface e envia as páginas e os dados."""
import csv
import io
import json
import logging
import re
import sqlite3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
from .services import InventoryService, AppError


def csv_cell(value):
    value = str(value)
    # Evita que um texto cadastrado seja executado como fórmula na planilha.
    return "'" + value if value.lstrip().startswith(('=', '+', '-', '@')) else value


def make_server(database, static_dir, port=8765, demo=False):
    service = InventoryService(database)

    class Handler(BaseHTTPRequestHandler):
        server_version = 'EstoqueFacil/1.0'

        def log_message(self, format, *args):
            logging.info('%s %s', self.address_string(), format % args)

        def _reply(self, status, body, content_type='application/json; charset=utf-8', extra=None):
            if not isinstance(body, bytes):
                body = json.dumps(body, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(body)))
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Referrer-Policy', 'no-referrer')
            self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
            if extra:
                for key, value in extra.items():
                    self.send_header(key, value)
            self.end_headers()
            self.wfile.write(body)

        def _guard(self, write=False):
            allowed = {f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}'}
            if self.headers.get('Host') not in allowed:
                raise AppError('Host não permitido. Acesse pelo endereço local informado no terminal.', 403)
            origin = self.headers.get('Origin')
            if origin and origin not in {f'http://{host}' for host in allowed}:
                raise AppError('Origem não permitida.', 403)
            document_navigation = (self.command == 'GET' and self.headers.get('Sec-Fetch-Mode') == 'navigate'
                                   and self.headers.get('Sec-Fetch-Dest') == 'document'
                                   and urlsplit(self.path).path == '/')
            if self.headers.get('Sec-Fetch-Site') == 'cross-site' and not document_navigation:
                raise AppError('Requisição externa não permitida.', 403)
            if write and self.headers.get('Content-Type', '').split(';')[0].strip() != 'application/json':
                raise AppError('Envie os dados em JSON.', 415)

        def _body(self):
            try:
                length = int(self.headers.get('Content-Length', '0'))
            except ValueError:
                raise AppError('Tamanho de requisição inválido.') from None
            if length < 1 or length > 16384:
                raise AppError('Requisição vazia ou maior que 16 KB.', 413)
            try:
                data = json.loads(self.rfile.read(length))
            except (ValueError, UnicodeDecodeError):
                raise AppError('JSON inválido.') from None
            if not isinstance(data, dict):
                raise AppError('O corpo da requisição deve ser um objeto JSON.')
            return data

        def _handle(self, write=False):
            try:
                self._guard(write)
                path = urlsplit(self.path).path
                if not write:
                    if path == '/api/state':
                        self._reply(200, {**service.snapshot(), 'demo': demo})
                    elif path == '/api/export':
                        output = io.StringIO(newline='')
                        writer = csv.writer(output, delimiter=';')
                        writer.writerow(['Código', 'Produto', 'Categoria', 'Unidade', 'Saldo', 'Mínimo', 'Preço unitário (R$)'])
                        for product in service.repository.list():
                            writer.writerow([csv_cell(product['sku']), csv_cell(product['name']), csv_cell(product['category']),
                                             product['unit'], product['stock'], product['min_stock'],
                                             f'{product["price_cents"] / 100:.2f}'.replace('.', ',')])
                        self._reply(200, ('\ufeff' + output.getvalue()).encode('utf-8'), 'text/csv; charset=utf-8',
                                    {'Content-Disposition': 'attachment; filename="estoque.csv"'})
                    else:
                        files = {'/': ('index.html', 'text/html; charset=utf-8'),
                                 '/app.js': ('app.js', 'text/javascript; charset=utf-8'),
                                 '/style.css': ('style.css', 'text/css; charset=utf-8'),
                                 '/favicon.svg': ('favicon.svg', 'image/svg+xml')}
                        if path not in files:
                            raise AppError('Página não encontrada.', 404)
                        filename, content_type = files[path]
                        self._reply(200, (static_dir / filename).read_bytes(), content_type)
                    return
                data = self._body()
                match = re.fullmatch(r'/api/products/(\d+)', path)
                if self.command == 'POST' and path == '/api/products':
                    self._reply(201, service.create_product(data))
                elif self.command == 'POST' and path == '/api/movements':
                    self._reply(201, service.move(data))
                elif match and self.command == 'PUT':
                    self._reply(200, service.update_product(int(match[1]), data))
                elif match and self.command == 'DELETE':
                    service.archive_product(int(match[1]), data)
                    self._reply(200, {'message': 'Produto arquivado. O histórico foi preservado.'})
                else:
                    raise AppError('Operação não encontrada.', 404)
            except AppError as exc:
                self._reply(exc.status, {'error': str(exc)})
            except sqlite3.OperationalError:
                logging.exception('Falha de acesso ao banco')
                self._reply(503, {'error': 'Banco temporariamente indisponível. Tente novamente.'})
            except Exception:
                logging.exception('Falha inesperada')
                self._reply(500, {'error': 'Não foi possível concluir a operação. Consulte o terminal e tente novamente.'})

        def do_GET(self):
            self._handle()

        def do_POST(self):
            self._handle(True)

        def do_PUT(self):
            self._handle(True)

        def do_DELETE(self):
            self._handle(True)

    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    server.daemon_threads = True
    return server
