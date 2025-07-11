-- Initialize Categories System
USE gold_shop_db;

-- Create categories table if not exists
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_persian VARCHAR(200) NOT NULL,
    parent_id INT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_parent_id (parent_id),
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
);

-- Add category_id column to inventory_items if not exists
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = 'gold_shop_db' 
AND table_name = 'inventory_items' 
AND column_name = 'category_id';

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE inventory_items ADD COLUMN category_id INT AFTER type_id, ADD FOREIGN KEY fk_category (category_id) REFERENCES categories(id)', 
    'SELECT "category_id column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert main categories
INSERT IGNORE INTO categories (id, name, name_persian, parent_id, description, sort_order) VALUES
(1, 'jewelry', 'جواهرات', NULL, 'انواع جواهرات طلا', 1),
(2, 'coins', 'سکه و گرمی', NULL, 'سکه‌ها و طلای گرمی', 2),
(3, 'raw_gold', 'طلای خام', NULL, 'طلای آب‌شده و خام', 3),
(4, 'accessories', 'اکسسوری', NULL, 'انواع اکسسوری طلا', 4);

-- Insert subcategories for jewelry
INSERT IGNORE INTO categories (id, name, name_persian, parent_id, description, sort_order) VALUES
-- Jewelry subcategories
(5, 'rings', 'انگشتر', 1, 'انواع انگشتر طلا', 1),
(6, 'necklaces', 'گردنبند', 1, 'انواع گردنبند طلا', 2),
(7, 'bracelets', 'دستبند', 1, 'انواع دستبند طلا', 3),
(8, 'earrings', 'گوشواره', 1, 'انواع گوشواره طلا', 4),
(9, 'sets', 'نیم‌ست', 1, 'ست‌های طلا', 5),
(10, 'pendants', 'آویز', 1, 'انواع آویز طلا', 6),

-- Coins subcategories  
(11, 'full_coins', 'سکه تمام', 2, 'سکه‌های تمام طلا', 1),
(12, 'half_coins', 'نیم سکه', 2, 'نیم سکه‌های طلا', 2),
(13, 'quarter_coins', 'ربع سکه', 2, 'ربع سکه‌های طلا', 3),
(14, 'gram_gold', 'طلای گرمی', 2, 'طلای گرمی', 4),

-- Raw gold subcategories
(15, 'melted_gold', 'طلای آب‌شده', 3, 'طلای ذوب شده', 1),
(16, 'scrap_gold', 'ضایعات طلا', 3, 'ضایعات و قراضه طلا', 2),

-- Accessories subcategories
(17, 'watches', 'ساعت', 4, 'ساعت‌های طلا', 1),
(18, 'chains', 'زنجیر', 4, 'انواع زنجیر طلا', 2),
(19, 'cufflinks', 'دکمه سر آستین', 4, 'دکمه‌های طلا', 3);

-- Update existing inventory items to use new category system if category_id is null
UPDATE inventory_items SET category_id = (
    CASE 
        WHEN type_id = 1 THEN 5  -- ring -> rings
        WHEN type_id = 2 THEN 6  -- necklace -> necklaces  
        WHEN type_id = 3 THEN 7  -- bracelet -> bracelets
        WHEN type_id = 4 THEN 8  -- earring -> earrings
        WHEN type_id = 5 THEN 11 -- coin -> full_coins
        WHEN type_id = 6 THEN 15 -- melted_gold -> melted_gold
        ELSE 5 -- default to rings
    END
) WHERE category_id IS NULL;

SELECT 'Categories initialized successfully!' as message; 