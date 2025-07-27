# Gold Accounts Database Migration

این پوشه شامل فایل‌های SQL مورد نیاز برای پیاده‌سازی سیستم حساب طلای مشتریان است.

## فایل‌های موجود

### 1. فایل‌های Migration اصلی

- **`gold_accounts_migration.sql`** - فایل migration کامل و آماده اجرا
- **`run_gold_migration.sql`** - اسکریپت اجرای migration با بررسی‌های لازم
- **`rollback_gold_migration.sql`** - اسکریپت برگرداندن تغییرات

### 2. فایل‌های جزئی

- **`customer_gold_transactions.sql`** - ایجاد جدول تراکنش‌های طلا
- **`add_gold_balance_to_customers.sql`** - اضافه کردن فیلد موجودی طلا

## نحوه اجرا در VPS

### روش 1: اجرای مستقیم (توصیه شده)

```bash
# ورود به MySQL
mysql -u username -p database_name

# اجرای migration
source /path/to/database/run_gold_migration.sql;
```

### روش 2: اجرای از command line

```bash
# اجرای migration
mysql -u username -p database_name < /path/to/database/run_gold_migration.sql

# یا اجرای مستقیم فایل اصلی
mysql -u username -p database_name < /path/to/database/gold_accounts_migration.sql
```

## ساختار ایجاد شده

### جدول `customer_gold_transactions`

```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- customer_id (INT, FOREIGN KEY to customers.id)
- transaction_date (DATE)
- transaction_type (ENUM: 'debit', 'credit')
- amount_grams (DECIMAL(8,3))
- description (TEXT)
- created_by (INT, FOREIGN KEY to users.id)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### فیلد جدید در جدول `customers`

```sql
- gold_balance_grams (DECIMAL(8,3), DEFAULT 0)
```

### Indexes ایجاد شده

- `idx_customer_date` - برای جستجو بر اساس مشتری و تاریخ
- `idx_transaction_type` - برای فیلتر نوع تراکنش
- `idx_created_by` - برای tracking کاربر
- `idx_created_at` - برای مرتب‌سازی زمانی
- `idx_customer_type_date` - index ترکیبی
- `idx_customers_gold_balance` - برای فیلد موجودی در جدول customers

### Stored Procedures

- `CalculateCustomerGoldBalance(customer_id)` - محاسبه موجودی مشتری
- `UpdateAllCustomersGoldBalance()` - بروزرسانی موجودی تمام مشتریان

### Triggers

- `trg_gold_transaction_insert` - بروزرسانی خودکار موجودی پس از INSERT
- `trg_gold_transaction_update` - بروزرسانی خودکار موجودی پس از UPDATE
- `trg_gold_transaction_delete` - بروزرسانی خودکار موجودی پس از DELETE

## بررسی صحت Migration

پس از اجرای migration، موارد زیر بررسی می‌شود:

1. ایجاد جدول `customer_gold_transactions`
2. اضافه شدن فیلد `gold_balance_grams` به جدول `customers`
3. ایجاد تمام indexes مورد نیاز
4. ایجاد stored procedures
5. ایجاد triggers

## Rollback

در صورت نیاز به برگرداندن تغییرات:

```bash
mysql -u username -p database_name < /path/to/database/rollback_gold_migration.sql
```

**هشدار:** Rollback تمام داده‌های مربوط به حساب طلا را حذف می‌کند.

## نکات مهم

1. **Backup**: حتماً قبل از اجرای migration از پایگاه داده backup تهیه کنید
2. **Test Environment**: ابتدا در محیط تست اجرا کنید
3. **Permissions**: اطمینان حاصل کنید کاربر MySQL دسترسی‌های لازم را دارد
4. **Foreign Keys**: جداول `customers` و `users` باید از قبل وجود داشته باشند

## عیب‌یابی

### خطاهای رایج

1. **Foreign Key Error**: بررسی کنید جداول `customers` و `users` وجود دارند
2. **Permission Denied**: کاربر MySQL باید دسترسی CREATE, ALTER, INDEX داشته باشد
3. **Duplicate Column**: اگر فیلد `gold_balance_grams` از قبل وجود دارد، migration آن را نادیده می‌گیرد

### بررسی وضعیت

```sql
-- بررسی وجود جدول
SHOW TABLES LIKE 'customer_gold_transactions';

-- بررسی ساختار جدول
DESCRIBE customer_gold_transactions;

-- بررسی indexes
SHOW INDEX FROM customer_gold_transactions;

-- بررسی فیلد جدید در customers
DESCRIBE customers;
```

## پشتیبانی

در صورت بروز مشکل، لاگ‌های MySQL را بررسی کنید:

```bash
# مشاهده لاگ‌های MySQL
tail -f /var/log/mysql/error.log
```