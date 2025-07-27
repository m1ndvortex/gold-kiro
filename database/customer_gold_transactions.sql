-- Migration: Create customer_gold_transactions table
-- Description: جدول مدیریت تراکنش‌های طلای مشتریان
-- Date: 2025-01-27

-- ایجاد جدول تراکنش‌های طلای مشتریان
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
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    -- Indexes for performance optimization
    INDEX idx_customer_date (customer_id, transaction_date),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- اضافه کردن constraints اضافی برای اعتبارسنجی
ALTER TABLE customer_gold_transactions 
ADD CONSTRAINT chk_amount_positive CHECK (amount_grams > 0);

-- اضافه کردن index ترکیبی برای queries پیچیده
CREATE INDEX idx_customer_type_date ON customer_gold_transactions (customer_id, transaction_type, transaction_date);