-- Update Categories System for Professional Inventory Management
USE gold_shop_db;

-- Create new categories table with hierarchical structure
CREATE TABLE categories (
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

-- Add category_id to inventory_items table
ALTER TABLE inventory_items 
ADD COLUMN category_id INT AFTER type_id,
ADD FOREIGN KEY fk_category (category_id) REFERENCES categories(id);

-- Insert main categories (parent categories)
INSERT INTO categories (name, name_persian, parent_id, description, sort_order) VALUES
('jewelry', 'جواهرات', NULL, 'انواع جواهرات طلا', 1),
('coins', 'سکه و گرمی', NULL, 'سکه‌ها و طلای گرمی', 2),
('raw_gold', 'طلای خام', NULL, 'طلای آب‌شده و خام', 3),
('accessories', 'اکسسوری', NULL, 'انواع اکسسوری طلا', 4);

-- Insert subcategories for jewelry
INSERT INTO categories (name, name_persian, parent_id, description, sort_order) VALUES
-- Jewelry subcategories
('rings', 'انگشتر', 1, 'انواع انگشتر طلا', 1),
('necklaces', 'گردنبند', 1, 'انواع گردنبند طلا', 2),
('bracelets', 'دستبند', 1, 'انواع دستبند طلا', 3),
('earrings', 'گوشواره', 1, 'انواع گوشواره طلا', 4),
('sets', 'نیم‌ست', 1, 'ست‌های طلا', 5),
('pendants', 'آویز', 1, 'انواع آویز طلا', 6),

-- Coins subcategories  
('full_coins', 'سکه تمام', 2, 'سکه‌های تمام طلا', 1),
('half_coins', 'نیم سکه', 2, 'نیم سکه‌های طلا', 2),
('quarter_coins', 'ربع سکه', 2, 'ربع سکه‌های طلا', 3),
('gram_gold', 'طلای گرمی', 2, 'طلای گرمی', 4),

-- Raw gold subcategories
('melted_gold', 'طلای آب‌شده', 3, 'طلای ذوب شده', 1),
('scrap_gold', 'ضایعات طلا', 3, 'ضایعات و قراضه طلا', 2),

-- Accessories subcategories
('watches', 'ساعت', 4, 'ساعت‌های طلا', 1),
('chains', 'زنجیر', 4, 'انواع زنجیر طلا', 2),
('cufflinks', 'دکمه سر آستین', 4, 'دکمه‌های طلا', 3);

-- Update existing inventory items to use new category system
-- Map old type_id to new category_id
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
);

-- Create backup of old item_types data
CREATE TABLE item_types_backup AS SELECT * FROM item_types;

-- Note: We keep item_types table for now to maintain compatibility
-- You can drop it later after confirming everything works:
-- DROP TABLE item_types; 