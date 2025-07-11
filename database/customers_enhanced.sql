-- بهبود جدول مشتریان برای طلافروشی زرین
-- Enhanced Customers Table for Gold Shop Management

-- اضافه کردن فیلدهای جدید به جدول customers
ALTER TABLE customers 
ADD COLUMN email VARCHAR(100) NULL COMMENT 'ایمیل مشتری',
ADD COLUMN birth_date DATE NULL COMMENT 'تاریخ تولد',
ADD COLUMN gender ENUM('male', 'female', 'other') NULL COMMENT 'جنسیت',
ADD COLUMN job_title VARCHAR(100) NULL COMMENT 'شغل',
ADD COLUMN emergency_phone VARCHAR(20) NULL COMMENT 'تماس اضطراری',
ADD COLUMN reference_name VARCHAR(100) NULL COMMENT 'نام معرف',
ADD COLUMN notes TEXT NULL COMMENT 'یادداشت‌ها',
ADD COLUMN customer_type ENUM('normal', 'vip', 'wholesale', 'regular') DEFAULT 'normal' COMMENT 'نوع مشتری',
ADD COLUMN is_active BOOLEAN DEFAULT TRUE COMMENT 'وضعیت فعال/غیرفعال',
ADD COLUMN last_purchase_date DATE NULL COMMENT 'آخرین خرید';

-- اضافه کردن محدودیت unique برای کد ملی (جلوگیری از تکرار)
ALTER TABLE customers 
ADD CONSTRAINT unique_national_id UNIQUE (national_id);

-- اضافه کردن index های مفید برای بهبود عملکرد
ALTER TABLE customers 
ADD INDEX idx_customer_type (customer_type),
ADD INDEX idx_is_active (is_active),
ADD INDEX idx_email (email),
ADD INDEX idx_emergency_phone (emergency_phone),
ADD INDEX idx_birth_date (birth_date);

-- اضافه کردن محدودیت check برای اعتبارسنجی کد ملی
ALTER TABLE customers 
ADD CONSTRAINT check_national_id_length 
CHECK (national_id IS NULL OR CHAR_LENGTH(national_id) = 10);

-- اضافه کردن محدودیت check برای اعتبارسنجی ایمیل
ALTER TABLE customers 
ADD CONSTRAINT check_email_format 
CHECK (email IS NULL OR email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');

-- اضافه کردن محدودیت check برای شماره تماس
ALTER TABLE customers 
ADD CONSTRAINT check_phone_format 
CHECK (phone IS NULL OR phone REGEXP '^09[0-9]{9}$');

-- اضافه کردن محدودیت check برای شماره تماس اضطراری
ALTER TABLE customers 
ADD CONSTRAINT check_emergency_phone_format 
CHECK (emergency_phone IS NULL OR emergency_phone REGEXP '^09[0-9]{9}$');

-- بروزرسانی مشتریان موجود برای تنظیم مقادیر پیش‌فرض
UPDATE customers 
SET 
    customer_type = 'normal',
    is_active = TRUE 
WHERE customer_type IS NULL OR is_active IS NULL;

-- ایجاد تابع برای اعتبارسنجی کد ملی ایرانی
DELIMITER //
CREATE FUNCTION is_valid_iranian_national_id(national_id VARCHAR(10)) 
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE check_digit INT;
    DECLARE sum_digits INT DEFAULT 0;
    DECLARE i INT DEFAULT 1;
    DECLARE digit INT;
    
    -- بررسی طول
    IF CHAR_LENGTH(national_id) != 10 THEN
        RETURN FALSE;
    END IF;
    
    -- بررسی اینکه همه ارقام یکسان نباشند
    IF national_id REGEXP '^[0]{10}$|^[1]{10}$|^[2]{10}$|^[3]{10}$|^[4]{10}$|^[5]{10}$|^[6]{10}$|^[7]{10}$|^[8]{10}$|^[9]{10}$' THEN
        RETURN FALSE;
    END IF;
    
    -- محاسبه چک دیجیت
    WHILE i <= 9 DO
        SET digit = CAST(SUBSTRING(national_id, i, 1) AS UNSIGNED);
        SET sum_digits = sum_digits + (digit * (11 - i));
        SET i = i + 1;
    END WHILE;
    
    SET sum_digits = sum_digits % 11;
    SET check_digit = CAST(SUBSTRING(national_id, 10, 1) AS UNSIGNED);
    
    IF sum_digits < 2 THEN
        RETURN (check_digit = sum_digits);
    ELSE
        RETURN (check_digit = 11 - sum_digits);
    END IF;
END //
DELIMITER ;

-- ایجاد trigger برای اعتبارسنجی کد ملی قبل از insert
DELIMITER //
CREATE TRIGGER validate_national_id_before_insert
BEFORE INSERT ON customers
FOR EACH ROW
BEGIN
    IF NEW.national_id IS NOT NULL AND NOT is_valid_iranian_national_id(NEW.national_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'کد ملی وارد شده معتبر نیست';
    END IF;
END //
DELIMITER ;

-- ایجاد trigger برای اعتبارسنجی کد ملی قبل از update
DELIMITER //
CREATE TRIGGER validate_national_id_before_update
BEFORE UPDATE ON customers
FOR EACH ROW
BEGIN
    IF NEW.national_id IS NOT NULL AND NOT is_valid_iranian_national_id(NEW.national_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'کد ملی وارد شده معتبر نیست';
    END IF;
END //
DELIMITER ;

-- ایجاد view برای گزارش‌گیری آسان مشتریان
CREATE VIEW customer_summary AS
SELECT 
    c.*,
    CASE 
        WHEN c.birth_date IS NOT NULL THEN 
            FLOOR(DATEDIFF(CURDATE(), c.birth_date) / 365.25)
        ELSE NULL 
    END AS age,
    CASE 
        WHEN c.current_balance > 0 THEN 'بدهکار'
        WHEN c.current_balance < 0 THEN 'بستانکار'
        ELSE 'تسویه'
    END AS balance_status,
    CASE 
        WHEN c.last_purchase_date IS NOT NULL THEN 
            DATEDIFF(CURDATE(), c.last_purchase_date)
        ELSE NULL 
    END AS days_since_last_purchase
FROM customers c
WHERE c.is_active = TRUE;

-- کامنت‌های توضیحی برای جدول
ALTER TABLE customers COMMENT = 'جدول اطلاعات مشتریان طلافروشی زرین - نسخه بهبود یافته';

-- نمایش ساختار نهایی جدول
DESCRIBE customers;

-- نمایش محدودیت‌ها
SHOW CREATE TABLE customers;

SELECT 'بهبود جدول مشتریان با موفقیت انجام شد!' AS status; 