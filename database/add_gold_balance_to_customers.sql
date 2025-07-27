-- Migration: Add gold_balance_grams field to customers table
-- Description: اضافه کردن فیلد موجودی طلا به جدول مشتریان
-- Date: 2025-01-27

-- اضافه کردن فیلد موجودی طلا به جدول customers
ALTER TABLE customers 
ADD COLUMN gold_balance_grams DECIMAL(8,3) DEFAULT 0 COMMENT 'موجودی طلا بر حسب گرم (مثبت=بستانکار، منفی=بدهکار)';

-- اضافه کردن index برای فیلد جدید
CREATE INDEX idx_customers_gold_balance ON customers (gold_balance_grams);

-- بروزرسانی موجودی طلا برای مشتریان موجود (در صورت وجود تراکنش‌های قبلی)
-- این query فقط در صورت وجود داده‌های قبلی اجرا شود
UPDATE customers c 
SET gold_balance_grams = COALESCE((
    SELECT SUM(
        CASE 
            WHEN cgt.transaction_type = 'credit' THEN cgt.amount_grams
            WHEN cgt.transaction_type = 'debit' THEN -cgt.amount_grams
            ELSE 0
        END
    )
    FROM customer_gold_transactions cgt 
    WHERE cgt.customer_id = c.id
), 0)
WHERE EXISTS (
    SELECT 1 FROM customer_gold_transactions cgt2 
    WHERE cgt2.customer_id = c.id
);