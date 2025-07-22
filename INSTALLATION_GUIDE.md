# راهنمای نصب سیستم مدیریت طلافروشی زرین
## Gold Shop Management System Installation Guide

### 🌟 مشخصات پروژه
- **نام پروژه**: سیستم مدیریت طلافروشی زرین
- **نسخه**: 1.0.0
- **زبان**: فارسی (RTL)
- **تکنولوژی**: Node.js, Express, MySQL, EJS

---

## 📋 پیش‌نیازها (Prerequisites)

### سرور VPS
- **IP سرور**: 87.248.131.94
- **دامنه**: mosaporgold.ir
- **سیستم عامل**: Ubuntu/CentOS/Debian
- **RAM**: حداقل 1GB
- **فضای ذخیره**: حداقل 10GB

### نرم‌افزارهای مورد نیاز
- Node.js (نسخه 16 یا بالاتر)
- MySQL یا MariaDB
- Nginx (برای پروکسی معکوس)
- PM2 (برای مدیریت پروسه)
- Git

---

## 🚀 مراحل نصب

### مرحله 1: آماده‌سازی سرور

```bash
# بروزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# نصب پیش‌نیازها
sudo apt install curl wget git nginx mysql-server -y
```

### مرحله 2: نصب Node.js

```bash
# نصب NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# نصب Node.js
sudo apt install nodejs -y

# بررسی نسخه
node --version
npm --version
```

### مرحله 3: نصب و پیکربندی MySQL

```bash
# اجرای اسکریپت امنیتی MySQL
sudo mysql_secure_installation

# ورود به MySQL
sudo mysql -u root -p
```

در MySQL:
```sql
-- ایجاد دیتابیس
CREATE DATABASE gold_shop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ایجاد کاربر جدید
CREATE USER 'goldshop_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';

-- اعطای دسترسی‌ها
GRANT ALL PRIVILEGES ON gold_shop_db.* TO 'goldshop_user'@'localhost';
FLUSH PRIVILEGES;

-- خروج
EXIT;
```

### مرحله 4: دانلود و نصب پروژه

```bash
# رفتن به دایرکتوری وب
cd /var/www

# کلون پروژه (یا آپلود فایل‌ها)
sudo git clone [YOUR_REPOSITORY_URL] gold-shop
# یا
sudo mkdir gold-shop
# سپس فایل‌های پروژه را آپلود کنید

# تغییر مالکیت
sudo chown -R $USER:$USER /var/www/gold-shop
cd /var/www/gold-shop

# نصب وابستگی‌ها
npm install
```

### مرحله 5: پیکربندی دیتابیس

```bash
# وارد کردن اسکیمای دیتابیس
mysql -u goldshop_user -p gold_shop_db < database/schema.sql

# اگر فایل gold_shop_db.sql دارید:
mysql -u goldshop_user -p gold_shop_db < gold_shop_db.sql
```

### مرحله 6: پیکربندی متغیرهای محیطی

```bash
# ایجاد فایل .env
nano .env
```

محتوای فایل `.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=goldshop_user
DB_PASSWORD=StrongPassword123!
DB_NAME=gold_shop_db
DB_PORT=3306

# Application Configuration
PORT=3000
NODE_ENV=production

# Session Configuration
SESSION_SECRET=your_very_secure_session_secret_key_here_2024

# Upload Configuration
UPLOAD_PATH=/var/www/gold-shop/public/uploads
MAX_FILE_SIZE=5242880

# Application URLs
BASE_URL=https://mosaporgold.ir
```

### مرحله 7: تست اجرای برنامه

```bash
# تست اجرا
npm start

# بررسی در مرورگر
# http://87.248.131.94:3000
```

اطلاعات ورود پیش‌فرض:
- **نام کاربری**: admin
- **رمز عبور**: admin123

---

## 🌐 پیکربندی Nginx

### ایجاد فایل پیکربندی Nginx

```bash
sudo nano /etc/nginx/sites-available/mosaporgold.ir
```

محتوای فایل:
```nginx
server {
    listen 80;
    server_name mosaporgold.ir www.mosaporgold.ir 87.248.131.94;

    # Redirect HTTP to HTTPS (بعد از نصب SSL)
    # return 301 https://$server_name$request_uri;

    # موقتاً برای تست
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
        
        # افزایش timeout برای عملیات طولانی
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /css/ {
        alias /var/www/gold-shop/public/css/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /js/ {
        alias /var/www/gold-shop/public/js/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /uploads/ {
        alias /var/www/gold-shop/public/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # File upload size
    client_max_body_size 10M;
}
```

### فعال‌سازی سایت

```bash
# ایجاد لینک symbolic
sudo ln -s /etc/nginx/sites-available/mosaporgold.ir /etc/nginx/sites-enabled/

# حذف سایت پیش‌فرض
sudo rm /etc/nginx/sites-enabled/default

# تست پیکربندی
sudo nginx -t

# راه‌اندازی مجدد Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🔒 نصب SSL Certificate

### استفاده از Let's Encrypt

```bash
# نصب Certbot
sudo apt install certbot python3-certbot-nginx -y

# دریافت گواهی SSL
sudo certbot --nginx -d mosaporgold.ir -d www.mosaporgold.ir

# تست تمدید خودکار
sudo certbot renew --dry-run
```

---

## 🔄 مدیریت پروسه با PM2

### نصب PM2

```bash
# نصب PM2 به صورت global
sudo npm install -g pm2

# ایجاد فایل ecosystem
nano ecosystem.config.js
```

محتوای `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'gold-shop',
    script: 'server.js',
    cwd: '/var/www/gold-shop',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/gold-shop-error.log',
    out_file: '/var/log/pm2/gold-shop-out.log',
    log_file: '/var/log/pm2/gold-shop-combined.log',
    time: true
  }]
};
```

### راه‌اندازی با PM2

```bash
# ایجاد دایرکتوری لاگ
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# شروع برنامه
pm2 start ecosystem.config.js

# ذخیره پیکربندی
pm2 save

# راه‌اندازی خودکار در startup
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# بررسی وضعیت
pm2 status
pm2 logs gold-shop
```

---

## 📁 ساختار دایرکتوری‌ها

```
/var/www/gold-shop/
├── config/
│   └── database.js
├── database/
│   ├── schema.sql
│   └── gold_shop_db.sql (فایل بکاپ شما)
├── public/
│   ├── css/
│   ├── js/
│   └── uploads/ (باید قابل نوشتن باشد)
├── views/
├── server.js
├── package.json
├── .env
└── ecosystem.config.js
```

### تنظیم مجوزها

```bash
# مجوزهای فایل‌ها
sudo chown -R www-data:www-data /var/www/gold-shop
sudo chmod -R 755 /var/www/gold-shop
sudo chmod -R 777 /var/www/gold-shop/public/uploads
```

---

## 🔧 پیکربندی‌های اضافی

### 1. تنظیم Firewall

```bash
# فعال‌سازی UFW
sudo ufw enable

# اجازه دسترسی به پورت‌های ضروری
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000

# بررسی وضعیت
sudo ufw status
```

### 2. تنظیم بکاپ خودکار

```bash
# ایجاد اسکریپت بکاپ
sudo nano /usr/local/bin/backup-goldshop.sh
```

محتوای اسکریپت:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/gold-shop"
DB_NAME="gold_shop_db"
DB_USER="goldshop_user"
DB_PASS="StrongPassword123!"

# ایجاد دایرکتوری بکاپ
mkdir -p $BACKUP_DIR

# بکاپ دیتابیس
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# بکاپ فایل‌های آپلود
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz -C /var/www/gold-shop/public uploads

# حذف بکاپ‌های قدیمی (بیشتر از 30 روز)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# اجازه اجرا
sudo chmod +x /usr/local/bin/backup-goldshop.sh

# افزودن به crontab (هر روز ساعت 2 صبح)
sudo crontab -e
# اضافه کنید:
0 2 * * * /usr/local/bin/backup-goldshop.sh
```

### 3. مانیتورینگ سیستم

```bash
# نصب htop برای مانیتورینگ
sudo apt install htop -y

# بررسی وضعیت سرویس‌ها
sudo systemctl status nginx
sudo systemctl status mysql
pm2 status

# بررسی لاگ‌ها
pm2 logs gold-shop
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔍 تست و بررسی

### 1. تست عملکرد

```bash
# تست اتصال به دیتابیس
mysql -u goldshop_user -p gold_shop_db -e "SHOW TABLES;"

# تست وب‌سرور
curl -I http://mosaporgold.ir
curl -I https://mosaporgold.ir

# بررسی پورت‌ها
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :3000
```

### 2. تست عملکرد برنامه

1. **ورود به سیستم**:
   - آدرس: https://mosaporgold.ir
   - نام کاربری: admin
   - رمز عبور: admin123

2. **تست ماژول‌ها**:
   - ✅ داشبورد
   - ✅ مدیریت انبار
   - ✅ مدیریت مشتریان
   - ✅ فروش و صدور فاکتور
   - ✅ حسابداری

---

## 🛠 عیب‌یابی (Troubleshooting)

### مشکلات رایج

#### 1. خطای اتصال به دیتابیس
```bash
# بررسی وضعیت MySQL
sudo systemctl status mysql

# بررسی لاگ MySQL
sudo tail -f /var/log/mysql/error.log

# تست اتصال
mysql -u goldshop_user -p
```

#### 2. خطای 502 Bad Gateway
```bash
# بررسی وضعیت PM2
pm2 status

# راه‌اندازی مجدد
pm2 restart gold-shop

# بررسی لاگ‌ها
pm2 logs gold-shop
```

#### 3. مشکل آپلود فایل
```bash
# بررسی مجوزها
ls -la /var/www/gold-shop/public/uploads/

# تنظیم مجوز
sudo chmod 777 /var/www/gold-shop/public/uploads/
```

#### 4. خطای SSL
```bash
# تمدید گواهی
sudo certbot renew

# بررسی وضعیت گواهی
sudo certbot certificates
```

---

## 📞 پشتیبانی و نگهداری

### دستورات مفید

```bash
# مشاهده وضعیت کلی سیستم
sudo systemctl status nginx mysql
pm2 status

# راه‌اندازی مجدد سرویس‌ها
sudo systemctl restart nginx
sudo systemctl restart mysql
pm2 restart gold-shop

# بررسی فضای دیسک
df -h

# بررسی استفاده از RAM
free -h

# بررسی پروسه‌ها
htop
```

### بروزرسانی برنامه

```bash
# توقف برنامه
pm2 stop gold-shop

# بکاپ فایل‌های فعلی
cp -r /var/www/gold-shop /var/www/gold-shop-backup-$(date +%Y%m%d)

# آپلود فایل‌های جدید
# ...

# نصب وابستگی‌های جدید
cd /var/www/gold-shop
npm install

# راه‌اندازی مجدد
pm2 start gold-shop
```

---

## ✅ چک‌لیست نهایی

- [ ] سرور آماده و بروزرسانی شده
- [ ] Node.js و MySQL نصب شده
- [ ] دیتابیس ایجاد و پیکربندی شده
- [ ] فایل‌های پروژه آپلود شده
- [ ] متغیرهای محیطی تنظیم شده
- [ ] Nginx پیکربندی شده
- [ ] SSL نصب شده
- [ ] PM2 راه‌اندازی شده
- [ ] Firewall تنظیم شده
- [ ] بکاپ خودکار فعال شده
- [ ] تست‌های عملکرد انجام شده
- [ ] رمز عبور admin تغییر کرده

---

## 🎯 نتیجه

سیستم مدیریت طلافروشی زرین با موفقیت بر روی سرور شما نصب شده است:

- **آدرس وب**: https://mosaporgold.ir
- **IP سرور**: 87.248.131.94
- **دیتابیس**: MySQL (gold_shop_db)
- **مدیریت پروسه**: PM2
- **وب‌سرور**: Nginx
- **امنیت**: SSL Certificate

سیستم آماده استفاده است و تمامی ماژول‌های اصلی (انبار، مشتریان، فروش، حسابداری) به درستی کار می‌کنند.

---

**تاریخ آخرین بروزرسانی**: 22 ژوئیه 2025  
**نسخه راهنما**: 1.0  
**وضعیت**: آماده تولید