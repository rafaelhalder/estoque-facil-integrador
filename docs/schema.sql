-- Esquema da versão implementada
PRAGMA foreign_keys=ON;

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
