-- بروزرسانی جداول موجود برای پشتیبانی از سیستم فاکتور جدید
USE gold_shop_db;

-- اضافه کردن ستون شهر به جدول مشتریان
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(100) AFTER national_id;

-- اضافه کردن ستون‌های جدید به جدول فاکتورها
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) DEFAULT 0 AFTER subtotal;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_weight DECIMAL(8,3) DEFAULT 0 AFTER grand_total;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS plastic_weight DECIMAL(8,3) DEFAULT 0 AFTER total_weight;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS final_weight DECIMAL(8,3) DEFAULT 0 AFTER plastic_weight;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT AFTER final_weight;

-- اضافه کردن ستون‌های جدید به جدول آیتم‌های فاکتور
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS weight DECIMAL(8,3) NOT NULL DEFAULT 0 AFTER total_price;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS carat INT NOT NULL DEFAULT 18 AFTER weight;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS description TEXT AFTER carat;

-- Update Invoice System for Manual Gold Pricing
USE gold_shop_db;

-- Update invoice_items table to support manual pricing fields
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS manual_weight DECIMAL(8,3) DEFAULT 0 COMMENT 'وزن دستی وارد شده',
ADD COLUMN IF NOT EXISTS daily_gold_price DECIMAL(15,2) DEFAULT 0 COMMENT 'قیمت طلای روز',
ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(15,2) DEFAULT 0 COMMENT 'هزینه اجرت',
ADD COLUMN IF NOT EXISTS profit_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'مبلغ سود',
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'مبلغ مالیات',
ADD COLUMN IF NOT EXISTS final_unit_price DECIMAL(15,2) DEFAULT 0 COMMENT 'قیمت نهایی واحد',
ADD COLUMN IF NOT EXISTS labor_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'درصد اجرت',
ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'درصد مالیات';

-- Update invoices table to add fields for manual calculations
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS total_labor_cost DECIMAL(15,2) DEFAULT 0 COMMENT 'مجموع اجرت',
ADD COLUMN IF NOT EXISTS total_profit DECIMAL(15,2) DEFAULT 0 COMMENT 'مجموع سود',
ADD COLUMN IF NOT EXISTS total_tax DECIMAL(15,2) DEFAULT 0 COMMENT 'مجموع مالیات',
ADD COLUMN IF NOT EXISTS manual_total_weight DECIMAL(8,3) DEFAULT 0 COMMENT 'مجموع وزن دستی',
ADD COLUMN IF NOT EXISTS invoice_date_shamsi VARCHAR(20) DEFAULT NULL COMMENT 'تاریخ شمسی فاکتور';

-- Create view for better item display with category information
CREATE OR REPLACE VIEW inventory_items_with_categories AS
SELECT 
    i.id,
    i.item_code,
    i.item_name,
    i.carat,
    i.current_quantity,
    i.image_path,
    c.name_persian as category_name,
    parent.name_persian as parent_category_name,
    CASE 
        WHEN parent.name_persian IS NOT NULL THEN 
            CONCAT('[', c.name_persian, '] ', i.item_name, ' - ', i.carat, ' عیار - موجودی: ', i.current_quantity)
        ELSE 
            CONCAT('[', c.name_persian, '] ', i.item_name, ' - ', i.carat, ' عیار - موجودی: ', i.current_quantity)
    END as display_name,
    c.id as category_id,
    c.parent_id
FROM inventory_items i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN categories parent ON c.parent_id = parent.id
WHERE i.current_quantity > 0
ORDER BY parent.sort_order, c.sort_order, i.item_name; 