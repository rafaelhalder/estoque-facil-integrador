CREATE TABLE `movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`product_id` integer NOT NULL,
	`kind` text NOT NULL,
	`quantity` integer NOT NULL,
	`note` text NOT NULL,
	`balance_after` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "valid_kind" CHECK("movements"."kind" IN ('entrada','saida')),
	CONSTRAINT "quantity_range" CHECK("movements"."quantity" BETWEEN 1 AND 1000000),
	CONSTRAINT "balance_range" CHECK("movements"."balance_after" BETWEEN 0 AND 1000000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `movements_token_unique` ON `movements` (`token`);--> statement-breakpoint
CREATE INDEX `product_movements` ON `movements` (`product_id`);--> statement-breakpoint
CREATE TABLE `participants` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`token` text NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL,
	`price_cents` integer NOT NULL,
	`min_stock` integer NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	CONSTRAINT "stock_range" CHECK("products"."stock" BETWEEN 0 AND 1000000),
	CONSTRAINT "minimum_range" CHECK("products"."min_stock" BETWEEN 0 AND 1000000),
	CONSTRAINT "price_range" CHECK("products"."price_cents" BETWEEN 0 AND 100000000),
	CONSTRAINT "valid_unit" CHECK("products"."unit" IN ('un','cx','pct')),
	CONSTRAINT "valid_active" CHECK("products"."active" IN (0,1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_token_unique` ON `products` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `owner_sku` ON `products` (`owner_id`,`sku`);--> statement-breakpoint
CREATE INDEX `owner_products` ON `products` (`owner_id`);
--> statement-breakpoint
CREATE TRIGGER movement_check BEFORE INSERT ON movements BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM products WHERE id=NEW.product_id AND active=1)
 THEN RAISE(ABORT,'Produto inativo') END;
 SELECT CASE WHEN NEW.balance_after != (SELECT stock FROM products WHERE id=NEW.product_id)
 + CASE WHEN NEW.kind='entrada' THEN NEW.quantity ELSE -NEW.quantity END
 THEN RAISE(ABORT,'Saldo inconsistente') END;
END;
--> statement-breakpoint
CREATE TRIGGER movement_apply AFTER INSERT ON movements BEGIN
 UPDATE products SET stock=NEW.balance_after,version=version+1,
 updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.product_id;
END;
