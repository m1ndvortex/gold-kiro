# راهنمای نصب سیستم مدیریت طلافروشی

## مرحله ۱: نصب Node.js و MySQL

### نصب Node.js
1. از وبسایت [nodejs.org](https://nodejs.org) آخرین نسخه LTS را دانلود کنید
2. فایل را نصب کنید
3. برای تست: `node --version` و `npm --version`

### نصب MySQL
دو روش موجود است:

#### روش ۱: نصب مستقیم MySQL
1. از [mysql.com](https://dev.mysql.com/downloads/mysql/) دانلود کنید
2. در حین نصب، رمز root را تنظیم کنید
3. MySQL Workbench را نیز نصب کنید

#### روش ۲: استفاده از XAMPP (آسان‌تر)
1. از [apachefriends.org](https://www.apachefriends.org/) دانلود کنید
2. XAMPP را نصب و اجرا کنید
3. MySQL را از کنترل پنل XAMPP فعال کنید

## مرحله ۲: نصب Dependencies

```bash
cd gold
npm install
```

**نکته مهم**: نصب Puppeteer ممکن است چند دقیقه طول بکشد چون Chromium را دانلود می‌کند.

اگر با خطا مواجه شدید:
```bash
npm install --ignore-engines
# یا
npm install --legacy-peer-deps
```

## مرحله ۳: راه‌اندازی دیتابیس

### ایجاد دیتابیس جدید
```sql
CREATE DATABASE gold_shop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### ایمپورت Schema
```bash
mysql -u root -p gold_shop_db < database/schema.sql
```

### بروزرسانی دیتابیس موجود
اگر قبلاً دیتابیس دارید:
```bash
mysql -u root -p gold_shop_db < database/invoice_update.sql
```

## مرحله ۴: تنظیمات

### تنظیم اتصال دیتابیس
فایل `config/database.js` را ویرایش کنید:

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'رمز_شما',
    database: 'gold_shop_db',
    port: 3306
};
```

## مرحله ۵: اجرای برنامه

```bash
npm start
```

سپس به آدرس `http://localhost:3000` بروید.

**اطلاعات ورود پیش‌فرض:**
- نام کاربری: `admin`
- رمز عبور: `admin123`

## حل مشکلات رایج

### خطای اتصال دیتابیس
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**حل:**
1. مطمئن شوید MySQL در حال اجرا است
2. رمز عبور را در `config/database.js` بررسی کنید
3. پورت ۳۳۰۶ آزاد باشد

### خطای Puppeteer
```
Error: Failed to launch the browser process
```

**حل:**
```bash
npm uninstall puppeteer
npm install puppeteer
```

### خطای Permission در لینوکس
```bash
sudo chown -R $USER:$USER node_modules
```

### خطای Port in use
```
Error: listen EADDRINUSE :::3000
```

**حل:**
- پورت ۳۰۰۰ را آزاد کنید یا در `server.js` پورت دیگری تعیین کنید

## ویژگی‌های جدید سیستم فروش

### قابلیت‌های فاکتور:
- ✅ مشاهده، ویرایش، حذف فاکتور
- ✅ چاپ و ذخیره PDF
- ✅ طراحی فاکتور مطابق الگوی ارسال شده
- ✅ کنترل موجودی انبار
- ✅ محاسبات تخفیف و وزن پولاستیک
- ✅ بروزرسانی خودکار حسابداری

### مسیرهای فاکتور:
- `/sales` - لیست فاکتورها
- `/sales/new` - ایجاد فاکتور جدید
- `/sales/view/:id` - مشاهده فاکتور
- `/sales/edit/:id` - ویرایش فاکتور
- `/sales/print/:id` - چاپ فاکتور
- `/sales/pdf/:id` - دانلود PDF

## پشتیبانی

در صورت بروز مشکل:
1. فایل‌های log را بررسی کنید
2. مطمئن شوید تمام dependencies نصب شده‌اند
3. دیتابیس به‌درستی تنظیم شده باشد 