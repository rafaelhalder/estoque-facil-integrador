"""Confere os dados e aplica as regras de estoque, sem depender das telas."""
import re
import sqlite3
from decimal import Decimal, InvalidOperation
from .models import ProductRepository


class AppError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def integer(value, label, minimum=0, maximum=1000000):
    if isinstance(value, bool) or not isinstance(value, (str, int)) or not re.fullmatch(r'\d+', str(value)):
        raise AppError(f'{label} deve ser um número inteiro.')
    if len(str(value)) > 10:
        raise AppError(f'{label} ultrapassa o limite permitido.')
    result = int(value)
    if not minimum <= result <= maximum:
        raise AppError(f'{label} deve estar entre {minimum} e {maximum}.')
    return result


def clean_text(value, label, minimum=0, maximum=100):
    if not isinstance(value, str):
        raise AppError(f'{label} deve ser texto.')
    result = value.strip()
    if not minimum <= len(result) <= maximum or any(ord(c) < 32 for c in result):
        raise AppError(f'{label} deve ter entre {minimum} e {maximum} caracteres, sem caracteres de controle.')
    return result


def product_fields(data):
    sku = clean_text(data.get('sku', ''), 'Código', 2, 30).upper()
    if not re.fullmatch(r'[A-Z0-9][A-Z0-9_-]*', sku):
        raise AppError('Código deve conter apenas letras, números, hífen ou sublinhado.')
    name = clean_text(data.get('name', ''), 'Nome', 2, 100)
    category = clean_text(data.get('category', ''), 'Categoria', 0, 50)
    unit = data.get('unit', 'un')
    if unit not in ('un', 'cx', 'pct'):
        raise AppError('Unidade inválida. Use un, cx ou pct.')
    raw_price = data.get('price', '0')
    if not isinstance(raw_price, (str, int)) or isinstance(raw_price, bool):
        raise AppError('Preço deve ser um valor decimal com até duas casas.')
    try:
        price = Decimal(str(raw_price).replace(',', '.'))
        if not price.is_finite() or price < 0 or price > 1000000 or price.as_tuple().exponent < -2:
            raise InvalidOperation
        cents = int(price * 100)
    except (InvalidOperation, ValueError, OverflowError):
        raise AppError('Preço deve estar entre 0 e 1.000.000, com até duas casas decimais.') from None
    minimum = integer(data.get('min_stock', 0), 'Estoque mínimo')
    return sku, name, category, unit, cents, minimum


class InventoryService:
    def __init__(self, database):
        self.database = database
        self.repository = ProductRepository(database)

    def snapshot(self):
        # Lê tudo na mesma transação para o resumo bater com o catálogo e o histórico.
        with self.database.connect() as connection:
            connection.execute('BEGIN')
            products = [dict(row) for row in connection.execute('SELECT * FROM products WHERE active=1 ORDER BY name COLLATE NOCASE')]
            movements = [dict(row) for row in connection.execute('''SELECT m.*,p.name AS product_name,p.sku,p.unit
                FROM movements m JOIN products p ON p.id=m.product_id ORDER BY m.id DESC LIMIT 500''')]
        return {'products': products, 'movements': movements, 'summary': {
            'products': len(products),
            'units': sum(p['stock'] for p in products),
            'low_stock': sum(p['stock'] <= p['min_stock'] for p in products),
            'value_cents': sum(p['stock'] * p['price_cents'] for p in products),
        }, 'movement_limit': 500}

    def create_product(self, data):
        fields = product_fields(data)
        stock = integer(data.get('initial_stock', 0), 'Estoque inicial')
        try:
            with self.database.connect(write=True) as connection:
                cursor = connection.execute('''INSERT INTO products(sku,name,category,unit,price_cents,min_stock,stock)
                    VALUES(?,?,?,?,?,?,?)''', (*fields, stock))
                product_id = cursor.lastrowid
                if stock:
                    connection.execute('''INSERT INTO movements(product_id,kind,quantity,note,balance_after)
                        VALUES(?,?,?,?,?)''', (product_id, 'entrada', stock, 'Estoque inicial do cadastro', stock))
                return dict(connection.execute('SELECT * FROM products WHERE id=?', (product_id,)).fetchone())
        except sqlite3.IntegrityError:
            raise AppError('Este código já foi utilizado. Escolha outro código, inclusive se o produto anterior foi arquivado.', 409) from None

    def update_product(self, product_id, data):
        fields = product_fields(data)
        version = integer(data.get('version'), 'Versão', 1, 2147483647)
        try:
            with self.database.connect(write=True) as connection:
                self._product(connection, product_id)
                cursor = connection.execute('''UPDATE products SET sku=?,name=?,category=?,unit=?,price_cents=?,min_stock=?,
                    version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
                    WHERE id=? AND active=1 AND version=?''', (*fields, product_id, version))
                if not cursor.rowcount:
                    raise AppError('Este produto mudou em outra janela. Atualize a página antes de editar.', 409)
                return dict(connection.execute('SELECT * FROM products WHERE id=?', (product_id,)).fetchone())
        except sqlite3.IntegrityError:
            raise AppError('Este código já foi utilizado por outro produto.', 409) from None

    def archive_product(self, product_id, data):
        version = integer(data.get('version'), 'Versão', 1, 2147483647)
        with self.database.connect(write=True) as connection:
            product = self._product(connection, product_id)
            if product['version'] != version:
                raise AppError('Este produto mudou em outra janela. Atualize a página.', 409)
            if product['stock']:
                raise AppError('Somente produtos com saldo zero podem ser arquivados. Registre a saída antes.', 409)
            connection.execute("UPDATE products SET active=0,version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", (product_id,))

    def move(self, data):
        product_id = integer(data.get('product_id'), 'Produto', 1, 2147483647)
        quantity = integer(data.get('quantity'), 'Quantidade', 1)
        kind = data.get('kind')
        if kind not in ('entrada', 'saida'):
            raise AppError('Selecione entrada ou saída.')
        note = clean_text(data.get('note', ''), 'Observação', 0, 250)
        with self.database.connect(write=True) as connection:
            product = self._product(connection, product_id)
            balance = product['stock'] + (quantity if kind == 'entrada' else -quantity)
            if balance < 0:
                raise AppError(f'Saldo insuficiente. Disponível: {product["stock"]} {product["unit"]}.', 409)
            if balance > 1000000:
                raise AppError('A movimentação ultrapassa o limite de 1.000.000 unidades por produto.')
            connection.execute("UPDATE products SET stock=?,version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", (balance, product_id))
            cursor = connection.execute('INSERT INTO movements(product_id,kind,quantity,note,balance_after) VALUES(?,?,?,?,?)',
                                        (product_id, kind, quantity, note, balance))
            return dict(connection.execute('SELECT * FROM movements WHERE id=?', (cursor.lastrowid,)).fetchone())

    @staticmethod
    def _product(connection, product_id):
        row = connection.execute('SELECT * FROM products WHERE id=? AND active=1', (product_id,)).fetchone()
        if not row:
            raise AppError('Produto não encontrado ou arquivado.', 404)
        return row
