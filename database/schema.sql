-- Gold Shop Management Database Schema
CREATE DATABASE IF NOT EXISTS gold_shop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gold_shop_db;

-- Users table for authentication
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Item types lookup table
CREATE TABLE item_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    name_persian VARCHAR(100) NOT NULL
);

-- Inventory items table
CREATE TABLE inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(20) NOT NULL UNIQUE,
    item_name VARCHAR(200) NOT NULL,
    type_id INT NOT NULL,
    image_path VARCHAR(500),
    carat INT NOT NULL,
    precise_weight DECIMAL(8,3) NOT NULL,
    stone_weight DECIMAL(8,3) DEFAULT 0,
    labor_cost_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
    labor_cost_value DECIMAL(10,2) NOT NULL,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    purchase_cost DECIMAL(15,2) NOT NULL,
    current_quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (type_id) REFERENCES item_types(id),
    INDEX idx_item_code (item_code),
    INDEX idx_item_name (item_name)
);

-- Customers table
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    national_id VARCHAR(20),
    city VARCHAR(100),
    address TEXT,
    total_purchases DECIMAL(15,2) DEFAULT 0,
    total_payments DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_code (customer_code),
    INDEX idx_full_name (full_name),
    INDEX idx_phone (phone)
);

-- Suppliers Table
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_code VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    address TEXT NULL,
    tax_number VARCHAR(50) NULL,
    current_balance DECIMAL(15,2) DEFAULT 0,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_supplier_code (supplier_code),
    INDEX idx_company_name (company_name),
    INDEX idx_is_active (is_active)
);

-- Employees Table  
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(100) NULL,
    department VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    hire_date DATE NULL,
    salary DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employee_code (employee_code),
    INDEX idx_full_name (full_name),
    INDEX idx_is_active (is_active)
);

-- Other Parties Table (for miscellaneous parties)
CREATE TABLE other_parties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    party_code VARCHAR(20) UNIQUE NOT NULL,
    party_name VARCHAR(255) NOT NULL,
    party_type VARCHAR(100) NULL,
    contact_info VARCHAR(255) NULL,
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_party_code (party_code),
    INDEX idx_party_name (party_name),
    INDEX idx_is_active (is_active)
);

-- Daily gold rates table
CREATE TABLE gold_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    rate_per_gram DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    invoice_date DATE NOT NULL,
    invoice_date_shamsi VARCHAR(10),
    invoice_type ENUM('sale', 'purchase') DEFAULT 'sale',
    gold_rate DECIMAL(15,2) NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    grand_total DECIMAL(15,2) NOT NULL,
    total_weight DECIMAL(8,3) DEFAULT 0,
    plastic_weight DECIMAL(8,3) DEFAULT 0,
    final_weight DECIMAL(8,3) DEFAULT 0,
    total_labor_cost DECIMAL(15,2) DEFAULT 0,
    total_profit DECIMAL(15,2) DEFAULT 0,
    total_tax DECIMAL(15,2) DEFAULT 0,
    manual_total_weight DECIMAL(8,3) DEFAULT 0,
    notes TEXT,
    status ENUM('active', 'cancelled', 'returned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_customer_id (customer_id),
    INDEX idx_invoice_date (invoice_date),
    INDEX idx_invoice_type (invoice_type)
);

-- Invoice items table
CREATE TABLE invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    weight DECIMAL(8,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    labor_percentage DECIMAL(5,2) DEFAULT 0,
    labor_cost DECIMAL(15,2) DEFAULT 0,
    profit_amount DECIMAL(15,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    tax_cost DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id)
);

-- Payments table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'transfer') NOT NULL,
    payment_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_payment_date (payment_date)
);

-- Stock adjustments table
CREATE TABLE stock_adjustments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    adjustment_type ENUM('increase', 'decrease') NOT NULL,
    quantity_changed INT NOT NULL,
    reason VARCHAR(500) NOT NULL,
    adjusted_by INT NOT NULL,
    adjustment_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (adjusted_by) REFERENCES users(id)
);

-- Financial transactions log table
CREATE TABLE financial_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL UNIQUE,
    transaction_type ENUM('sale', 'payment', 'expense', 'stock_adjustment') NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    related_customer_id INT,
    related_invoice_id INT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (related_customer_id) REFERENCES customers(id),
    FOREIGN KEY (related_invoice_id) REFERENCES invoices(id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_transaction_date (transaction_date)
);

-- Professional Transactions Table
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_number VARCHAR(50) NOT NULL UNIQUE,
    transaction_date DATE NOT NULL,
    transaction_type ENUM('payment', 'receipt', 'purchase', 'sale', 'transfer', 'adjustment') NOT NULL,
    description TEXT NOT NULL,
    party_type ENUM('customer', 'supplier', 'employee', 'other') NULL,
    party_id INT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('cash', 'check', 'bank_transfer', 'card', 'online') NULL,
    reference_number VARCHAR(100) NULL,
    bank_account_id INT NULL,
    notes TEXT NULL,
    status ENUM('draft', 'pending', 'completed', 'cancelled') DEFAULT 'completed',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_party (party_type, party_id),
    INDEX idx_created_by (created_by),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
);

-- Transaction Attachments
CREATE TABLE transaction_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Add reference_id column to journal_entries if not exists
ALTER TABLE journal_entries ADD COLUMN reference_id INT NULL AFTER reference_type;

-- Add beneficiary name to transactions
ALTER TABLE transactions ADD COLUMN beneficiary_name VARCHAR(255) NULL AFTER reference_number;

-- Insert default item types
INSERT INTO item_types (name, name_persian) VALUES
('ring', 'انگشتر'),
('necklace', 'گردنبند'),
('bracelet', 'دستبند'),
('earring', 'گوشواره'),
('coin', 'سکه'),
('melted_gold', 'طلای آب‌شده');

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, full_name, role) VALUES
('admin', '$2a$10$z7Z8jKJ3mU.hV.Vn6W7X8Y9Z0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P', 'مدیر سیستم', 'admin');

-- Insert sample gold rate for today
INSERT INTO gold_rates (date, rate_per_gram) VALUES
(CURDATE(), 3500000); 