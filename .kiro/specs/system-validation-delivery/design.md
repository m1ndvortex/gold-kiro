# Design Document

## Overview

این سند طراحی برای تست کامل سیستم مدیریت طلافروشی و آماده‌سازی آن برای تحویل به مشتری تهیه شده است. سیستم یک وب اپلیکیشن Node.js با Express framework است که از MySQL database استفاده می‌کند و رابط کاربری فارسی RTL دارد.

## Architecture

### Backend Architecture
- **Framework**: Express.js (Node.js)
- **Database**: MySQL با charset utf8mb4 برای پشتیبانی کامل فارسی
- **Authentication**: Session-based با bcryptjs
- **File Upload**: Multer برای آپلود تصاویر
- **Template Engine**: EJS با express-ejs-layouts
- **Database Connection**: mysql2 با connection pooling

### Frontend Architecture
- **Template Engine**: EJS templates
- **Styling**: CSS با پشتیبانی RTL
- **JavaScript**: Vanilla JS برای تعاملات client-side
- **Layout**: Master layout با partial views

### Database Architecture
- **Character Set**: utf8mb4_unicode_ci برای پشتیبانی کامل فارسی
- **Tables**: 15+ جدول اصلی شامل users, customers, inventory_items, invoices, transactions
- **Relationships**: Foreign key constraints برای یکپارچگی داده‌ها

## Components and Interfaces

### 1. Authentication Module
- **Login/Logout**: `/login`, `/logout`
- **Session Management**: Express-session
- **Authorization Middleware**: requireAuth

### 2. Dashboard Module
- **Route**: `/dashboard`
- **Features**: نمایش آمار کلی، تعداد کالاها، مشتریان، فروش روزانه
- **Database Queries**: آمارگیری از جداول مختلف

### 3. Inventory Management Module
- **Routes**: 
  - `/inventory` - لیست کالاها
  - `/inventory/add` - افزودن کالای جدید
  - `/inventory/edit/:id` - ویرایش کالا
  - `/inventory/view/:id` - مشاهده جزئیات
  - `/inventory/delete/:id` - حذف کالا
- **Features**: مدیریت کالاها، دسته‌بندی، تصاویر، موجودی
- **Database Tables**: inventory_items, categories

### 4. Customer Management Module
- **Routes**:
  - `/customers` - لیست مشتریان
  - `/customers/add` - افزودن مشتری جدید
  - `/customers/edit/:id` - ویرایش مشتری
  - `/customers/view/:id` - مشاهده جزئیات
- **Features**: مدیریت اطلاعات مشتریان، تاریخچه خرید، حساب جاری
- **Database Tables**: customers

### 5. Sales Management Module
- **Routes**:
  - `/sales` - لیست فاکتورها
  - `/sales/new` - صدور فاکتور جدید
  - `/sales/view/:id` - مشاهده فاکتور
  - `/sales/edit/:id` - ویرایش فاکتور
  - `/sales/print/:id` - چاپ فاکتور
- **Features**: صدور فاکتور، محاسبه قیمت، مدیریت موجودی
- **Database Tables**: invoices, invoice_items

### 6. Accounting Module
- **Routes**: `/accounting/*`
- **Features**: 
  - مدیریت حساب‌های بانکی
  - ثبت تراکنش‌های مالی
  - گزارش‌های مالی
  - دفتر کل و تراز آزمایشی
- **Database Tables**: transactions, bank_accounts, journal_entries

### 7. Settings Module
- **Routes**: `/settings`
- **Features**: تنظیمات سیستم، نرخ طلا، پشتیبان‌گیری
- **Database Tables**: gold_rates

## Data Models

### Core Entities

#### Users
```sql
- id (Primary Key)
- username (Unique)
- password (Hashed)
- full_name
- role (admin/user)
```

#### Customers
```sql
- id (Primary Key)
- customer_code (Unique)
- full_name
- phone, national_id, address
- current_balance
- total_purchases, total_payments
```

#### Inventory Items
```sql
- id (Primary Key)
- item_code (Unique)
- item_name
- category_id (Foreign Key)
- carat, weight, quantity
- image_path
- pricing information
```

#### Invoices
```sql
- id (Primary Key)
- invoice_number (Unique)
- customer_id (Foreign Key)
- totals and calculations
- status
```

### Persian Language Support
- تمام جداول با charset utf8mb4_unicode_ci
- فیلدهای متنی پشتیبانی کامل از فارسی
- نام‌های فارسی در categories و descriptions

## Error Handling

### Database Errors
- Connection pool error handling
- Transaction rollback در صورت خطا
- Duplicate entry validation
- Foreign key constraint errors

### Application Errors
- Input validation
- File upload errors
- Session timeout handling
- 404/500 error pages

### User Interface Errors
- Form validation messages
- Success/error notifications
- Graceful error display

## Testing Strategy

### 1. System Analysis Phase
- **Route Discovery**: شناسایی تمام endpoints
- **Database Schema Review**: بررسی ساختار جداول
- **Frontend Component Mapping**: شناسایی تمام صفحات و عناصر UI

### 2. Functional Testing Phase
- **Navigation Testing**: تست تمام لینک‌ها و تب‌ها
- **Form Testing**: تست تمام فرم‌ها و validation
- **CRUD Operations**: تست عملیات ایجاد، خواندن، بروزرسانی، حذف
- **Business Logic**: تست محاسبات قیمت، موجودی، حساب‌های مشتریان

### 3. Persian Language Testing
- **Input Testing**: تست ورودی متن‌های فارسی
- **Display Testing**: تست نمایش صحیح فارسی
- **Search Testing**: تست جستجو با کلمات فارسی
- **Report Testing**: تست گزارش‌ها با محتوای فارسی

### 4. Data Management Testing
- **Database Reset**: پاک کردن داده‌های موجود
- **Test Data Creation**: ایجاد داده‌های تست جامع
- **Data Integrity**: تست یکپارچگی داده‌ها
- **Performance Testing**: تست عملکرد با داده‌های جدید

### 5. Integration Testing
- **End-to-End Workflows**: تست فرآیندهای کامل
- **Cross-Module Testing**: تست تعامل بین ماژول‌ها
- **Session Management**: تست مدیریت session
- **File Upload**: تست آپلود و نمایش تصاویر

## Implementation Approach

### Phase 1: System Discovery
1. **Code Analysis**: بررسی کامل کد backend و frontend
2. **Database Analysis**: بررسی ساختار و روابط جداول
3. **Route Mapping**: ایجاد نقشه کامل routes
4. **UI Component Inventory**: فهرست‌سازی تمام عناصر UI

### Phase 2: Automated Testing Setup
1. **Test Scripts**: ایجاد اسکریپت‌های تست خودکار
2. **Database Utilities**: ابزارهای مدیریت دیتابیس
3. **Data Generation**: اسکریپت‌های تولید داده تست
4. **Validation Scripts**: اسکریپت‌های اعتبارسنجی

### Phase 3: Manual Testing Execution
1. **Systematic Testing**: تست منظم تمام قابلیت‌ها
2. **Persian Content Testing**: تست محتوای فارسی
3. **User Experience Testing**: تست تجربه کاربری
4. **Performance Validation**: تست عملکرد

### Phase 4: Documentation and Delivery
1. **Test Results Documentation**: مستندسازی نتایج تست
2. **Issue Resolution**: حل مشکلات یافت شده
3. **Final Validation**: تست نهایی
4. **Delivery Preparation**: آماده‌سازی برای تحویل

## Tools and Technologies

### Testing Tools
- **Browser Testing**: Manual testing در مرورگرهای مختلف
- **Database Tools**: MySQL Workbench برای بررسی دیتابیس
- **API Testing**: Postman یا مشابه برای تست endpoints
- **Performance Monitoring**: Node.js built-in tools

### Development Tools
- **Code Editor**: VS Code با extensions مناسب
- **Database Management**: phpMyAdmin یا MySQL Workbench
- **Version Control**: Git
- **Process Management**: PM2 برای production

### Monitoring and Logging
- **Application Logs**: Console logging
- **Error Tracking**: Try-catch blocks
- **Performance Metrics**: Response time monitoring
- **Database Monitoring**: Query performance

## Security Considerations

### Authentication & Authorization
- Session-based authentication
- Password hashing با bcryptjs
- Role-based access control
- Session timeout management

### Data Protection
- SQL injection prevention
- XSS protection
- File upload security
- Input validation

### Database Security
- Connection pooling
- Prepared statements
- Transaction management
- Backup strategies