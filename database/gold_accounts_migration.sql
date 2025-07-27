-- ========================================
-- Gold Accounts System Migration
-- ========================================
-- Description: مایگریشن کامل سیستم حساب طلای مشتریان
-- Date: 2025-01-27
-- Version: 1.0
-- ========================================

-- شروع transaction برای اطمینان از consistency
START TRANSACTION;

-- ========================================
-- 1. ایجاد جدول تراکنش‌های طلای مشتریان
-- ========================================

CREATE TABLE IF NOT EXISTS customer_gold_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_type ENUM('debit', 'credit') NOT NULL COMMENT 'debit=بدهکار, credit=بستانکار',
    amount_grams DECIMAL(8,3) NOT NULL COMMENT 'مقدار طلا بر حسب گرم',
    description TEXT NOT NULL COMMENT 'توضیحات تراکنش',
    created_by INT NOT NULL COMMENT 'کاربری که تراکنش را ثبت کرده',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 2. اضافه کردن constraints و validation
-- ========================================

-- اطمینان از مثبت بودن مقدار طلا
ALTER TABLE customer_gold_transactions 
ADD CONSTRAINT chk_amount_positive CHECK (amount_grams > 0);

-- ========================================
-- 3. ایجاد indexes برای بهبود عملکرد
-- ========================================

-- Index اصلی برای جستجو بر اساس مشتری و تاریخ
CREATE INDEX idx_customer_date ON customer_gold_transactions (customer_id, transaction_date);

-- Index برای فیلتر بر اساس نوع تراکنش
CREATE INDEX idx_transaction_type ON customer_gold_transactions (transaction_type);

-- Index برای tracking کاربر ایجادکننده
CREATE INDEX idx_created_by ON customer_gold_transactions (created_by);

-- Index برای مرتب‌سازی بر اساس تاریخ ایجاد
CREATE INDEX idx_created_at ON customer_gold_transactions (created_at);

-- Index ترکیبی برای queries پیچیده
CREATE INDEX idx_customer_type_date ON customer_gold_transactions (customer_id, transaction_type, transaction_date);

-- ========================================
-- 4. اضافه کردن فیلد موجودی طلا به جدول customers
-- ========================================

-- بررسی وجود فیلد قبل از اضافه کردن
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'customers' 
    AND COLUMN_NAME = 'gold_balance_grams'
);

-- اضافه کردن فیلد در صورت عدم وجود
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE customers ADD COLUMN gold_balance_grams DECIMAL(8,3) DEFAULT 0 COMMENT ''موجودی طلا بر حسب گرم (مثبت=بستانکار، منفی=بدهکار)''',
    'SELECT ''Column gold_balance_grams already exists'' as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========================================
-- 5. ایجاد index برای فیلد موجودی طلا
-- ========================================

-- بررسی وجود index قبل از ایجاد
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'customers' 
    AND INDEX_NAME = 'idx_customers_gold_balance'
);

-- ایجاد index در صورت عدم وجود
SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_customers_gold_balance ON customers (gold_balance_grams)',
    'SELECT ''Index idx_customers_gold_balance already exists'' as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========================================
-- 6. ایجاد stored procedure برای محاسبه موجودی
-- ========================================

DELIMITER //

DROP PROCEDURE IF EXISTS CalculateCustomerGoldBalance//

CREATE PROCEDURE CalculateCustomerGoldBalance(IN customer_id INT)
BEGIN
    DECLARE balance DECIMAL(8,3) DEFAULT 0;
    
    -- محاسبه موجودی از روی تراکنش‌ها
    SELECT COALESCE(SUM(
        CASE 
            WHEN transaction_type = 'credit' THEN amount_grams
            WHEN transaction_type = 'debit' THEN -amount_grams
            ELSE 0
        END
    ), 0) INTO balance
    FROM customer_gold_transactions 
    WHERE customer_gold_transactions.customer_id = customer_id;
    
    -- بروزرسانی موجودی در جدول customers
    UPDATE customers 
    SET gold_balance_grams = balance 
    WHERE id = customer_id;
    
    SELECT balance as calculated_balance;
END//

DELIMITER ;

-- ========================================
-- 7. ایجاد stored procedure برای بروزرسانی تمام موجودی‌ها
-- ========================================

DELIMITER //

DROP PROCEDURE IF EXISTS UpdateAllCustomersGoldBalance//

CREATE PROCEDURE UpdateAllCustomersGoldBalance()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE cust_id INT;
    DECLARE cur CURSOR FOR SELECT id FROM customers;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO cust_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        CALL CalculateCustomerGoldBalance(cust_id);
    END LOOP;
    
    CLOSE cur;
    
    SELECT 'All customer gold balances updated successfully' as message;
END//

DELIMITER ;

-- ========================================
-- 8. بروزرسانی موجودی برای مشتریان موجود
-- ========================================

-- فقط در صورت وجود تراکنش‌های قبلی
CALL UpdateAllCustomersGoldBalance();

-- ========================================
-- 9. ایجاد trigger برای بروزرسانی خودکار موجودی
-- ========================================

DELIMITER //

-- Trigger برای INSERT
DROP TRIGGER IF EXISTS trg_gold_transaction_insert//
CREATE TRIGGER trg_gold_transaction_insert
    AFTER INSERT ON customer_gold_transactions
    FOR EACH ROW
BEGIN
    CALL CalculateCustomerGoldBalance(NEW.customer_id);
END//

-- Trigger برای UPDATE
DROP TRIGGER IF EXISTS trg_gold_transaction_update//
CREATE TRIGGER trg_gold_transaction_update
    AFTER UPDATE ON customer_gold_transactions
    FOR EACH ROW
BEGIN
    CALL CalculateCustomerGoldBalance(NEW.customer_id);
    -- اگر customer_id تغییر کرده باشد، موجودی مشتری قبلی را هم بروزرسانی کن
    IF OLD.customer_id != NEW.customer_id THEN
        CALL CalculateCustomerGoldBalance(OLD.customer_id);
    END IF;
END//

-- Trigger برای DELETE
DROP TRIGGER IF EXISTS trg_gold_transaction_delete//
CREATE TRIGGER trg_gold_transaction_delete
    AFTER DELETE ON customer_gold_transactions
    FOR EACH ROW
BEGIN
    CALL CalculateCustomerGoldBalance(OLD.customer_id);
END//

DELIMITER ;

-- ========================================
-- 10. تأیید و commit تغییرات
-- ========================================

COMMIT;

-- ========================================
-- 11. نمایش اطلاعات نهایی
-- ========================================

SELECT 'Gold Accounts Migration Completed Successfully!' as status;

-- نمایش تعداد جداول و indexes ایجاد شده
SELECT 
    'customer_gold_transactions' as table_name,
    COUNT(*) as record_count
FROM customer_gold_transactions;

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('customer_gold_transactions', 'customers')
AND INDEX_NAME LIKE '%gold%'
ORDER BY TABLE_NAME, INDEX_NAME;