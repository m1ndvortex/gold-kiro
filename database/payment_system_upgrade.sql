-- ==========================================
-- Payment System Upgrade Script
-- ==========================================

-- 1. Add payment tracking fields to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'مبلغ پرداخت شده',
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'مبلغ باقیمانده',
ADD COLUMN IF NOT EXISTS payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid' COMMENT 'وضعیت پرداخت';

-- 2. Create invoice_payments junction table for tracking payments per invoice
CREATE TABLE IF NOT EXISTS invoice_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    payment_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL COMMENT 'مبلغ پرداخت شده برای این فاکتور',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_payment_id (payment_id)
) COMMENT 'جدول ارتباط پرداخت‌ها با فاکتورها';

-- 3. Add invoice_id to payments table for direct reference
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS invoice_id INT NULL COMMENT 'شماره فاکتور مرتبط',
ADD FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- 4. Create accounts table for proper accounting system
CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_code VARCHAR(10) NOT NULL UNIQUE COMMENT 'کد حساب',
    account_name VARCHAR(100) NOT NULL COMMENT 'نام حساب',
    account_type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL COMMENT 'نوع حساب',
    parent_id INT NULL COMMENT 'حساب والد',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES accounts(id),
    INDEX idx_account_code (account_code),
    INDEX idx_account_type (account_type)
) COMMENT 'دفتر حساب‌ها';

-- 5. Create journal_entries table for double-entry bookkeeping
CREATE TABLE IF NOT EXISTS journal_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entry_number VARCHAR(20) NOT NULL UNIQUE COMMENT 'شماره سند',
    entry_date DATE NOT NULL COMMENT 'تاریخ سند',
    description TEXT NOT NULL COMMENT 'شرح سند',
    reference_type ENUM('invoice', 'payment', 'adjustment', 'manual') NOT NULL COMMENT 'نوع مرجع',
    reference_id INT NULL COMMENT 'شماره مرجع',
    total_debit DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'مجموع بدهکار',
    total_credit DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'مجموع بستانکار',
    created_by INT NOT NULL COMMENT 'ایجاد کننده',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_entry_number (entry_number),
    INDEX idx_entry_date (entry_date),
    INDEX idx_reference (reference_type, reference_id)
) COMMENT 'دفتر روزنامه';

-- 6. Create journal_entry_details table for individual account entries
CREATE TABLE IF NOT EXISTS journal_entry_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    journal_entry_id INT NOT NULL,
    account_id INT NOT NULL,
    debit_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'مبلغ بدهکار',
    credit_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'مبلغ بستانکار',
    description TEXT COMMENT 'شرح ردیف',
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    INDEX idx_journal_entry (journal_entry_id),
    INDEX idx_account (account_id)
) COMMENT 'جزئیات دفتر روزنامه';

-- 7. Insert basic chart of accounts
INSERT IGNORE INTO accounts (account_code, account_name, account_type) VALUES
('1000', 'دارایی‌ها', 'asset'),
('1100', 'دارایی‌های جاری', 'asset'),
('1110', 'صندوق', 'asset'),
('1120', 'بانک', 'asset'),
('1130', 'حساب‌های دریافتنی', 'asset'),
('1200', 'موجودی کالا', 'asset'),
('2000', 'بدهی‌ها', 'liability'),
('2100', 'بدهی‌های جاری', 'liability'),
('2110', 'حساب‌های پرداختنی', 'liability'),
('3000', 'حقوق صاحبان سهام', 'equity'),
('3100', 'سرمایه', 'equity'),
('4000', 'درآمدها', 'revenue'),
('4100', 'فروش', 'revenue'),
('5000', 'هزینه‌ها', 'expense'),
('5100', 'بهای تمام شده کالای فروش رفته', 'expense');

-- 8. Update existing invoices to calculate remaining amounts
UPDATE invoices 
SET remaining_amount = grand_total - IFNULL(paid_amount, 0),
    payment_status = CASE 
        WHEN IFNULL(paid_amount, 0) = 0 THEN 'unpaid'
        WHEN IFNULL(paid_amount, 0) >= grand_total THEN 'paid'
        ELSE 'partial'
    END;

-- 9. Create triggers to automatically update payment status
DELIMITER //

CREATE TRIGGER IF NOT EXISTS update_invoice_payment_status 
AFTER INSERT ON invoice_payments
FOR EACH ROW
BEGIN
    DECLARE total_paid DECIMAL(15,2);
    DECLARE invoice_total DECIMAL(15,2);
    
    -- Calculate total paid for this invoice
    SELECT IFNULL(SUM(amount), 0) INTO total_paid
    FROM invoice_payments 
    WHERE invoice_id = NEW.invoice_id;
    
    -- Get invoice total
    SELECT grand_total INTO invoice_total
    FROM invoices 
    WHERE id = NEW.invoice_id;
    
    -- Update invoice payment status
    UPDATE invoices 
    SET paid_amount = total_paid,
        remaining_amount = invoice_total - total_paid,
        payment_status = CASE 
            WHEN total_paid = 0 THEN 'unpaid'
            WHEN total_paid >= invoice_total THEN 'paid'
            ELSE 'partial'
        END
    WHERE id = NEW.invoice_id;
END//

DELIMITER ;

-- 10. Create view for customer balance summary
CREATE OR REPLACE VIEW customer_balance_summary AS
SELECT 
    c.id,
    c.customer_code,
    c.full_name,
    IFNULL(SUM(i.grand_total), 0) as total_purchases,
    IFNULL(SUM(p.amount), 0) as total_payments,
    IFNULL(SUM(i.grand_total), 0) - IFNULL(SUM(p.amount), 0) as current_balance,
    CASE 
        WHEN IFNULL(SUM(i.grand_total), 0) - IFNULL(SUM(p.amount), 0) > 0 THEN 'debtor'
        WHEN IFNULL(SUM(i.grand_total), 0) - IFNULL(SUM(p.amount), 0) < 0 THEN 'creditor'
        ELSE 'balanced'
    END as balance_status
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id AND i.status = 'active'
LEFT JOIN payments p ON c.id = p.customer_id
GROUP BY c.id, c.customer_code, c.full_name;

-- 11. Create view for invoice payment status
CREATE OR REPLACE VIEW invoice_payment_status AS
SELECT 
    i.id,
    i.invoice_number,
    i.customer_id,
    c.full_name as customer_name,
    i.grand_total,
    IFNULL(i.paid_amount, 0) as paid_amount,
    IFNULL(i.remaining_amount, i.grand_total) as remaining_amount,
    i.payment_status,
    i.invoice_date,
    i.created_at
FROM invoices i
JOIN customers c ON i.customer_id = c.id
WHERE i.status = 'active';

COMMIT;