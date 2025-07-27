# Design Document - Customer Gold Accounts

## Overview

این سیستم یک ماژول حساب طلا برای مشتریان ایجاد می‌کند که امکان مدیریت دستی بدهی و بستانکاری طلا (بر حسب گرم) را فراهم می‌کند. این سیستم مستقل از سیستم فاکتورسازی عمل کرده و برای مدیریت معاملات طلای غیررسمی و تسویه‌های آتی طراحی شده است.

## Architecture

### Database Schema

#### جدول جدید: customer_gold_transactions

```sql
CREATE TABLE customer_gold_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_type ENUM('debit', 'credit') NOT NULL COMMENT 'debit=بدهکار, credit=بستانکار',
    amount_grams DECIMAL(8,3) NOT NULL COMMENT 'مقدار طلا بر حسب گرم',
    description TEXT NOT NULL COMMENT 'توضیحات تراکنش',
    created_by INT NOT NULL COMMENT 'کاربری که تراکنش را ثبت کرده',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_customer_date (customer_id, transaction_date),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_by (created_by)
);
```

#### اضافه کردن فیلد موجودی طلا به جدول customers

```sql
ALTER TABLE customers 
ADD COLUMN gold_balance_grams DECIMAL(8,3) DEFAULT 0 COMMENT 'موجودی طلا بر حسب گرم (مثبت=بستانکار، منفی=بدهکار)';
```

### Backend Components

#### 1. Database Functions

**calculateCustomerGoldBalance(customerId)**
- محاسبه موجودی کل طلای مشتری از روی تراکنش‌ها
- بازگشت مقدار بر حسب گرم (مثبت = بستانکار، منفی = بدهکار)

**updateCustomerGoldBalance(customerId)**
- بروزرسانی فیلد gold_balance_grams در جدول customers
- فراخوانی پس از هر تغییر در تراکنش‌ها

#### 2. API Endpoints

**GET /customers/view/:id**
- بروزرسانی برای نمایش بخش حساب طلا
- اضافه کردن داده‌های تراکنش‌های طلا

**POST /customers/:id/gold-transactions**
- ایجاد تراکنش طلای جدید
- اعتبارسنجی داده‌ها
- بروزرسانی موجودی

**PUT /customers/:id/gold-transactions/:transactionId**
- ویرایش تراکنش طلای موجود
- بروزرسانی موجودی

**DELETE /customers/:id/gold-transactions/:transactionId**
- حذف تراکنش طلا
- بروزرسانی موجودی

**GET /customers/:id/gold-transactions**
- دریافت لیست تراکنش‌های طلای مشتری
- پشتیبانی از صفحه‌بندی و مرتب‌سازی

### Frontend Components

#### 1. Customer View Page Enhancement

**Gold Account Section**
- نمایش موجودی کل طلا با رنگ‌بندی مناسب
- دکمه "افزودن تراکنش طلا"
- جدول تراکنش‌های طلا با قابلیت ویرایش/حذف

#### 2. Gold Transaction Modal/Form

**Add/Edit Transaction Form**
- فیلد تاریخ (با تقویم شمسی)
- انتخاب نوع تراکنش (بدهکار/بستانکار)
- فیلد مقدار (گرم) با اعتبارسنجی
- فیلد توضیحات
- دکمه‌های ذخیره/لغو

#### 3. Transaction List Component

**Transaction Table**
- ستون‌های: تاریخ، نوع، مقدار، توضیحات، عملیات
- دکمه‌های ویرایش و حذف برای هر ردیف
- مرتب‌سازی بر اساس تاریخ (جدیدترین اول)

## Components and Interfaces

### 1. Database Layer

```javascript
// database/gold-transactions.js
class GoldTransactionDB {
    static async create(customerId, transactionData) { }
    static async update(transactionId, transactionData) { }
    static async delete(transactionId) { }
    static async getByCustomer(customerId, options = {}) { }
    static async calculateBalance(customerId) { }
}
```

### 2. Service Layer

```javascript
// services/goldAccountService.js
class GoldAccountService {
    static async addTransaction(customerId, transactionData, userId) { }
    static async updateTransaction(transactionId, transactionData, userId) { }
    static async deleteTransaction(transactionId, userId) { }
    static async getCustomerTransactions(customerId, options) { }
    static async getCustomerBalance(customerId) { }
}
```

### 3. Frontend Components

```javascript
// public/js/gold-account.js
class GoldAccountManager {
    constructor(customerId) { }
    showAddTransactionModal() { }
    showEditTransactionModal(transactionId) { }
    deleteTransaction(transactionId) { }
    refreshTransactionList() { }
    updateBalanceDisplay() { }
}
```

## Data Models

### GoldTransaction Model

```javascript
{
    id: Number,
    customer_id: Number,
    transaction_date: Date,
    transaction_type: 'debit' | 'credit',
    amount_grams: Number, // دقت 3 رقم اعشار
    description: String,
    created_by: Number,
    created_at: Date,
    updated_at: Date
}
```

### Customer Model Enhancement

```javascript
// اضافه شدن به مدل Customer موجود
{
    // ... فیلدهای موجود
    gold_balance_grams: Number, // موجودی طلا
    gold_transactions: Array<GoldTransaction> // تراکنش‌های طلا
}
```

## Error Handling

### Validation Rules

1. **مقدار طلا**: باید عدد مثبت و بیشتر از 0 باشد
2. **تاریخ**: نباید از تاریخ آینده باشد
3. **توضیحات**: حداقل 5 کاراکتر
4. **نوع تراکنش**: فقط 'debit' یا 'credit'

### Error Responses

```javascript
// خطاهای احتمالی
{
    INVALID_AMOUNT: 'مقدار طلا باید عدد مثبت باشد',
    INVALID_DATE: 'تاریخ نمی‌تواند از آینده باشد',
    MISSING_DESCRIPTION: 'توضیحات الزامی است',
    CUSTOMER_NOT_FOUND: 'مشتری یافت نشد',
    TRANSACTION_NOT_FOUND: 'تراکنش یافت نشد',
    UNAUTHORIZED: 'دسترسی غیرمجاز'
}
```

### Database Transaction Handling

- استفاده از database transactions برای اطمینان از consistency
- Rollback در صورت خطا در بروزرسانی موجودی
- Logging تمام عملیات برای audit trail

## Testing Strategy

### Unit Tests

1. **Database Functions**
   - تست محاسبه موجودی
   - تست CRUD operations
   - تست constraint ها

2. **Service Layer**
   - تست business logic
   - تست validation rules
   - تست error handling

3. **API Endpoints**
   - تست request/response
   - تست authentication
   - تست error responses

### Integration Tests

1. **End-to-End Workflow**
   - ایجاد تراکنش جدید
   - ویرایش تراکنش موجود
   - حذف تراکنش
   - محاسبه موجودی

2. **Database Consistency**
   - تست concurrent transactions
   - تست rollback scenarios
   - تست foreign key constraints

### Frontend Tests

1. **UI Components**
   - تست modal forms
   - تست validation messages
   - تست responsive design

2. **User Interactions**
   - تست add/edit/delete workflows
   - تست real-time balance updates
   - تست error handling

## Security Considerations

### Authentication & Authorization

- تمام endpoints نیاز به authentication دارند
- فقط کاربران مجاز می‌توانند تراکنش ایجاد کنند
- Log کردن تمام عملیات با user ID

### Data Validation

- Server-side validation برای تمام inputs
- Sanitization برای جلوگیری از XSS
- SQL injection prevention

### Audit Trail

- ثبت تمام تغییرات در log files
- نگهداری اطلاعات کاربر ایجادکننده
- Timestamp دقیق برای تمام عملیات

## Performance Considerations

### Database Optimization

- Index مناسب روی customer_id و transaction_date
- Pagination برای لیست تراکنش‌ها
- Caching موجودی محاسبه شده

### Frontend Optimization

- Lazy loading برای تراکنش‌های قدیمی
- Debouncing برای search/filter
- Optimistic UI updates

## UI/UX Design

### Visual Design

- استفاده از رنگ سبز برای بستانکار
- استفاده از رنگ قرمز برای بدهکار
- آیکون‌های مناسب برای نوع تراکنش‌ها

### User Experience

- Modal forms برای add/edit operations
- Confirmation dialogs برای delete
- Real-time balance updates
- Loading states برای async operations

### Responsive Design

- Mobile-friendly forms
- Touch-friendly buttons
- Responsive table layout