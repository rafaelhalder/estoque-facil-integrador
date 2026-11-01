"""Testa a API com um servidor local e um banco temporário."""
import csv
import http.client
import io
import json
import tempfile
import threading
import unittest
from pathlib import Path
from estoque.controllers import make_server
from estoque.models import Database
from test_inventory import product


class HttpTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = Database(Path(self.temp.name) / 'http.sqlite')
        self.db.initialize()
        self.server = make_server(self.db, Path(__file__).resolve().parents[1] / 'static', port=0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temp.cleanup()

    def request(self, method, path, data=None, headers=None, raw=None):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=5)
        body = raw if raw is not None else json.dumps(data) if data is not None else None
        request_headers = {'Content-Type': 'application/json', **(headers or {})}
        connection.request(method, path, body, request_headers)
        response = connection.getresponse()
        result = response.status, dict(response.getheaders()), response.read()
        connection.close()
        return result

    def test_static_assets_and_security_headers(self):
        for path in ['/', '/style.css', '/app.js', '/favicon.svg']:
            with self.subTest(path=path):
                status, headers, body = self.request('GET', path)
                self.assertEqual(status, 200)
                self.assertTrue(body)
                self.assertEqual(headers['X-Content-Type-Options'], 'nosniff')
                self.assertIn("frame-ancestors 'none'", headers['Content-Security-Policy'])

    def test_api_roundtrip(self):
        status, _, body = self.request('POST', '/api/products', product())
        self.assertEqual(status, 201)
        item = json.loads(body)
        self.assertEqual(self.request('PUT', f'/api/products/{item["id"]}', product(version=item['version'], name='Produto editado'))[0], 200)
        self.assertEqual(self.request('POST', '/api/movements', {'product_id': item['id'], 'kind': 'saida', 'quantity': 10})[0], 201)
        state = json.loads(self.request('GET', '/api/state')[2])
        self.assertEqual(state['products'][0]['stock'], 0)
        self.assertEqual(self.request('DELETE', f'/api/products/{item["id"]}', {'version': state['products'][0]['version']})[0], 200)
        self.assertEqual(json.loads(self.request('GET', '/api/state')[2])['products'], [])

    def test_bad_json_and_content_type(self):
        self.assertEqual(self.request('POST', '/api/products', raw='{broken')[0], 400)
        self.assertEqual(self.request('POST', '/api/products', raw='[]')[0], 400)
        self.assertEqual(self.request('POST', '/api/products', product(), {'Content-Type': 'text/plain'})[0], 415)
        self.assertEqual(self.request('POST', '/api/products', raw='x' * 16385)[0], 413)

    def test_cross_origin_and_host_blocked(self):
        self.assertEqual(self.request('GET', '/api/state', headers={'Host': 'untrusted.example'})[0], 403)
        self.assertEqual(self.request('POST', '/api/products', product(), {'Origin': 'https://untrusted.example'})[0], 403)
        self.assertEqual(self.request('POST', '/api/products', product(), {'Sec-Fetch-Site': 'cross-site'})[0], 403)

    def test_external_document_navigation_allowed_but_api_is_blocked(self):
        headers = {'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document'}
        self.assertEqual(self.request('GET', '/', headers=headers)[0], 200)
        self.assertEqual(self.request('GET', '/api/state', headers=headers)[0], 403)

    def test_unknown_routes_and_path_traversal(self):
        for path in ['/missing', '/../app.py', '/%2e%2e/app.py', '/data/estoque.sqlite']:
            self.assertEqual(self.request('GET', path)[0], 404)
        self.assertEqual(self.request('PUT', '/api/products/999', product(version=1))[0], 404)

    def test_csv_utf8_and_formula_escape(self):
        self.request('POST', '/api/products', product(name='=1+1', category='@SOMA(1)', price='10.50'))
        status, headers, body = self.request('GET', '/api/export')
        self.assertEqual(status, 200)
        self.assertIn('attachment', headers['Content-Disposition'])
        rows = list(csv.reader(io.StringIO(body.decode('utf-8-sig')), delimiter=';'))
        self.assertEqual(rows[1][1], "'=1+1")
        self.assertEqual(rows[1][2], "'@SOMA(1)")
        self.assertEqual(rows[1][-1], '10,50')

    def test_duplicate_and_insufficient_return_409(self):
        self.request('POST', '/api/products', product())
        self.assertEqual(self.request('POST', '/api/products', product())[0], 409)
        status, _, body = self.request('POST', '/api/movements', {'product_id': 1, 'kind': 'saida', 'quantity': 11})
        self.assertEqual(status, 409)
        self.assertIn('Saldo insuficiente', json.loads(body)['error'])


if __name__ == '__main__':
    unittest.main()
