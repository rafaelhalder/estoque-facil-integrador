"""Persistência SQLite. Cada operação abre sua própria conexão."""
import sqlite3
from contextlib import contextmanager
from pathlib import Path


SCHEMA = '''
CREATE TABLE IF NOT EXISTS products (
 id INTEGER PRIMARY KEY,
 sku TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 100),
 category TEXT NOT NULL DEFAULT '',
 unit TEXT NOT NULL DEFAULT 'un',
 price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
 min_stock INTEGER NOT NULL CHECK(min_stock >= 0),
 stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0 AND stock <= 1000000),
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
 version INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE TABLE IF NOT EXISTS movements (
 id INTEGER PRIMARY KEY,
 product_id INTEGER NOT NULL REFERENCES products(id),
 kind TEXT NOT NULL CHECK(kind IN ('entrada', 'saida')),
 quantity INTEGER NOT NULL CHECK(quantity > 0 AND quantity <= 1000000),
 note TEXT NOT NULL DEFAULT '',
 balance_after INTEGER NOT NULL CHECK(balance_after >= 0),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_movements_product ON movements(product_id, id DESC);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
'''


class Database:
    def __init__(self, path):
        self.path = Path(path)

    @contextmanager
    def connect(self, write=False):
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute('PRAGMA foreign_keys=ON')
        try:
            if write:
                # Serializa saldo e histórico para impedir saídas concorrentes indevidas.
                connection.execute('BEGIN IMMEDIATE')
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def initialize(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.execute('PRAGMA journal_mode=WAL')
            connection.executescript(SCHEMA)

    def seed_demo(self):
        """Carga fictícia, executada uma única vez e apenas em base vazia."""
        with self.connect(write=True) as connection:
            if connection.execute('SELECT 1 FROM settings WHERE key=?', ('demo_seeded',)).fetchone():
                return
            if not connection.execute('SELECT 1 FROM products').fetchone():
                items = [
                    ('PAP-001', 'Caderno universitário', 'Papelaria', 1890, 10, 32),
                    ('PAP-002', 'Caneta esferográfica azul', 'Papelaria', 250, 20, 12),
                    ('ORG-001', 'Pasta organizadora', 'Organização', 1250, 8, 18),
                    ('ESC-001', 'Grampeador de mesa', 'Escritório', 2990, 5, 4),
                    ('PAP-003', 'Bloco de notas adesivas', 'Papelaria', 690, 10, 24),
                    ('ESC-002', 'Tesoura de uso geral', 'Escritório', 1590, 5, 0),
                ]
                for sku, name, category, price, minimum, stock in items:
                    cursor = connection.execute('INSERT INTO products(sku,name,category,price_cents,min_stock,stock) VALUES(?,?,?,?,?,?)',
                                                (sku, name, category, price, minimum, stock))
                    if stock:
                        connection.execute('INSERT INTO movements(product_id,kind,quantity,note,balance_after) VALUES(?,?,?,?,?)',
                                           (cursor.lastrowid, 'entrada', stock, 'Carga inicial fictícia para demonstração', stock))
            connection.execute('INSERT INTO settings(key,value) VALUES(?,?)', ('demo_seeded', '1'))


class ProductRepository:
    """Consultas de leitura do catálogo e do histórico."""
    def __init__(self, database):
        self.database = database

    def list(self):
        with self.database.connect() as connection:
            return [dict(row) for row in connection.execute('SELECT * FROM products WHERE active=1 ORDER BY name COLLATE NOCASE')]

    def movements(self):
        with self.database.connect() as connection:
            return [dict(row) for row in connection.execute('''
                SELECT m.*,p.name AS product_name,p.sku,p.unit
                FROM movements m JOIN products p ON p.id=m.product_id
                ORDER BY m.id DESC
            ''')]
