# Gold Shop Management System - Installation Guide

## Complete Installation Guide for Ubuntu Server

This guide provides step-by-step instructions to install and configure the Gold Shop Management System on Ubuntu Server with domain configuration and SSL setup.

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Initial Server Setup](#initial-server-setup)
3. [Install Prerequisites](#install-prerequisites)
4. [Database Setup](#database-setup)
5. [Application Installation](#application-installation)
6. [Domain Configuration](#domain-configuration)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Service Configuration](#service-configuration)
9. [Security Configuration](#security-configuration)
10. [Maintenance](#maintenance)

---

## System Requirements

- **OS**: Ubuntu Server 20.04 LTS or 22.04 LTS
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB free space
- **Network**: Internet connection for downloads and updates
- **Domain**: A registered domain name pointing to your server IP

---

## Initial Server Setup

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Essential Tools
```bash
sudo apt install -y curl wget git unzip software-properties-common
```

### 3. Create Application User
```bash
sudo useradd -m -s /bin/bash goldshop
sudo usermod -aG sudo goldshop
```

### 4. Set Up Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable
```

---

## Install Prerequisites

### 1. Install Node.js (v18 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

### 2. Install MySQL Server
```bash
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 3. Secure MySQL Installation
```bash
sudo mysql_secure_installation
```

**Configuration options:**
- Set root password: `YES` (use a strong password)
- Remove anonymous users: `YES`
- Disallow root login remotely: `YES`
- Remove test database: `YES`
- Reload privilege tables: `YES`

### 4. Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

---

## Database Setup

### 1. Create Database and User
```bash
sudo mysql -u root -p
```

In MySQL console:
```sql
CREATE DATABASE goldshop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'goldshop_user'@'localhost' IDENTIFIED BY 'your_strong_password_here';
GRANT ALL PRIVILEGES ON goldshop_db.* TO 'goldshop_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Create Combined Database Initialization Script
Create a single script that combines all database files:

```bash
sudo -u goldshop mkdir -p /home/goldshop/database-init
sudo -u goldshop tee /home/goldshop/database-init/init_complete_database.sql << 'EOF'
-- Gold Shop Management System - Complete Database Initialization
-- This script combines all database files in the correct order

-- 1. Create main database schema
SOURCE /home/goldshop/gold-shop/database/schema.sql;

-- 2. Initialize categories
SOURCE /home/goldshop/gold-shop/database/init_categories.sql;

-- 3. Create accounting tables
SOURCE /home/goldshop/gold-shop/database/accounting_tables.sql;

-- 4. Update invoice system
SOURCE /home/goldshop/gold-shop/database/update_invoice_system.sql;

-- 5. Apply invoice updates
SOURCE /home/goldshop/gold-shop/database/invoice_update.sql;

-- 6. Apply customer enhancements
SOURCE /home/goldshop/gold-shop/database/customers_enhanced.sql;

-- 7. Update categories
SOURCE /home/goldshop/gold-shop/database/categories_update.sql;

-- Success message
SELECT 'Database initialization completed successfully!' as Status;
EOF
```

---

## Application Installation

### 1. Switch to Application User
```bash
sudo su - goldshop
```

### 2. Clone/Upload Application
```bash
cd /home/goldshop
# If using Git:
git clone https://github.com/yourusername/gold-shop.git
# OR upload your files to /home/goldshop/gold-shop/

# Set proper permissions
chmod -R 755 /home/goldshop/gold-shop/
```

### 3. Install Dependencies
```bash
cd /home/goldshop/gold-shop
npm install
```

### 4. Create Environment Configuration
```bash
cp .env.example .env
nano .env
```

Add the following configuration:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=goldshop_user
DB_PASSWORD=your_strong_password_here
DB_NAME=goldshop_db

# Application Configuration
PORT=3000
NODE_ENV=production
SESSION_SECRET=your_very_long_random_session_secret_here

# Application Settings
APP_NAME=Gold Shop Management
APP_URL=https://yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

### 5. Initialize Database with Single Command
```bash
mysql -u goldshop_user -p goldshop_db < /home/goldshop/database-init/init_complete_database.sql
```

### 6. Test Application
```bash
npm start
```

Open browser: `http://your-server-ip:3000`

If working, stop with `Ctrl+C`.

---

## Domain Configuration

### 1. Configure DNS
Point your domain to your server IP:
- **A Record**: `yourdomain.com` → `your-server-ip`
- **CNAME Record**: `www.yourdomain.com` → `yourdomain.com`

### 2. Create Nginx Configuration
```bash
sudo tee /etc/nginx/sites-available/goldshop << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be added by Certbot)
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Proxy to Node.js Application
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
        proxy_read_timeout 86400;
    }

    # Static Files
    location /css/ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location /js/ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location /uploads/ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Security
    location ~ /\.ht {
        deny all;
    }

    # Logs
    access_log /var/log/nginx/goldshop_access.log;
    error_log /var/log/nginx/goldshop_error.log;
}
EOF
```

### 3. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/goldshop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL Certificate Setup

### 1. Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. Test SSL Renewal
```bash
sudo certbot renew --dry-run
```

### 4. Set Up Auto-Renewal
```bash
sudo crontab -e
```

Add this line:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Service Configuration

### 1. Create PM2 Ecosystem File
```bash
sudo -u goldshop tee /home/goldshop/gold-shop/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'goldshop',
    script: 'server.js',
    cwd: '/home/goldshop/gold-shop',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/goldshop/logs/err.log',
    out_file: '/home/goldshop/logs/out.log',
    log_file: '/home/goldshop/logs/combined.log',
    time: true,
    max_restarts: 10,
    restart_delay: 1000,
    watch: false,
    ignore_watch: ['node_modules', 'uploads', 'logs']
  }]
};
EOF
```

### 2. Create Log Directory
```bash
sudo -u goldshop mkdir -p /home/goldshop/logs
```

### 3. Start Application with PM2
```bash
sudo -u goldshop bash << 'EOF'
cd /home/goldshop/gold-shop
pm2 start ecosystem.config.js
pm2 save
EOF
```

### 4. Set Up PM2 Startup
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u goldshop --hp /home/goldshop
```

---

## Security Configuration

### 1. Configure MySQL Security
```bash
sudo mysql -u root -p
```

```sql
-- Disable remote root login
UPDATE mysql.user SET Host='localhost' WHERE User='root';
DELETE FROM mysql.user WHERE Host!='localhost' AND User='root';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Set Up Log Rotation
```bash
sudo tee /etc/logrotate.d/goldshop << 'EOF'
/home/goldshop/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 goldshop goldshop
    postrotate
        sudo -u goldshop /usr/lib/node_modules/pm2/bin/pm2 reload goldshop
    endscript
}
EOF
```

### 3. Create Backup Script
```bash
sudo tee /home/goldshop/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/goldshop/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="goldshop_db"
DB_USER="goldshop_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/goldshop_db_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/goldshop_app_$DATE.tar.gz -C /home/goldshop gold-shop --exclude=node_modules

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /home/goldshop/backup.sh
chown goldshop:goldshop /home/goldshop/backup.sh
```

### 4. Schedule Backups
```bash
sudo -u goldshop crontab -e
```

Add:
```
0 2 * * * /home/goldshop/backup.sh >> /home/goldshop/logs/backup.log 2>&1
```

---

## Maintenance

### 1. Check Application Status
```bash
sudo -u goldshop pm2 status
sudo -u goldshop pm2 logs goldshop
```

### 2. Restart Application
```bash
sudo -u goldshop pm2 restart goldshop
```

### 3. Update Application
```bash
sudo -u goldshop bash << 'EOF'
cd /home/goldshop/gold-shop
git pull origin main  # or upload new files
npm install
pm2 restart goldshop
EOF
```

### 4. Monitor System
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check active connections
ss -tulpn | grep :3000

# Check Nginx logs
sudo tail -f /var/log/nginx/goldshop_access.log
sudo tail -f /var/log/nginx/goldshop_error.log
```

### 5. Database Maintenance
```bash
# Optimize database
mysql -u goldshop_user -p goldshop_db -e "OPTIMIZE TABLE customers, inventory, sales, journal_entries;"

# Check database size
mysql -u goldshop_user -p goldshop_db -e "SELECT table_name AS 'Table', round(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = 'goldshop_db';"
```

---

## Final Steps

1. **Test the complete installation:**
   ```bash
   curl -I https://yourdomain.com
   ```

2. **Login to your application:**
   - URL: `https://yourdomain.com`
   - Default credentials will be created during first run

3. **Monitor the application:**
   ```bash
   sudo -u goldshop pm2 monit
   ```

4. **Set up monitoring alerts (optional):**
   ```bash
   sudo -u goldshop pm2 install pm2-server-monit
   ```

---

## Troubleshooting

### Common Issues

1. **Application won't start:**
   ```bash
   sudo -u goldshop pm2 logs goldshop
   ```

2. **Database connection issues:**
   ```bash
   mysql -u goldshop_user -p goldshop_db -e "SELECT 1;"
   ```

3. **SSL certificate issues:**
   ```bash
   sudo certbot certificates
   sudo nginx -t
   ```

4. **Permission issues:**
   ```bash
   sudo chown -R goldshop:goldshop /home/goldshop/gold-shop
   ```

### Contact Information

For support and updates, please refer to the project documentation or contact the system administrator.

---

**Installation Complete!** 🎉

Your Gold Shop Management System is now running at: `https://yourdomain.com`

Remember to:
- Change all default passwords
- Regularly update the system
- Monitor backups
- Keep SSL certificates updated 