-- Professional Accounting System Database Tables
-- طلافروشی موسی پور - سیستم حسابداری حرفه‌ای

-- Chart of Accounts (بهار حساب‌ها)
CREATE TABLE chart_of_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_code VARCHAR(10) NOT NULL UNIQUE,
    account_name VARCHAR(200) NOT NULL,
    account_name_persian VARCHAR(200) NOT NULL,
    account_type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
    parent_account_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_system_account BOOLEAN DEFAULT FALSE,
    balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_account_id) REFERENCES chart_of_accounts(id),
    INDEX idx_account_code (account_code),
    INDEX idx_account_type (account_type)
);

-- Bank Accounts (حساب‌های بانکی)
CREATE TABLE bank_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_number VARCHAR(30) NOT NULL UNIQUE,
    bank_name VARCHAR(100) NOT NULL,
    branch_name VARCHAR(100),
    account_holder VARCHAR(200) NOT NULL,
    account_type ENUM('checking', 'savings', 'business') DEFAULT 'checking',
    current_balance DECIMAL(15,2) DEFAULT 0,
    initial_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_account_number (account_number)
);

-- Expense Categories (دسته‌بندی هزینه‌ها)
CREATE TABLE expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    category_name_persian VARCHAR(100) NOT NULL,
    parent_category_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES expense_categories(id),
    INDEX idx_category_name (category_name_persian)
);

-- Expenses (هزینه‌ها)
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_number VARCHAR(20) NOT NULL UNIQUE,
    category_id INT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'check', 'card') NOT NULL,
    bank_account_id INT NULL,
    vendor_name VARCHAR(200),
    receipt_image VARCHAR(500),
    notes TEXT,
    status ENUM('pending', 'approved', 'paid') DEFAULT 'pending',
    created_by INT NOT NULL,
    approved_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES expense_categories(id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_expense_number (expense_number),
    INDEX idx_expense_date (expense_date)
);

-- Enhanced Financial Transactions (تراکنش‌های مالی پیشرفته)
CREATE TABLE journal_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entry_number VARCHAR(20) NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_type ENUM('invoice', 'payment', 'expense', 'manual', 'bank_transaction', 'stock_adjustment') NOT NULL,
    reference_id INT NULL,
    total_debit DECIMAL(15,2) NOT NULL,
    total_credit DECIMAL(15,2) NOT NULL,
    is_balanced BOOLEAN GENERATED ALWAYS AS (total_debit = total_credit) STORED,
    status ENUM('draft', 'posted', 'reversed') DEFAULT 'posted',
    created_by INT NOT NULL,
    posted_by INT NULL,
    posted_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (posted_by) REFERENCES users(id),
    INDEX idx_entry_number (entry_number),
    INDEX idx_entry_date (entry_date),
    INDEX idx_reference (reference_type, reference_id)
);

-- Journal Entry Details (جزئیات قیود)
CREATE TABLE journal_entry_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    journal_entry_id INT NOT NULL,
    account_id INT NOT NULL,
    description TEXT,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    customer_id INT NULL,
    bank_account_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    INDEX idx_journal_entry (journal_entry_id),
    INDEX idx_account (account_id)
);

-- Bank Transactions (تراکنش‌های بانکی)
CREATE TABLE bank_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_account_id INT NOT NULL,
    transaction_type ENUM('deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'fee', 'interest') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_number VARCHAR(50),
    related_journal_entry_id INT NULL,
    reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (related_journal_entry_id) REFERENCES journal_entries(id),
    INDEX idx_bank_account (bank_account_id),
    INDEX idx_transaction_date (transaction_date)
);

-- Customer Credit Limits (سقف اعتبار مشتریان)
CREATE TABLE customer_credit_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL UNIQUE,
    credit_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_used_credit DECIMAL(15,2) DEFAULT 0,
    available_credit DECIMAL(15,2) GENERATED ALWAYS AS (credit_limit - current_used_credit) STORED,
    effective_date DATE NOT NULL,
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Insert Basic Chart of Accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_name_persian, account_type, is_system_account) VALUES
-- Assets (دارایی‌ها)
('1000', 'Assets', 'دارایی‌ها', 'asset', true),
('1100', 'Current Assets', 'دارایی‌های جاری', 'asset', true),
('1110', 'Cash in Hand', 'موجودی نقد', 'asset', true),
('1120', 'Bank Accounts', 'حساب‌های بانکی', 'asset', true),
('1130', 'Accounts Receivable', 'حساب‌های دریافتنی', 'asset', true),
('1140', 'Inventory - Gold', 'موجودی کالا - طلا', 'asset', true),
('1150', 'Prepaid Expenses', 'هزینه‌های پیش‌پرداخت', 'asset', true),

-- Liabilities (بدهی‌ها)
('2000', 'Liabilities', 'بدهی‌ها', 'liability', true),
('2100', 'Current Liabilities', 'بدهی‌های جاری', 'liability', true),
('2110', 'Accounts Payable', 'حساب‌های پرداختنی', 'liability', true),
('2120', 'Accrued Expenses', 'هزینه‌های تعهدی', 'liability', true),
('2130', 'Customer Deposits', 'پیش‌دریافت از مشتریان', 'liability', true),

-- Equity (حقوق صاحبان سهام)
('3000', 'Equity', 'حقوق صاحبان سهام', 'equity', true),
('3100', 'Owner Equity', 'سرمایه مالک', 'equity', true),
('3200', 'Retained Earnings', 'سود انباشته', 'equity', true),

-- Revenue (درآمدها)
('4000', 'Revenue', 'درآمدها', 'revenue', true),
('4100', 'Sales Revenue', 'درآمد فروش', 'revenue', true),
('4110', 'Gold Sales', 'فروش طلا', 'revenue', true),
('4120', 'Labor Charges', 'اجرت ساخت', 'revenue', true),
('4900', 'Other Revenue', 'سایر درآمدها', 'revenue', true),

-- Expenses (هزینه‌ها)
('5000', 'Expenses', 'هزینه‌ها', 'expense', true),
('5100', 'Cost of Goods Sold', 'بهای تمام‌شده کالای فروخته‌شده', 'expense', true),
('5200', 'Operating Expenses', 'هزینه‌های عملیاتی', 'expense', true),
('5210', 'Rent Expense', 'اجاره', 'expense', true),
('5220', 'Utilities', 'آب و برق و گاز', 'expense', true),
('5230', 'Salaries', 'حقوق و دستمزد', 'expense', true),
('5240', 'Marketing', 'تبلیغات و بازاریابی', 'expense', true),
('5250', 'Office Supplies', 'لوازم اداری', 'expense', true),
('5260', 'Insurance', 'بیمه', 'expense', true),
('5270', 'Repairs & Maintenance', 'تعمیر و نگهداری', 'expense', true),
('5900', 'Other Expenses', 'سایر هزینه‌ها', 'expense', true);

-- Insert Basic Expense Categories
INSERT INTO expense_categories (category_name, category_name_persian) VALUES
('operational', 'هزینه‌های عملیاتی'),
('administrative', 'هزینه‌های اداری'),
('marketing', 'تبلیغات و بازاریابی'),
('utilities', 'آب و برق و گاز'),
('rent', 'اجاره'),
('salaries', 'حقوق و دستمزد'),
('supplies', 'لوازم و ملزومات'),
('maintenance', 'تعمیر و نگهداری'),
('insurance', 'بیمه'),
('taxes', 'مالیات و عوارض'),
('professional_services', 'خدمات حرفه‌ای'),
('transportation', 'حمل و نقل'),
('communication', 'ارتباطات'),
('entertainment', 'پذیرایی'),
('other', 'سایر هزینه‌ها');

-- Update parent relationships for chart of accounts
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1000') WHERE account_code = '1100';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1100') WHERE account_code IN ('1110', '1120', '1130', '1140', '1150');
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '2000') WHERE account_code = '2100';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '2100') WHERE account_code IN ('2110', '2120', '2130');
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '3000') WHERE account_code IN ('3100', '3200');
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '4000') WHERE account_code = '4100';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '4100') WHERE account_code IN ('4110', '4120');
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '4000') WHERE account_code = '4900';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '5000') WHERE account_code IN ('5100', '5200', '5900');
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '5200') WHERE account_code IN ('5210', '5220', '5230', '5240', '5250', '5260', '5270'); 