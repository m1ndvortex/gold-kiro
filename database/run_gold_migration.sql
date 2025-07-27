-- ========================================
-- Gold Accounts Migration Execution Script
-- ========================================
-- Usage: mysql -u username -p database_name < run_gold_migration.sql
-- ========================================

-- نمایش اطلاعات پایگاه داده فعلی
SELECT 
    DATABASE() as current_database,
    USER() as current_user,
    NOW() as execution_time;

-- بررسی وجود جداول مورد نیاز
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('customers', 'users')
ORDER BY TABLE_NAME;

-- اجرای migration اصلی
SOURCE gold_accounts_migration.sql;

-- بررسی نتیجه migration
SELECT 'Migration verification:' as step;

-- بررسی ایجاد جدول customer_gold_transactions
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCCESS: customer_gold_transactions table created'
        ELSE 'ERROR: customer_gold_transactions table not found'
    END as table_status
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'customer_gold_transactions';

-- بررسی اضافه شدن فیلد gold_balance_grams
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCCESS: gold_balance_grams column added to customers'
        ELSE 'ERROR: gold_balance_grams column not found in customers table'
    END as column_status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'customers' 
AND COLUMN_NAME = 'gold_balance_grams';

-- بررسی ایجاد indexes
SELECT 
    CONCAT('INDEX: ', INDEX_NAME, ' on ', TABLE_NAME) as index_info
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND (
    (TABLE_NAME = 'customer_gold_transactions' AND INDEX_NAME LIKE 'idx_%') OR
    (TABLE_NAME = 'customers' AND INDEX_NAME = 'idx_customers_gold_balance')
)
ORDER BY TABLE_NAME, INDEX_NAME;

-- بررسی stored procedures
SELECT 
    ROUTINE_NAME,
    ROUTINE_TYPE,
    CREATED
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_NAME IN ('CalculateCustomerGoldBalance', 'UpdateAllCustomersGoldBalance');

-- بررسی triggers
SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    ACTION_TIMING
FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE TRIGGER_SCHEMA = DATABASE() 
AND TRIGGER_NAME LIKE 'trg_gold_transaction_%';

SELECT 'Migration completed! Check the results above.' as final_message;