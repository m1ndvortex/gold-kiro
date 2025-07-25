# راهنمای نصب کامل سیستم مدیریت طلافروشی زرین
## Complete Gold Shop Management System Installation Guide

### 🌟 مشخصات کامل پروژه
- **نام پروژه**: سیستم مدیریت طلافروشی زرین (Gold Shop Management System)
- **نسخه**: 2.0.0 (Enhanced)
- **زبان رابط کاربری**: فارسی (RTL)
- **تکنولوژی**: Node.js, Express.js, MySQL/MariaDB, EJS, Bootstrap
- **ویژگی‌های اصلی**: مدیریت انبار، مشتریان، فروش، حسابداری، بک‌آپ امن

---

## 📋 پیش‌نیازهای سیستم (System Requirements)

### سرور و زیرساخت
- **سیستم عامل**: Windows 10/11, Ubuntu 18.04+, CentOS 7+, macOS 10.15+
- **RAM**: حداقل 2GB (توصیه: 4GB+)
- **فضای ذخیره**: حداقل 5GB (توصیه: 20GB+)
- **پردازنده**: Intel/AMD x64 یا ARM64

### نرم‌افزارهای مورد نیاز
- **Node.js**: نسخه 16.0.0 یا بالاتر
- **MySQL**: نسخه 8.0+ یا MariaDB 10.4+
- **Git**: برای مدیریت کد (اختیاری)
- **PM2**: برای مدیریت پروسه در production (اختیاری)

---

## 🚀 مراحل نصب (Installation Steps)

### مرحله 1: آماده‌سازی محیط

#### Windows:
```cmd
# دانلود و نصب Node.js از nodejs.org
# دانلود و نصب MySQL از mysql.com

# بررسی نصب
node --version
npm --version
mysql --version
```

#### Ubuntu/Debian:
```bash
# بروزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# نصب Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# نصب MySQL
sudo apt install -y mysql-server

# نصب ابزارهای کمکی
sudo apt install -y git curl wget
```

#### CentOS/RHEL:
```bash
# نصب Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# نصب MySQL
sudo yum install -y mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### مرحله 2: پیکربندی دیتابیس

#### راه‌اندازی MySQL:
```bash
# اجرای اسکریپت امنیتی
sudo mysql_secure_installation

# ورود به MySQL
mysql -u root -p
```

#### ایجاد دیتابیس و کاربر:
```sql
-- ایجاد دیتابیس
CREATE DATABASE gold_shop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ایجاد کاربر اختصاصی
CREATE USER 'goldshop_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';

-- اعطای دسترسی‌ها
GRANT ALL PRIVILEGES ON gold_shop_db.* TO 'goldshop_user'@'localhost';
FLUSH PRIVILEGES;

-- خروج
EXIT;
```

### مرحله 3: دانلود و نصب پروژه

#### دانلود پروژه:
```bash
# کلون از repository (اگر در Git موجود است)
git clone [REPOSITORY_URL] gold-shop-management
cd gold-shop-management

# یا دانلود و استخراج فایل ZIP
# سپس:
cd gold-shop-management
```

#### نصب وابستگی‌ها:
```bash
# نصب تمام packages مورد نیاز
npm install

# در صورت بروز خطا، اجرای:
npm install --force
```

### مرحله 4: پیکربندی برنامه

#### ایجاد فایل محیطی (.env):
```bash
# ایجاد فایل .env
touch .env  # Linux/Mac
# یا در Windows: type nul > .env
```

#### محتوای فایل .env:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=goldshop_user
DB_PASSWORD=SecurePassword123!
DB_NAME=gold_shop_db
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development

# Session Configuration
SESSION_SECRET=your_very_secure_session_secret_key_here_2025

# Upload Configuration
UPLOAD_PATH=./public/uploads
MAX_FILE_SIZE=10485760

# Backup Configuration
MAX_BACKUP_FILES=10
BACKUP_RETENTION_DAYS=30
AUTO_BACKUP_ENABLED=true
AUTO_BACKUP_TIME=23:00

# Application Settings
SHOP_NAME=طلافروشی زرین
SHOP_ADDRESS=آدرس طلافروشی
SHOP_PHONE=شماره تماس
```

### مرحله 5: راه‌اندازی دیتابیس

#### وارد کردن اسکیمای اصلی:
```bash
# اگر فایل gold_shop_db.sql موجود است:
mysql -u goldshop_user -p gold_shop_db < gold_shop_db.sql

# یا اگر فایل‌های جداگانه موجود است:
mysql -u goldshop_user -p gold_shop_db < database/schema.sql
mysql -u goldshop_user -p gold_shop_db < database/accounting_tables.sql
mysql -u goldshop_user -p gold_shop_db < database/categories_update.sql
mysql -u goldshop_user -p gold_shop_db < database/customers_enhanced.sql
mysql -u goldshop_user -p gold_shop_db < database/payment_system_upgrade.sql
```

#### اجرای فایل‌های بروزرسانی:
```bash
# اضافه کردن ستون توضیحات به بک‌آپ
mysql -u goldshop_user -p gold_shop_db < add-backup-description-column.sql

# اضافه کردن ستون‌های فاکتور
mysql -u goldshop_user -p gold_shop_db < add-missing-invoice-columns.sql

# ایجاد جداول موجودی طلا
mysql -u goldshop_user -p gold_shop_db < create-gold-inventory-tables.sql
```

### مرحله 6: ایجاد دایرکتوری‌های مورد نیاز

```bash
# ایجاد پوشه‌های ضروری
mkdir -p public/uploads
mkdir -p backups
mkdir -p temp_uploads

# تنظیم مجوزها (Linux/Mac)
chmod 755 public/uploads
chmod 700 backups
chmod 700 temp_uploads

# Windows (در PowerShell با دسترسی مدیر)
# icacls public\uploads /grant Users:F
```

### مرحله 7: تست اولیه سیستم

#### راه‌اندازی سرور:
```bash
# تست اجرا
npm start

# یا برای development:
npm run dev
```

#### بررسی عملکرد:
- مراجعه به: `http://localhost:3000`
- ورود با اطلاعات پیش‌فرض:
  - **نام کاربری**: admin
  - **رمز عبور**: admin123

---

## 🔧 پیکربندی‌های پیشرفته

### 1. تنظیم کاربر مدیر جدید

```bash
# اجرای اسکریپت افزودن کاربر
node add-new-user.js
```

یا به صورت دستی در MySQL:
```sql
-- تغییر رمز عبور admin
UPDATE users SET password = '$2a$10$NEW_HASHED_PASSWORD' WHERE username = 'admin';

-- افزودن کاربر جدید
INSERT INTO users (username, password, full_name, role) VALUES
('manager', '$2a$10$HASHED_PASSWORD', 'مدیر فروشگاه', 'admin');
```

### 2. پیکربندی بک‌آپ خودکار

```bash
# تست سیستم بک‌آپ
node test-backup-system.js

# راه‌اندازی بک‌آپ
node start-backup-system.js
```

### 3. تنظیم نرخ طلا

```sql
-- وارد کردن نرخ روز طلا
INSERT INTO gold_rates (date, rate_per_gram) VALUES
(CURDATE(), 3800000);  -- نرخ به ریال
```

---

## 📁 ساختار کامل پروژه

```
gold-shop-management/
├── config/
│   └── database.js              # پیکربندی دیتابیس
├── database/
│   ├── schema.sql               # اسکیمای اصلی
│   ├── accounting_tables.sql    # جداول حسابداری
│   ├── categories_update.sql    # بروزرسانی دسته‌بندی‌ها
│   ├── customers_enhanced.sql   # بهبود جدول مشتریان
│   ├── payment_system_upgrade.sql # ارتقای سیستم پرداخت
│   └── ...
├── public/
│   ├── css/
│   │   ├── bootstrap.min.css
│   │   ├── fontawesome.min.css
│   │   └── style.css            # استایل‌های فارسی RTL
│   ├── js/
│   │   ├── bootstrap.bundle.min.js
│   │   ├── jquery.min.js
│   │   ├── moment.min.js
│   │   ├── moment-jalaali.js
│   │   └── main.js              # اسکریپت‌های کاربردی
│   └── uploads/                 # تصاویر آپلود شده
├── views/
│   ├── layout.ejs               # قالب اصلی
│   ├── login.ejs                # صفحه ورود
│   ├── dashboard.ejs            # داشبورد اصلی
│   ├── settings.ejs             # تنظیمات
│   ├── backup.ejs               # سیستم بک‌آپ
│   ├── inventory/               # صفحات انبار
│   │   ├── list.ejs
│   │   ├── add.ejs
│   │   ├── edit.ejs
│   │   ├── view.ejs
│   │   └── categories.ejs
│   ├── customers/               # صفحات مشتریان
│   │   ├── list.ejs
│   │   ├── add.ejs
│   │   ├── edit.ejs
│   │   └── view.ejs
│   ├── sales/                   # صفحات فروش
│   │   ├── list.ejs
│   │   ├── new.ejs
│   │   ├── edit.ejs
│   │   ├── view.ejs
│   │   └── print.ejs
│   └── accounting/              # صفحات حسابداری
│       ├── dashboard.ejs
│       ├── customer-accounts.ejs
│       ├── gold-inventory.ejs
│       ├── bank-accounts.ejs
│       ├── expenses.ejs
│       └── reports.ejs
├── backups/                     # فایل‌های بک‌آپ
├── temp_uploads/                # فایل‌های موقت
├── server.js                    # سرور اصلی
├── package.json                 # وابستگی‌ها
├── .env                         # تنظیمات محیطی
├── add-new-user.js             # اسکریپت افزودن کاربر
├── test-backup-system.js       # تست سیستم بک‌آپ
├── start-backup-system.js      # راه‌اندازی بک‌آپ
└── README.md                    # راهنمای پروژه
```

---

## 🎯 ویژگی‌های کامل سیستم

### 1. مدیریت انبار (Inventory Management)
- ✅ افزودن/ویرایش/حذف کالاها
- ✅ دسته‌بندی سلسله‌مراتبی کالاها
- ✅ آپلود تصاویر کالاها
- ✅ مدیریت موجودی خودکار
- ✅ محاسبه قیمت بر اساس نرخ طلا
- ✅ ردیابی وزن دقیق و عیار
- ✅ مدیریت اجرت ساخت و سود

### 2. مدیریت مشتریان (Customer Management)
- ✅ ثبت اطلاعات کامل مشتریان
- ✅ اعتبارسنجی کد ملی ایرانی
- ✅ ردیابی تاریخچه خرید
- ✅ مدیریت حساب مالی مشتریان
- ✅ دسته‌بندی مشتریان (عادی، VIP، عمده)
- ✅ گزارش‌گیری پیشرفته

### 3. سیستم فروش و فاکتور (Sales & Invoicing)
- ✅ صدور فاکتور حرفه‌ای
- ✅ محاسبه خودکار قیمت‌ها
- ✅ مدیریت تخفیف و مالیات
- ✅ چاپ فاکتور استاندارد
- ✅ تولید PDF فاکتور
- ✅ ویرایش و لغو فاکتور
- ✅ کنترل موجودی هنگام فروش
- ✅ محاسبه وزن نهایی (کسر پلاستیک)

### 4. سیستم حسابداری (Accounting System)
- ✅ دفتر حساب‌ها (Chart of Accounts)
- ✅ دفتر روزنامه (Journal Entries)
- ✅ دفتر کل (General Ledger)
- ✅ تراز آزمایشی (Trial Balance)
- ✅ مدیریت حساب‌های بانکی
- ✅ ثبت هزینه‌ها
- ✅ گزارش‌های مالی
- ✅ مدیریت موجودی طلا
- ✅ حساب‌های مشتریان

### 5. سیستم بک‌آپ امن (Secure Backup System)
- ✅ بک‌آپ کامل/داده‌ها/ساختار
- ✅ بازیابی امن (فقط مدیران)
- ✅ رمزگذاری نام فایل‌ها
- ✅ بک‌آپ خودکار روزانه
- ✅ مدیریت خودکار فایل‌ها
- ✅ ثبت کامل فعالیت‌ها
- ✅ اعتبارسنجی فایل‌ها

### 6. امنیت و کنترل دسترسی
- ✅ احراز هویت قوی
- ✅ مدیریت نقش‌ها (Admin/User)
- ✅ رمزگذاری رمز عبور
- ✅ محافظت از حملات XSS/CSRF
- ✅ اعتبارسنجی ورودی‌ها
- ✅ ثبت فعالیت‌های کاربران

---

## 🔒 تنظیمات امنیتی

### 1. تقویت امنیت دیتابیس
```sql
-- تغییر رمز عبور root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'VeryStrongPassword123!';

-- حذف کاربران ناشناس
DELETE FROM mysql.user WHERE User='';

-- حذف دیتابیس test
DROP DATABASE IF EXISTS test;

-- بروزرسانی مجوزها
FLUSH PRIVILEGES;
```

### 2. تنظیم Firewall
```bash
# Ubuntu/Debian
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 3000  # Application
sudo ufw allow 3306  # MySQL (فقط در صورت نیاز)

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 3. تنظیم SSL (Production)
```bash
# نصب Certbot
sudo apt install certbot

# دریافت گواهی SSL
sudo certbot certonly --standalone -d yourdomain.com
```

---

## 🚀 راه‌اندازی Production

### 1. نصب PM2
```bash
# نصب PM2 به صورت global
npm install -g pm2

# ایجاد فایل ecosystem
nano ecosystem.config.js
```

### 2. فایل ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'gold-shop',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 3. راه‌اندازی با PM2
```bash
# ایجاد پوشه لاگ
mkdir logs

# شروع برنامه
pm2 start ecosystem.config.js

# ذخیره پیکربندی
pm2 save

# راه‌اندازی خودکار
pm2 startup
```

### 4. تنظیم Nginx (اختیاری)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

---

## 🧪 تست و اعتبارسنجی

### 1. تست‌های خودکار
```bash
# تست سیستم بک‌آپ
node test-backup-system.js

# تست ایجاد بک‌آپ
node test-backup-creation.js

# تست کامل workflow
node test-backup-workflow.js

# تست عملکرد بازیابی
node test-restore-functionality.js
```

### 2. تست دستی
1. **ورود به سیستم**: تست احراز هویت
2. **مدیریت انبار**: افزودن/ویرایش کالا
3. **مدیریت مشتریان**: ثبت مشتری جدید
4. **صدور فاکتور**: فروش کالا و چاپ فاکتور
5. **حسابداری**: بررسی گزارش‌ها
6. **بک‌آپ**: ایجاد و بازیابی بک‌آپ

---

## 🔧 عیب‌یابی (Troubleshooting)

### مشکلات رایج و راه‌حل‌ها

#### 1. خطای اتصال به دیتابیس
```bash
# بررسی وضعیت MySQL
sudo systemctl status mysql

# راه‌اندازی مجدد
sudo systemctl restart mysql

# بررسی لاگ‌ها
sudo tail -f /var/log/mysql/error.log
```

#### 2. خطای npm install
```bash
# پاک کردن cache
npm cache clean --force

# حذف node_modules و نصب مجدد
rm -rf node_modules package-lock.json
npm install
```

#### 3. خطای مجوز فایل‌ها
```bash
# تنظیم مجوزها
sudo chown -R $USER:$USER .
chmod -R 755 .
chmod -R 777 public/uploads backups temp_uploads
```

#### 4. خطای پورت در حال استفاده
```bash
# یافتن پروسه استفاده‌کننده از پورت
lsof -i :3000

# کشتن پروسه
kill -9 [PID]
```

#### 5. خطای حافظه کم
```bash
# افزایش حافظه Node.js
node --max-old-space-size=4096 server.js
```

---

## 📊 نظارت و نگهداری

### 1. بک‌آپ روزانه
```bash
# اضافه کردن به crontab
crontab -e

# بک‌آپ روزانه در ساعت 2 صبح
0 2 * * * cd /path/to/gold-shop && node -e "
const db = require('./config/database');
// کد بک‌آپ خودکار
"
```

### 2. مانیتورینگ سیستم
```bash
# بررسی وضعیت PM2
pm2 status

# مشاهده لاگ‌ها
pm2 logs gold-shop

# بررسی استفاده از منابع
pm2 monit
```

### 3. بروزرسانی سیستم
```bash
# بک‌آپ قبل از بروزرسانی
node test-backup-creation.js

# دانلود آخرین نسخه
git pull origin main

# نصب وابستگی‌های جدید
npm install

# راه‌اندازی مجدد
pm2 restart gold-shop
```

---

## 📞 پشتیبانی و منابع

### مستندات
- `README.md` - راهنمای اصلی پروژه
- `BACKUP_SYSTEM_GUIDE.md` - راهنمای سیستم بک‌آپ
- `GOLD_INVENTORY_GUIDE.md` - راهنمای موجودی طلا
- `RESTORE_INSTRUCTIONS.md` - دستورالعمل بازیابی

### فایل‌های تست
- `test-backup-system.js` - تست کامل سیستم
- `test-backup-creation.js` - تست ایجاد بک‌آپ
- `test-complete-restore.js` - تست بازیابی کامل

### ابزارهای کمکی
- `add-new-user.js` - افزودن کاربر جدید
- `start-backup-system.js` - راه‌اندازی بک‌آپ
- `fix-restore-process.js` - تعمیر فرآیند بازیابی

---

## ✅ چک‌لیست نصب نهایی

### پیش‌نیازها
- [ ] Node.js نصب شده (v16+)
- [ ] MySQL/MariaDB نصب و پیکربندی شده
- [ ] Git نصب شده (اختیاری)

### نصب پروژه
- [ ] فایل‌های پروژه دانلود شده
- [ ] وابستگی‌ها نصب شده (`npm install`)
- [ ] فایل `.env` ایجاد و پیکربندی شده
- [ ] دیتابیس ایجاد شده
- [ ] اسکیما و داده‌های اولیه وارد شده

### پیکربندی
- [ ] دایرکتوری‌های مورد نیاز ایجاد شده
- [ ] مجوزهای فایل‌ها تنظیم شده
- [ ] کاربر مدیر پیکربندی شده
- [ ] نرخ طلا وارد شده

### تست
- [ ] سرور راه‌اندازی شده (`npm start`)
- [ ] ورود به سیستم موفق
- [ ] تست‌های خودکار اجرا شده
- [ ] عملکرد ماژول‌ها بررسی شده

### Production (اختیاری)
- [ ] PM2 نصب و پیکربندی شده
- [ ] Nginx پیکربندی شده
- [ ] SSL نصب شده
- [ ] Firewall تنظیم شده
- [ ] بک‌آپ خودکار فعال شده

---

## 🎉 تبریک!

سیستم مدیریت طلافروشی زرین با موفقیت نصب شد!

### اطلاعات دسترسی:
- **آدرس**: http://localhost:3000
- **نام کاربری**: admin
- **رمز عبور**: admin123

### مراحل بعدی:
1. تغییر رمز عبور پیش‌فرض
2. افزودن اطلاعات طلافروشی
3. وارد کردن کالاها و مشتریان
4. تنظیم بک‌آپ خودکار
5. آموزش کاربران

---

**تاریخ آخرین بروزرسانی**: ۳ مرداد ۱۴۰۴  
**نسخه راهنما**: 2.0  
**وضعیت**: آماده تولید  
**پشتیبانی**: کامل و مستمر