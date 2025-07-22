# راهنمای سیستم مدیریت موجودی طلا

## نصب و راه‌اندازی

### 1. ایجاد جداول دیتابیس
ابتدا باید جداول مورد نیاز را در دیتابیس ایجاد کنید:

```sql
-- اجرای فایل create-gold-inventory-tables.sql
mysql -u root -p gold_shop_db < create-gold-inventory-tables.sql
```

یا به صورت دستی:

```sql
-- Create gold inventory table
CREATE TABLE IF NOT EXISTS gold_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_date DATETIME NOT NULL,
    transaction_date_shamsi VARCHAR(20),
    transaction_type ENUM('initial', 'sale', 'purchase', 'adjustment') NOT NULL,
    reference_id INT,
    weight_change DECIMAL(10,3) NOT NULL COMMENT 'Positive for additions, negative for reductions',
    current_weight DECIMAL(10,3) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create settings table for storing the initial gold inventory
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert initial gold inventory setting
INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES ('gold_inventory_initial', '0');
```

## ویژگی‌های سیستم

### 1. ردیابی خودکار موجودی
- **فاکتور فروش**: به صورت خودکار وزن طلا از موجودی کم می‌شود
- **فاکتور خرید**: به صورت خودکار وزن طلا به موجودی اضافه می‌شود

### 2. مدیریت دستی موجودی
- تنظیم مقدار دقیق موجودی
- افزودن به موجودی فعلی
- کاهش از موجودی فعلی

### 3. گزارش‌گیری
- موجودی فعلی طلا
- تغییرات روزانه
- تغییرات هفتگی
- تغییرات ماهانه
- تاریخچه کامل تراکنش‌ها

## نحوه استفاده

### 1. دسترسی به سیستم
- وارد بخش **حسابداری** شوید
- روی **موجودی طلا** کلیک کنید

### 2. تنظیم موجودی اولیه
1. روی دکمه **تنظیم موجودی** کلیک کنید
2. **نوع تنظیم** را روی "تنظیم مقدار دقیق" قرار دهید
3. مقدار موجودی فعلی طلا را به گرم وارد کنید
4. توضیحات مناسب اضافه کنید
5. روی **ثبت تغییرات** کلیک کنید

### 3. مشاهده گزارش‌ها
صفحه موجودی طلا شامل:
- **کارت‌های آماری**: موجودی فعلی و تغییرات دوره‌ای
- **جدول تاریخچه**: تمام تراکنش‌های مربوط به موجودی طلا

### 4. ردیابی خودکار
- هنگام صدور **فاکتور فروش**: وزن نهایی طلا (پس از کسر پلاستیک) از موجودی کم می‌شود
- هنگام صدور **فاکتور خرید**: وزن نهایی طلا به موجودی اضافه می‌شود

## انواع تراکنش‌ها

### 1. موجودی اولیه (Initial)
- تنظیم موجودی اولیه سیستم

### 2. فروش (Sale)
- کاهش موجودی در اثر فروش
- مرتبط با فاکتور فروش

### 3. خرید (Purchase)
- افزایش موجودی در اثر خرید
- مرتبط با فاکتور خرید

### 4. تنظیم دستی (Adjustment)
- تغییرات دستی توسط کاربر
- برای اصلاح موجودی یا تنظیمات

## نکات مهم

1. **دقت در وزن**: همیشه وزن‌ها را به گرم و با دقت 3 رقم اعشار وارد کنید
2. **پلاستیک**: وزن پلاستیک به صورت خودکار از وزن کل کسر می‌شود
3. **تاریخ شمسی**: تمام تراکنش‌ها با تاریخ شمسی ثبت می‌شوند
4. **پیوند با فاکتورها**: تراکنش‌های خرید و فروش به فاکتورهای مربوطه لینک می‌شوند

## عیب‌یابی

### مشکل: جداول ایجاد نشده‌اند
**راه‌حل**: فایل SQL را مجدداً اجرا کنید

### مشکل: موجودی منفی می‌شود
**راه‌حل**: 
1. موجودی اولیه را بررسی کنید
2. از طریق تنظیم دستی موجودی را اصلاح کنید

### مشکل: تراکنش‌ها ثبت نمی‌شوند
**راه‌حل**:
1. اتصال دیتابیس را بررسی کنید
2. مجوزهای جداول را چک کنید

## پشتیبانی

برای مشکلات فنی یا سوالات بیشتر، لطفاً با تیم پشتیبانی تماس بگیرید.