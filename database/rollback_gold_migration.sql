-- ========================================
-- Gold Accounts Migration Rollback Script
-- ========================================
-- Description: برگرداندن تغییرات migration سیستم حساب طلا
-- Date: 2025-01-27
-- WARNING: این script تمام داده‌های مربوط به حساب طلا را حذف می‌کند
-- ========================================

-- شروع transaction برای اطمینان از consistency
START TRANSACTION;

-- نمایش هشدار
SELECT 'WARNING: This will remove all gold account data!' as warning_message;
SELECT 'Press Ctrl+C to cancel or continue to proceed...' as instruction;

-- ========================================
-- 1. حذف triggers
-- ========================================

DROP TRIGGER IF EXISTS trg_gold_transaction_insert;
DROP TRIGGER IF EXISTS trg_gold_transaction_update;
DROP TRIGGER IF EXISTS trg_gold_transaction_delete;

SELECT 'Triggers removed' as step_1;

-- ========================================
-- 2. حذف stored procedures
-- ========================================

DROP PROCEDURE IF EXISTS CalculateCustomerGoldBalance;
DROP PROCEDURE IF EXISTS UpdateAllCustomersGoldBalance;

SELECT 'Stored procedures removed' as step_2;

-- ========================================
-- 3. حذف indexes از جدول customer_gold_transactions
-- ========================================

-- حذف indexes اضافی (indexes اصلی با حذف جدول حذف می‌شوند)
DROP INDEX IF EXISTS idx_customer_date ON customer_gold_transactions;
DROP INDEX IF EXISTS idx_transaction_type ON customer_gold_transactions;
DROP INDEX IF EXISTS idx_created_by ON customer_gold_transactions;
DROP INDEX IF EXISTS idx_created_at ON customer_gold_transactions;
DROP INDEX IF EXISTS idx_customer_type_date ON customer_gold_transactions;

SELECT 'Indexes from customer_gold_transactions removed' as step_3;

-- ========================================
-- 4. حذف جدول customer_gold_transactions
-- ========================================

DROP TABLE IF EXISTS customer_gold_transactions;

SELECT 'customer_gold_transactions table removed' as step_4;

-- ========================================
-- 5. حذف فیلد gold_balance_grams از جدول customers
-- ========================================

-- حذف index مربوط به فیلد
DROP INDEX IF EXISTS idx_customers_gold_balance ON customers;

-- حذف فیلد
ALTER TABLE customers DROP COLUMN IF EXISTS gold_balance_grams;

SELECT 'gold_balance_grams column removed from customers table' as step_5;

-- ========================================
-- 6. تأیید rollback
-- ========================================

COMMIT;

-- ========================================
-- 7. بررسی نتیجه rollback
-- ========================================

SELECT 'Rollback verification:' as verification;

-- بررسی حذف جدول
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: customer_gold_transactions table removed'
        ELSE 'ERROR: customer_gold_transactions table still exists'
    END as table_status
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'customer_gold_transactions';

-- بررسی حذف فیلد
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: gold_balance_grams column removed'
        ELSE 'ERROR: gold_balance_grams column still exists'
    END as column_status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'customers' 
AND COLUMN_NAME = 'gold_balance_grams';

-- بررسی حذف stored procedures
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: All stored procedures removed'
        ELSE CONCAT('ERROR: ', COUNT(*), ' stored procedures still exist')
    END as procedures_status
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_NAME IN ('CalculateCustomerGoldBalance', 'UpdateAllCustomersGoldBalance');

-- بررسی حذف triggers
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: All triggers removed'
        ELSE CONCAT('ERROR: ', COUNT(*), ' triggers still exist')
    END as triggers_status
FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE TRIGGER_SCHEMA = DATABASE() 
AND TRIGGER_NAME LIKE 'trg_gold_transaction_%';

SELECT 'Rollback completed successfully!' as final_message;