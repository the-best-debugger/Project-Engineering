# DEBUG-REPORT — Reproduction Queries (STEP 1)

IMPORTANT: This file contains only the reproduction SQL queries required by Move 1. Do NOT modify the schema before committing this file.

Run these queries against the project's PostgreSQL database (psql, DBeaver, or other client) after running `npm run seed`.

---

Bug 1 — Orders with no associated customer (orphaned orders)

-- Show orders whose `customer_id` does not match any `customers.id`
SELECT o.id AS order_id,
       o.customer_id,
       c.id AS customer_id_found,
       c.name AS customer_name
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.customer_id IS NOT NULL AND c.id IS NULL;

-- Alternative: show count of orphaned orders
SELECT COUNT(*) AS orphaned_orders
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.customer_id IS NOT NULL AND c.id IS NULL;

---

Bug 2 — Products with negative inventory_count

-- Show all products that have negative inventory
SELECT id, name, sku, inventory_count
FROM products
WHERE inventory_count < 0;

-- Summary counts
SELECT COUNT(*) AS products_negative_inventory
FROM products
WHERE inventory_count < 0;

---

Bug 3 — Multiple payments or inconsistent payment status for completed orders

-- Find orders that have more than one payment record
SELECT order_id, COUNT(*) AS payment_count, array_agg(id) AS payment_ids, array_agg(status) AS statuses
FROM payments
GROUP BY order_id
HAVING COUNT(*) > 1;

-- Find completed orders that have no completed payment (either no payment record or non-completed status)
SELECT o.id AS order_id, o.status AS order_status, p.id AS payment_id, p.status AS payment_status
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id
WHERE o.status = 'completed' AND (p.id IS NULL OR p.status <> 'completed');

---

Next steps (after you run the above queries and commit the results):
- Trace the data flow that produced the bad rows (which route/seed/insert created them)
- Identify the missing schema constraint(s)
- Apply schema-level fixes (ALTER TABLE / ADD CONSTRAINT)
- Validate that bad inserts are blocked and previous mis-queries do not show up for new data
