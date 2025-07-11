# Gold Shop Management System
## سیستم مدیریت طلافروشی زرین

A comprehensive web application for managing gold shop operations including inventory, customers, sales, and accounting - all in Persian language with RTL support.

## 🌟 Features

### Core Modules
- **انبار (Inventory Management)**: Complete item management with photos, pricing, and stock tracking
- **مشتریان (Customer Management)**: Customer database with financial tracking
- **فروش و صدور فاکتور (Sales & Invoicing)**: Professional invoice generation and sales management
- **حسابداری (Accounting)**: Financial tracking and reporting

### Key Capabilities
- ✅ Persian RTL interface
- ✅ Live inventory tracking
- ✅ Automatic pricing calculations
- ✅ Professional invoice printing
- ✅ Customer financial management
- ✅ Complete audit trail
- ✅ Search and filtering
- ✅ Responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL or MariaDB
- Git

### Installation

1. **Clone and Install Dependencies**
```bash
cd gold
npm install
```

   **Note**: The installation will include Puppeteer for PDF generation, which may take a few minutes to download Chromium.

2. **Database Setup**
   - Create a MySQL database named `gold_shop_db`
   - Import the schema:
```bash
mysql -u root -p gold_shop_db < database/schema.sql
```

   **For existing installations**: If you already have the database, run the update script:
```bash
mysql -u root -p gold_shop_db < database/invoice_update.sql
```

3. **Configuration**
   - Update database configuration in `config/database.js`
   - Default settings:
     - Host: localhost
     - User: root
     - Password: (empty)
     - Database: gold_shop_db

4. **Start the Application**
```bash
npm start
```

   For development with auto-restart:
```bash
npm run dev
```

5. **Access the Application**
   - Open your browser and go to: `http://localhost:3000`
   - Login with default credentials:
     - Username: `admin`
     - Password: `admin123`

## 📁 Project Structure

```
gold-shop-management/
├── config/
│   └── database.js          # Database configuration
├── database/
│   └── schema.sql           # Database schema
├── public/
│   ├── css/
│   │   └── style.css        # RTL Persian styles
│   ├── js/
│   │   └── main.js          # Client-side functionality
│   └── uploads/             # Item images storage
├── views/
│   ├── layout.ejs           # Base template
│   ├── login.ejs            # Login page
│   ├── dashboard.ejs        # Main dashboard
│   ├── inventory/           # Inventory templates
│   ├── customers/           # Customer templates
│   └── sales/               # Sales templates
├── server.js                # Main server file
└── package.json             # Dependencies
```

## 🔧 Configuration

### Database Configuration
Edit `config/database.js` to match your database settings:

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'gold_shop_db',
    port: 3306
};
```

### Shop Information
Update shop details in the database or modify the templates directly.

## 📱 Usage Guide

### 1. Inventory Management (انبار)
- Add new items with detailed specifications
- Upload item photos
- Set pricing rules (labor costs, profit margins)
- Track stock levels automatically
- Search and filter items

### 2. Customer Management (مشتریان)
- Maintain customer database
- Track purchase history
- Monitor account balances
- Generate customer reports

### 3. Sales & Invoicing (فروش و فاکتور) - سیستم کامل
- **صدور فاکتور**: فاکتور حرفه‌ای مطابق الگوی استاندارد طلافروشی
- **مشاهده فاکتور**: نمایش کامل جزئیات و اطلاعات فاکتور
- **ویرایش فاکتور**: امکان تغییر کالاها، قیمت‌ها و اطلاعات
- **لغو فاکتور**: برگرداندن خودکار موجودی به انبار
- **حذف فاکتور**: حذف کامل فاکتور (فقط برای مدیر سیستم)
- **چاپ فاکتور**: قالب چاپ استاندارد طلافروشی
- **PDF فاکتور**: ذخیره و دانلود فاکتور به صورت PDF
- **محاسبات پیشرفته**: تخفیف، وزن پولاستیک، جمع وزن کل، حساب نهایی
- **کنترل موجودی**: عدم امکان فروش بیشتر از موجودی انبار
- **بروزرسانی خودکار**: موجودی انبار و حساب مشتری

### 4. Accounting (حسابداری)
- View customer ledgers
- Track all financial transactions
- Generate financial reports
- Monitor cash flow

## 🛠 Technical Details

### Technology Stack
- **Backend**: Node.js, Express.js
- **Frontend**: EJS templates, Vanilla JavaScript
- **Database**: MySQL/MariaDB
- **Styling**: Custom CSS with RTL support

### Key Features Implementation
- **RTL Support**: Complete right-to-left layout
- **Persian Numbers**: Automatic number formatting
- **Image Upload**: Multer for handling item photos
- **Session Management**: Secure user authentication
- **Responsive Design**: Works on desktop and tablets

## 🔐 Security

- Password hashing with bcrypt
- Session-based authentication
- SQL injection prevention
- File upload validation
- XSS protection

## 📄 Database Schema

The application uses a comprehensive database schema with the following main tables:
- `users` - System users
- `item_types` - Item categories
- `inventory_items` - Product inventory
- `customers` - Customer database
- `invoices` - Sales invoices
- `invoice_items` - Invoice line items
- `payments` - Customer payments
- `financial_transactions` - Complete audit trail

## 🚀 Production Deployment

### Environment Variables
Create a `.env` file for production:
```
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=gold_shop_db
SESSION_SECRET=your_secure_session_key
PORT=3000
```

### Production Checklist
- [ ] Secure database connection
- [ ] Update default admin password
- [ ] Configure backup strategy
- [ ] Set up SSL certificate
- [ ] Configure firewall rules
- [ ] Regular database backups

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL service is running
   - Verify connection settings in config/database.js
   - Ensure database exists

2. **File Upload Issues**
   - Check `public/uploads/` directory permissions
   - Verify multer configuration

3. **Login Problems**
   - Ensure users table has data
   - Check password hashing

4. **CSS/JS Not Loading**
   - Verify static file configuration
   - Check file paths

## 📞 Support

For support and questions:
- Check the troubleshooting section
- Review the code comments
- Test with sample data

## 📜 License

MIT License - Feel free to modify and use for your gold shop business.

---

**سیستم مدیریت طلافروشی زرین - نسخه ۱.۰**
*Complete gold shop management solution with Persian RTL interface* 