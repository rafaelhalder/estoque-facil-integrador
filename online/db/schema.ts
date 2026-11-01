import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, uniqueIndex, index, check } from "drizzle-orm/sqlite-core";

export const participants = sqliteTable("participants", {
  ownerId: text("owner_id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
});
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: text("owner_id").notNull(),
  token: text("token").notNull().unique(),
  sku: text("sku").notNull(), name: text("name").notNull(),
  category: text("category").notNull(), unit: text("unit").notNull(),
  priceCents: integer("price_cents").notNull(), minStock: integer("min_stock").notNull(),
  stock: integer("stock").notNull().default(0),
  active: integer("active").notNull().default(1), version: integer("version").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
}, t => [uniqueIndex("owner_sku").on(t.ownerId,t.sku), index("owner_products").on(t.ownerId),
  check("stock_range",sql`${t.stock} BETWEEN 0 AND 1000000`),
  check("minimum_range",sql`${t.minStock} BETWEEN 0 AND 1000000`),
  check("price_range",sql`${t.priceCents} BETWEEN 0 AND 100000000`),
  check("valid_unit",sql`${t.unit} IN ('un','cx','pct')`),
  check("valid_active",sql`${t.active} IN (0,1)`)]);
export const movements = sqliteTable("movements", {
  id: integer("id").primaryKey({autoIncrement:true}),
  token: text("token").notNull().unique(),
  productId: integer("product_id").notNull().references(()=>products.id),
  kind: text("kind").notNull(), quantity: integer("quantity").notNull(),
  note: text("note").notNull(), balanceAfter: integer("balance_after").notNull(),
  createdAt: text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
},t=>[index("product_movements").on(t.productId),
  check("valid_kind",sql`${t.kind} IN ('entrada','saida')`),
  check("quantity_range",sql`${t.quantity} BETWEEN 1 AND 1000000`),
  check("balance_range",sql`${t.balanceAfter} BETWEEN 0 AND 1000000`)]);
