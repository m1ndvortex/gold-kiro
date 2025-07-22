-- Add missing payment tracking columns to invoices table
USE gold_shop_db;

-- Add payment tracking fields to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'مبلغ پرداخت شده',
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'مبلغ باقیمانده',
ADD COLUMN IF NOT EXISTS payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid' COMMENT 'وضعیت پرداخت';

-- Update existing invoices to set proper remaining amounts
UPDATE invoices 
SET remaining_amount = grand_total - IFNULL(paid_amount, 0),
    payment_status = CASE 
        WHEN IFNULL(paid_amount, 0) = 0 THEN 'unpaid'
        WHEN IFNULL(paid_amount, 0) >= grand_total THEN 'paid'
        ELSE 'partial'
    END
WHERE remaining_amount = 0 OR remaining_amount IS NULL;

-- Add invoice_id to payments table for direct reference if not exists
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS invoice_id INT NULL COMMENT 'شماره فاکتور مرتبط',
ADD INDEX IF NOT EXISTS idx_invoice_id (invoice_id);

-- Add foreign key constraint if not exists
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'gold_shop_db' 
    AND TABLE_NAME = 'payments' 
    AND COLUMN_NAME = 'invoice_id' 
    AND REFERENCED_TABLE_NAME = 'invoices'
);

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE payments ADD FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL', 
    'SELECT "Foreign key already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Invoice payment columns added successfully!' as message;