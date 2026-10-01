# Failure Evidence: T002 Foreign Key Column Type Mismatch

Task:
T002

Failure:
Migration failed with `SQLSTATE[HY000]: General error: 1005 Can't create table tickets (errno: 150 "Foreign key constraint is incorrectly formed")` when adding foreign key constraint on `order_item_id`.

Classification:
Current-task defect / Repository reality check

Root Cause:
`T002` initially declared `$table->foreignUuid('order_item_id')`, assuming `order_items.id` was a UUID. However, inspection of `2026_09_29_000005_create_order_items_table.php` revealed `order_items` uses `$table->id()` (`BIGINT UNSIGNED AUTO_INCREMENT`). MySQL/MariaDB rejected foreign key creation due to mismatched types (`CHAR(36)` referencing `BIGINT UNSIGNED`).

Fix:
Changed column definition in `2026_10_01_000002_create_tickets_table.php` to `$table->foreignId('order_item_id')->nullable()->constrained('order_items')->nullOnDelete()`. Dropped partially created empty table and re-ran migration.

Verification:
`php artisan migrate` executed successfully in 325ms, and `SHOW CREATE TABLE tickets` confirmed `CONSTRAINT tickets_order_item_id_foreign FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE SET NULL`.

Final Result:
PASS
