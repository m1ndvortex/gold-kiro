-- Update script for invoice system improvements
-- Adds support for purchase invoices and enhanced fields

-- Check if invoice_type column exists and add if not
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'invoices' 
AND column_name = 'invoice_type';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE invoices ADD COLUMN invoice_type ENUM(\'sale\', \'purchase\') DEFAULT \'sale\' AFTER invoice_date', 
    'SELECT "invoice_type column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if invoice_date_shamsi column exists and add if not
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'invoices' 
AND column_name = 'invoice_date_shamsi';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE invoices ADD COLUMN invoice_date_shamsi VARCHAR(10) AFTER invoice_date', 
    'SELECT "invoice_date_shamsi column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if total_labor_cost column exists and add if not
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'invoices' 
AND column_name = 'total_labor_cost';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE invoices ADD COLUMN total_labor_cost DECIMAL(15,2) DEFAULT 0 AFTER final_weight', 
    'SELECT "total_labor_cost column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if total_profit column exists and add if not
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'invoices' 
AND column_name = 'total_profit';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE invoices ADD COLUMN total_profit DECIMAL(15,2) DEFAULT 0 AFTER total_labor_cost', 
    'SELECT "total_profit column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if total_tax column exists and add if not
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'invoices' 
AND column_name = 'total_tax';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE invoices ADD COLUMN total_tax DECIMAL(15,2) DEFAULT 0 AFTER total_profit', 
    'SELECT "total_tax column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if manual_total_weight column exists and add if not
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'invoices' 
AND column_name = 'manual_total_weight';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE invoices ADD COLUMN manual_total_weight DECIMAL(8,3) DEFAULT 0 AFTER total_tax', 
    'SELECT "manual_total_weight column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update invoice_items table with additional fields
-- Check if labor_percentage column exists and add if not
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'invoice_items' 
AND column_name = 'labor_percentage';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE invoice_items ADD COLUMN labor_percentage DECIMAL(5,2) DEFAULT 0 AFTER total_price', 
    'SELECT "labor_percentage column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if labor_cost column exists and add if not
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'invoice_items' 
AND column_name = 'labor_cost';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE invoice_items ADD COLUMN labor_cost DECIMAL(15,2) DEFAULT 0 AFTER labor_percentage', 
    'SELECT "labor_cost column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if profit_amount column exists and add if not
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'invoice_items' 
AND column_name = 'profit_amount';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE invoice_items ADD COLUMN profit_amount DECIMAL(15,2) DEFAULT 0 AFTER labor_cost', 
    'SELECT "profit_amount column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if tax_percentage column exists and add if not
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'invoice_items' 
AND column_name = 'tax_percentage';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE invoice_items ADD COLUMN tax_percentage DECIMAL(5,2) DEFAULT 0 AFTER profit_amount', 
    'SELECT "tax_percentage column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if tax_cost column exists and add if not
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'invoice_items' 
AND column_name = 'tax_cost';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE invoice_items ADD COLUMN tax_cost DECIMAL(15,2) DEFAULT 0 AFTER tax_percentage', 
    'SELECT "tax_cost column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for invoice_type if not exists
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'invoices' 
AND index_name = 'idx_invoice_type';

SET @sql = IF(@index_exists = 0, 
    'ALTER TABLE invoices ADD INDEX idx_invoice_type (invoice_type)', 
    'SELECT "idx_invoice_type index already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Invoice system database update completed successfully!' as message; 