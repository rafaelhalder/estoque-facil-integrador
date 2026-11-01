"""Testa as regras de estoque em um banco SQLite temporário."""
import sqlite3
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from estoque.models import Database, ProductRepository
from estoque.services import InventoryService, AppError


def product(**changes):
    return {'sku': 'TST-001', 'name': 'Produto de teste', 'category': 'Papelaria',
            'unit': 'un', 'price': '12,50', 'min_stock': 3, 'initial_stock': 10, **changes}


class InventoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = Database(Path(self.temp.name) / 'test.sqlite')
        self.db.initialize()
        self.service = InventoryService(self.db)

    def tearDown(self):
        self.temp.cleanup()

    def test_empty_state(self):
        state = self.service.snapshot()
        self.assertEqual(state['products'], [])
        self.assertEqual(state['summary']['value_cents'], 0)

    def test_create_and_initial_audit(self):
        item = self.service.create_product(product())
        self.assertEqual(item['price_cents'], 1250)
        self.assertEqual(item['stock'], 10)
        movement = self.service.snapshot()['movements'][0]
        self.assertEqual((movement['kind'], movement['quantity'], movement['balance_after']), ('entrada', 10, 10))

    def test_zero_stock_no_movement(self):
        self.service.create_product(product(initial_stock=0))
        self.assertEqual(self.service.snapshot()['movements'], [])

    def test_duplicate_code_case_insensitive(self):
        self.service.create_product(product())
        with self.assertRaises(AppError) as context:
            self.service.create_product(product(sku='tst-001'))
        self.assertEqual(context.exception.status, 409)
        self.assertEqual(len(self.service.snapshot()['products']), 1)

    def test_invalid_product_fields(self):
        invalid = [{'name': 'A'}, {'sku': 'foo bar'}, {'price': '-1'}, {'price': '1.001'},
                   {'price': 'NaN'}, {'price': 'Infinity'}, {'price': True}, {'price': []},
                   {'min_stock': -1}, {'initial_stock': 1.5}, {'initial_stock': True},
                   {'initial_stock': '9' * 5000}, {'unit': 'kg'}, {'name': 'Teste\nInválido'}]
        for changes in invalid:
            with self.subTest(changes=str(changes)[:80]), self.assertRaises(AppError):
                self.service.create_product(product(**changes))
        self.assertEqual(self.service.snapshot()['products'], [])

    def test_entry_and_exit(self):
        item = self.service.create_product(product())
        self.service.move({'product_id': item['id'], 'kind': 'entrada', 'quantity': 5})
        move = self.service.move({'product_id': item['id'], 'kind': 'saida', 'quantity': 12, 'note': 'Venda'})
        self.assertEqual(move['balance_after'], 3)
        self.assertEqual(len(self.service.snapshot()['movements']), 3)
        self.assertEqual(self.service.snapshot()['summary']['low_stock'], 1)

    def test_exit_exact_balance(self):
        item = self.service.create_product(product())
        self.service.move({'product_id': item['id'], 'kind': 'saida', 'quantity': 10})
        self.assertEqual(self.service.snapshot()['products'][0]['stock'], 0)

    def test_insufficient_stock_rolls_back(self):
        item = self.service.create_product(product())
        before = self.service.snapshot()
        with self.assertRaises(AppError) as context:
            self.service.move({'product_id': item['id'], 'kind': 'saida', 'quantity': 11})
        self.assertEqual(context.exception.status, 409)
        self.assertEqual(self.service.snapshot(), before)

    def test_invalid_movements_do_not_change_balance(self):
        item = self.service.create_product(product())
        for changes in [{'quantity': 0}, {'quantity': -1}, {'quantity': '1.1'}, {'kind': 'out'},
                        {'product_id': 999}, {'note': 'x' * 251}, {'quantity': 1000001}]:
            with self.subTest(changes=changes), self.assertRaises(AppError):
                self.service.move({'product_id': item['id'], 'kind': 'entrada', 'quantity': 1, **changes})
        self.assertEqual(self.service.snapshot()['products'][0]['stock'], 10)

    def test_stock_limit(self):
        item = self.service.create_product(product(initial_stock=1000000))
        with self.assertRaises(AppError):
            self.service.move({'product_id': item['id'], 'kind': 'entrada', 'quantity': 1})
        self.assertEqual(self.service.snapshot()['products'][0]['stock'], 1000000)

    def test_transaction_rolls_back_if_history_write_fails(self):
        item = self.service.create_product(product())
        with self.db.connect() as connection:
            connection.execute("CREATE TRIGGER fail_history BEFORE INSERT ON movements BEGIN SELECT RAISE(ABORT, 'Teste de rollback'); END")
        with self.assertRaises(sqlite3.IntegrityError):
            self.service.move({'product_id': item['id'], 'kind': 'entrada', 'quantity': 5})
        self.assertEqual(self.service.snapshot()['products'][0]['stock'], 10)

    def test_update_preserves_balance(self):
        item = self.service.create_product(product())
        updated = self.service.update_product(item['id'], product(name='Nome revisado', price='15.99', version=item['version'], initial_stock=999))
        self.assertEqual((updated['name'], updated['stock'], updated['price_cents']), ('Nome revisado', 10, 1599))

    def test_outdated_edit_is_rejected(self):
        item = self.service.create_product(product())
        self.service.move({'product_id': item['id'], 'kind': 'entrada', 'quantity': 1})
        with self.assertRaises(AppError) as context:
            self.service.update_product(item['id'], product(name='Nome desatualizado', version=item['version']))
        self.assertEqual(context.exception.status, 409)

    def test_archive_requires_zero_and_preserves_history(self):
        item = self.service.create_product(product())
        with self.assertRaises(AppError):
            self.service.archive_product(item['id'], {'version': item['version']})
        self.service.move({'product_id': item['id'], 'kind': 'saida', 'quantity': 10})
        latest = self.service.snapshot()['products'][0]
        self.service.archive_product(item['id'], {'version': latest['version']})
        state = self.service.snapshot()
        self.assertEqual(state['products'], [])
        self.assertEqual(len(state['movements']), 2)
        with self.assertRaises(AppError):
            self.service.move({'product_id': item['id'], 'kind': 'entrada', 'quantity': 1})

    def test_concurrent_exits_cannot_oversell(self):
        item = self.service.create_product(product(initial_stock=5))
        def attempt(_):
            try:
                self.service.move({'product_id': item['id'], 'kind': 'saida', 'quantity': 4})
                return 'success'
            except AppError:
                return 'rejected'
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(attempt, range(2)))
        self.assertCountEqual(results, ['success', 'rejected'])
        self.assertEqual(self.service.snapshot()['products'][0]['stock'], 1)
        self.assertEqual(len(self.service.snapshot()['movements']), 2)

    def test_summary_and_reopen_persistence(self):
        self.service.create_product(product())
        self.service.create_product(product(sku='TST-002', initial_stock=2, min_stock=2, price='5.00'))
        reloaded = InventoryService(Database(self.db.path))
        self.assertEqual(reloaded.snapshot()['summary'], {'products': 2, 'units': 12, 'low_stock': 1, 'value_cents': 13500})

    def test_demo_seed_is_idempotent(self):
        self.db.seed_demo()
        before = self.service.snapshot()
        self.db.seed_demo()
        self.assertEqual(self.service.snapshot(), before)
        self.assertEqual(before['summary']['products'], 6)

    def test_read_repositories(self):
        self.service.create_product(product())
        repository = ProductRepository(self.db)
        self.assertEqual(len(repository.list()), 1)
        self.assertEqual(repository.movements()[0]['sku'], 'TST-001')


if __name__ == '__main__':
    unittest.main()
