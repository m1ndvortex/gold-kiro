-- Gold Shop Management System - Secure Backup
-- Created: ۱۴۰۴/۵/۲, ۲:۲۷:۲۸
-- Type: full
-- Description: Test backup from browser - System validation
-- User: مدیر سیستم
-- Database: gold_shop_db

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- ========================================
-- TABLE STRUCTURES
-- ========================================

-- Structure for table: backup_history
DROP TABLE IF EXISTS `backup_history`;
CREATE TABLE `backup_history` (
  `id` bigint(20) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `backup_type` enum('full','data','schema') DEFAULT 'full',
  `description` text DEFAULT NULL,
  `file_size` bigint(20) DEFAULT 0,
  `status` enum('processing','success','failed') DEFAULT 'processing',
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `backup_history_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: bank_accounts
DROP TABLE IF EXISTS `bank_accounts`;
CREATE TABLE `bank_accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_number` varchar(30) NOT NULL,
  `bank_name` varchar(100) NOT NULL,
  `branch_name` varchar(100) DEFAULT NULL,
  `account_holder` varchar(200) NOT NULL,
  `account_type` enum('checking','savings','business') DEFAULT 'checking',
  `current_balance` decimal(15,2) DEFAULT 0.00,
  `initial_balance` decimal(15,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_number` (`account_number`),
  KEY `idx_account_number` (`account_number`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: bank_transactions
DROP TABLE IF EXISTS `bank_transactions`;
CREATE TABLE `bank_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bank_account_id` int(11) NOT NULL,
  `transaction_type` enum('deposit','withdrawal','transfer_in','transfer_out','fee','interest') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `balance_after` decimal(15,2) NOT NULL,
  `transaction_date` date NOT NULL,
  `description` text NOT NULL,
  `reference_number` varchar(50) DEFAULT NULL,
  `related_journal_entry_id` int(11) DEFAULT NULL,
  `reconciled` tinyint(1) DEFAULT 0,
  `reconciled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `related_journal_entry_id` (`related_journal_entry_id`),
  KEY `idx_bank_account` (`bank_account_id`),
  KEY `idx_transaction_date` (`transaction_date`),
  CONSTRAINT `bank_transactions_ibfk_1` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`),
  CONSTRAINT `bank_transactions_ibfk_2` FOREIGN KEY (`related_journal_entry_id`) REFERENCES `journal_entries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: categories
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `name_persian` varchar(200) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: chart_of_accounts
DROP TABLE IF EXISTS `chart_of_accounts`;
CREATE TABLE `chart_of_accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_code` varchar(10) NOT NULL,
  `account_name` varchar(200) NOT NULL,
  `account_name_persian` varchar(200) NOT NULL,
  `account_type` enum('asset','liability','equity','revenue','expense') NOT NULL,
  `parent_account_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_system_account` tinyint(1) DEFAULT 0,
  `balance` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_code` (`account_code`),
  KEY `parent_account_id` (`parent_account_id`),
  KEY `idx_account_code` (`account_code`),
  KEY `idx_account_type` (`account_type`),
  CONSTRAINT `chart_of_accounts_ibfk_1` FOREIGN KEY (`parent_account_id`) REFERENCES `chart_of_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: customers
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(20) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `national_id` varchar(20) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `job_title` varchar(100) DEFAULT NULL,
  `emergency_phone` varchar(20) DEFAULT NULL,
  `reference_name` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `customer_type` enum('normal','vip','wholesale','regular') DEFAULT 'normal',
  `is_active` tinyint(1) DEFAULT 1,
  `last_purchase_date` date DEFAULT NULL,
  `total_purchases` decimal(15,2) DEFAULT 0.00,
  `total_payments` decimal(15,2) DEFAULT 0.00,
  `current_balance` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_code` (`customer_code`),
  KEY `idx_customer_code` (`customer_code`),
  KEY `idx_full_name` (`full_name`),
  KEY `idx_phone` (`phone`),
  KEY `idx_customer_type` (`customer_type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: employees
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_code` varchar(20) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `position` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `salary` decimal(15,2) DEFAULT 0.00,
  `current_balance` decimal(15,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  KEY `idx_employee_code` (`employee_code`),
  KEY `idx_full_name` (`full_name`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: expenses
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expense_number` varchar(20) NOT NULL,
  `category_id` int(11) NOT NULL,
  `description` text NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `expense_date` date NOT NULL,
  `payment_method` enum('cash','bank_transfer','check','card') NOT NULL,
  `bank_account_id` int(11) DEFAULT NULL,
  `vendor_name` varchar(200) DEFAULT NULL,
  `receipt_image` varchar(500) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pending','approved','paid') DEFAULT 'pending',
  `created_by` int(11) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `expense_number` (`expense_number`),
  KEY `category_id` (`category_id`),
  KEY `bank_account_id` (`bank_account_id`),
  KEY `created_by` (`created_by`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_expense_number` (`expense_number`),
  KEY `idx_expense_date` (`expense_date`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`),
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`),
  CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: expense_categories
DROP TABLE IF EXISTS `expense_categories`;
CREATE TABLE `expense_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `category_name_persian` varchar(100) NOT NULL,
  `parent_category_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `parent_category_id` (`parent_category_id`),
  KEY `idx_category_name` (`category_name_persian`),
  CONSTRAINT `expense_categories_ibfk_1` FOREIGN KEY (`parent_category_id`) REFERENCES `expense_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: financial_transactions
DROP TABLE IF EXISTS `financial_transactions`;
CREATE TABLE `financial_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_id` varchar(50) NOT NULL,
  `transaction_type` enum('sale','payment','expense','stock_adjustment') NOT NULL,
  `description` text NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `related_customer_id` int(11) DEFAULT NULL,
  `related_invoice_id` int(11) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `related_customer_id` (`related_customer_id`),
  KEY `related_invoice_id` (`related_invoice_id`),
  KEY `idx_transaction_type` (`transaction_type`),
  KEY `idx_transaction_date` (`transaction_date`),
  CONSTRAINT `financial_transactions_ibfk_1` FOREIGN KEY (`related_customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `financial_transactions_ibfk_2` FOREIGN KEY (`related_invoice_id`) REFERENCES `invoices` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: gold_inventory
DROP TABLE IF EXISTS `gold_inventory`;
CREATE TABLE `gold_inventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_date` datetime NOT NULL,
  `transaction_date_shamsi` varchar(20) DEFAULT NULL,
  `transaction_type` enum('initial','sale','purchase','adjustment') NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `weight_change` decimal(10,3) NOT NULL COMMENT 'Positive for additions, negative for reductions',
  `current_weight` decimal(10,3) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: gold_rates
DROP TABLE IF EXISTS `gold_rates`;
CREATE TABLE `gold_rates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `rate_per_gram` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `date` (`date`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: inventory_items
DROP TABLE IF EXISTS `inventory_items`;
CREATE TABLE `inventory_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_code` varchar(20) NOT NULL,
  `item_name` varchar(200) NOT NULL,
  `type_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `carat` int(11) NOT NULL,
  `precise_weight` decimal(8,3) NOT NULL,
  `stone_weight` decimal(8,3) DEFAULT 0.000,
  `labor_cost_type` enum('percentage','fixed') DEFAULT 'percentage',
  `labor_cost_value` decimal(10,2) NOT NULL,
  `profit_margin` decimal(5,2) DEFAULT 0.00,
  `purchase_cost` decimal(15,2) NOT NULL,
  `current_quantity` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `item_code` (`item_code`),
  KEY `type_id` (`type_id`),
  KEY `category_id` (`category_id`),
  KEY `idx_item_code` (`item_code`),
  KEY `idx_item_name` (`item_name`),
  CONSTRAINT `inventory_items_ibfk_1` FOREIGN KEY (`type_id`) REFERENCES `item_types` (`id`),
  CONSTRAINT `inventory_items_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: invoices
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(20) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `invoice_date` date NOT NULL,
  `invoice_date_shamsi` varchar(10) DEFAULT NULL,
  `invoice_type` enum('sale','purchase') DEFAULT 'sale',
  `gold_rate` decimal(15,2) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `discount_amount` decimal(15,2) DEFAULT 0.00,
  `tax_amount` decimal(15,2) DEFAULT 0.00,
  `grand_total` decimal(15,2) NOT NULL,
  `total_weight` decimal(8,3) DEFAULT 0.000,
  `plastic_weight` decimal(8,3) DEFAULT 0.000,
  `final_weight` decimal(8,3) DEFAULT 0.000,
  `total_labor_cost` decimal(15,2) DEFAULT 0.00,
  `total_profit` decimal(15,2) DEFAULT 0.00,
  `total_tax` decimal(15,2) DEFAULT 0.00,
  `manual_total_weight` decimal(8,3) DEFAULT 0.000,
  `notes` text DEFAULT NULL,
  `status` enum('active','cancelled','returned') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `paid_amount` decimal(15,2) DEFAULT 0.00 COMMENT 'مبلغ پرداخت شده',
  `remaining_amount` decimal(15,2) DEFAULT 0.00 COMMENT 'مبلغ باقیمانده',
  `payment_status` enum('unpaid','partial','paid') DEFAULT 'unpaid' COMMENT 'وضعیت پرداخت',
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `idx_invoice_number` (`invoice_number`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_invoice_date` (`invoice_date`),
  KEY `idx_invoice_type` (`invoice_type`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: invoice_items
DROP TABLE IF EXISTS `invoice_items`;
CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `weight` decimal(8,3) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `total_price` decimal(15,2) NOT NULL,
  `labor_percentage` decimal(5,2) DEFAULT 0.00,
  `labor_cost` decimal(15,2) DEFAULT 0.00,
  `profit_amount` decimal(15,2) DEFAULT 0.00,
  `tax_percentage` decimal(5,2) DEFAULT 0.00,
  `tax_cost` decimal(15,2) DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `carat` int(11) DEFAULT 18 COMMENT 'عیار طلا',
  `manual_weight` decimal(8,3) DEFAULT 0.000 COMMENT 'وزن دستی وارد شده',
  `daily_gold_price` decimal(15,2) DEFAULT 0.00 COMMENT 'قیمت طلای روز',
  `tax_amount` decimal(15,2) DEFAULT 0.00 COMMENT 'مبلغ مالیات',
  `final_unit_price` decimal(15,2) DEFAULT 0.00 COMMENT 'قیمت نهایی واحد',
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: item_types
DROP TABLE IF EXISTS `item_types`;
CREATE TABLE `item_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `name_persian` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: journal_entries
DROP TABLE IF EXISTS `journal_entries`;
CREATE TABLE `journal_entries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entry_number` varchar(20) NOT NULL,
  `entry_date` date NOT NULL,
  `description` text NOT NULL,
  `reference_type` enum('invoice','payment','expense','manual','bank_transaction','stock_adjustment') NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `total_debit` decimal(15,2) NOT NULL,
  `total_credit` decimal(15,2) NOT NULL,
  `is_balanced` tinyint(1) GENERATED ALWAYS AS (`total_debit` = `total_credit`) STORED,
  `status` enum('draft','posted','reversed') DEFAULT 'posted',
  `created_by` int(11) NOT NULL,
  `posted_by` int(11) DEFAULT NULL,
  `posted_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `entry_number` (`entry_number`),
  KEY `created_by` (`created_by`),
  KEY `posted_by` (`posted_by`),
  KEY `idx_entry_number` (`entry_number`),
  KEY `idx_entry_date` (`entry_date`),
  KEY `idx_reference` (`reference_type`,`reference_id`),
  CONSTRAINT `journal_entries_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `journal_entries_ibfk_2` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: journal_entry_details
DROP TABLE IF EXISTS `journal_entry_details`;
CREATE TABLE `journal_entry_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `journal_entry_id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `debit_amount` decimal(15,2) DEFAULT 0.00,
  `credit_amount` decimal(15,2) DEFAULT 0.00,
  `customer_id` int(11) DEFAULT NULL,
  `bank_account_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `bank_account_id` (`bank_account_id`),
  KEY `idx_journal_entry` (`journal_entry_id`),
  KEY `idx_account` (`account_id`),
  CONSTRAINT `journal_entry_details_ibfk_1` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `journal_entry_details_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `journal_entry_details_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `journal_entry_details_ibfk_4` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: other_parties
DROP TABLE IF EXISTS `other_parties`;
CREATE TABLE `other_parties` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `party_code` varchar(20) NOT NULL,
  `party_name` varchar(255) NOT NULL,
  `party_type` varchar(100) DEFAULT NULL,
  `contact_info` varchar(255) DEFAULT NULL,
  `current_balance` decimal(15,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `party_code` (`party_code`),
  KEY `idx_party_code` (`party_code`),
  KEY `idx_party_name` (`party_name`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: payments
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` enum('cash','card','transfer') NOT NULL,
  `payment_date` date NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_payment_date` (`payment_date`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: suppliers
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_code` varchar(20) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `tax_number` varchar(50) DEFAULT NULL,
  `current_balance` decimal(15,2) DEFAULT 0.00,
  `credit_limit` decimal(15,2) DEFAULT 0.00,
  `payment_terms` int(11) DEFAULT 30,
  `is_active` tinyint(1) DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `supplier_code` (`supplier_code`),
  KEY `idx_supplier_code` (`supplier_code`),
  KEY `idx_company_name` (`company_name`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: system_settings
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: transactions
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_number` varchar(50) NOT NULL,
  `transaction_date` date NOT NULL,
  `transaction_type` enum('payment','receipt','purchase','sale','transfer','adjustment') NOT NULL,
  `description` text NOT NULL,
  `party_type` enum('customer','supplier','employee','other') DEFAULT NULL,
  `party_id` int(11) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` enum('cash','check','bank_transfer','card','online') DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `beneficiary_name` varchar(255) DEFAULT NULL,
  `bank_account_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('draft','pending','completed','cancelled') DEFAULT 'completed',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_number` (`transaction_number`),
  KEY `idx_transaction_date` (`transaction_date`),
  KEY `idx_transaction_type` (`transaction_type`),
  KEY `idx_party` (`party_type`,`party_id`),
  KEY `idx_created_by` (`created_by`),
  KEY `bank_account_id` (`bank_account_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Structure for table: users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE DATA
-- ========================================

-- Data for table: backup_history
DELETE FROM `backup_history`;
ALTER TABLE `backup_history` AUTO_INCREMENT = 1;
INSERT INTO `backup_history` (`id`, `filename`, `backup_type`, `description`, `file_size`, `status`, `error_message`, `created_at`, `completed_at`, `created_by`) VALUES
(1753310646384, 'backup_full_2025-07-23T22-44-05-876Z_da18c09d.sql', 'full', '', 41390, 'success', NULL, '2025-07-23 22:44:05', '2025-07-23 22:44:06', 1),
(1753310688878, 'safety_backup_before_restore_2025-07-23T22-44-48-811Z.sql', 'full', 'بک‌آپ امنیتی قبل از بازیابی - بازیابی موفق', 0, 'success', NULL, '2025-07-23 22:44:48', '2025-07-23 22:44:48', 1),
(1753311449362, 'backup_full_2025-07-23T22-57-28-911Z_52ae6dde.sql', 'full', 'Test backup from browser - System validation', 0, 'processing', NULL, '2025-07-23 22:57:28', NULL, 1);

-- Data for table: bank_accounts
DELETE FROM `bank_accounts`;
ALTER TABLE `bank_accounts` AUTO_INCREMENT = 1;
INSERT INTO `bank_accounts` (`id`, `account_number`, `bank_name`, `branch_name`, `account_holder`, `account_type`, `current_balance`, `initial_balance`, `is_active`, `notes`, `created_at`, `updated_at`) VALUES
(1, '0123456789012345', 'بانک ملی ایران', 'شعبه مرکزی تهران', 'طلافروشی موسی پور', 'checking', '5000000.00', '5000000.00', 1, 'حساب اصلی طلافروشی برای تراکنش‌های روزانه', '2025-07-21 22:41:14', '2025-07-21 22:41:14');

-- No data in table: bank_transactions

-- No data in table: categories

-- No data in table: chart_of_accounts

-- Data for table: customers
DELETE FROM `customers`;
ALTER TABLE `customers` AUTO_INCREMENT = 1;
INSERT INTO `customers` (`id`, `customer_code`, `full_name`, `phone`, `national_id`, `city`, `address`, `email`, `birth_date`, `gender`, `job_title`, `emergency_phone`, `reference_name`, `notes`, `customer_type`, `is_active`, `last_purchase_date`, `total_purchases`, `total_payments`, `current_balance`, `created_at`, `updated_at`) VALUES
(2, 'CUS-0002', 'فاطمه احمدی', '09123456790', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'normal', 1, NULL, '0.00', '0.00', '0.00', '2025-07-21 00:00:44', '2025-07-21 00:00:44'),
(13, 'TEST-6325', 'آقای محمدرضا کریمی', '09123456789', '0123456789', NULL, 'تهران، خیابان ولیعصر، نرسیده به پارک وی، پلاک ۱۲۳، واحد ۴', 'mr.karimi@gmail.com', '1975-03-14 20:30:00', 'male', 'مدیر شرکت', '09987654321', 'آقای احمدی', 'مشتری VIP - اولویت بالا در خدمات', 'vip', 1, '2024-01-14 20:30:00', '-45000000.00', '20000000.00', '-65000000.00', '2025-07-21 21:18:20', '2025-07-23 22:44:23'),
(14, 'TEST-3695', 'خانم فاطمه صادقی نژاد', '09987654321', '9876543210', NULL, 'اصفهان، خیابان چهارباغ عباسی، کوچه گل‌ها، پلاک ۴۵', 'f.sadeghi@yahoo.com', '1988-07-21 20:30:00', 'female', 'پزشک متخصص', '09111111111', 'دکتر محمدی', 'مشتری منظم - خریدهای ماهانه', 'regular', 1, '2024-02-09 20:30:00', '15000000.00', '15000000.00', '0.00', '2025-07-21 21:18:20', '2025-07-21 21:18:20'),
(15, 'TEST-2277', 'آقای علی اکبر رضایی', '09111111111', '1111111111', NULL, 'شیراز، خیابان زند، مجتمع تجاری پارس، طبقه دوم', 'aliakbar.rezaei@hotmail.com', '1965-12-09 20:30:00', 'male', 'بازرگان طلا و جواهر', '09222222222', 'اتحادیه طلا', 'خرید عمده - تخفیف ویژه', 'wholesale', 1, '2024-01-19 20:30:00', '132250000.00', '45000000.00', '87250000.00', '2025-07-21 21:18:20', '2025-07-22 22:14:10'),
(16, 'TEST-2568', 'خانم مریم حسینی', '09222222222', '2222222222', NULL, 'مشهد، خیابان امام رضا، نبش کوچه شهید بهشتی، پلاک ۷۸', 'maryam.hosseini@gmail.com', '1992-03-17 20:30:00', 'female', 'معلم دبستان', '09333333333', 'خانم احمدی', 'مشتری جوان - علاقه‌مند به طراحی‌های مدرن', 'normal', 1, '2024-02-04 20:30:00', '8000000.00', '10000000.00', '-2000000.00', '2025-07-21 21:18:20', '2025-07-21 21:18:20'),
(17, 'TEST-5170', 'خانم زهرا امینی', '09444444444', '4444444444', NULL, 'کرج، خیابان طالقانی، مجتمع مسکونی آزادی، بلوک ب، واحد ۱۵', 'z.amini@outlook.com', '1985-11-07 20:30:00', 'female', 'مهندس کامپیوتر', '09555555555', 'همکار دفتر', 'مشتری تکنولوژی - ترجیح پرداخت آنلاین', 'normal', 1, '2024-02-11 20:30:00', '12000000.00', '8000000.00', '4000000.00', '2025-07-21 21:18:20', '2025-07-21 21:18:20'),
(18, 'CUS-0018', 'علی احمدی', '09123456789', '0013542419', NULL, 'تهران، خیابان ولیعصر، پلاک 123', 'ali.ahmadi@test.com', NULL, 'male', 'مهندس', NULL, 'محمد رضایی', 'مشتری تست با اطلاعات کامل فارسی', 'normal', 1, NULL, '0.00', '0.00', '0.00', '2025-07-21 21:27:17', '2025-07-21 21:27:17'),
(19, 'CUS-0019', 'فاطمه کریمی', '09987654321', NULL, NULL, 'اصفهان، خیابان چهارباغ، کوچه گل‌ها', NULL, NULL, 'female', 'پزشک', NULL, NULL, 'مشتری VIP بدون کد ملی', 'vip', 1, NULL, '0.00', '0.00', '0.00', '2025-07-21 21:27:18', '2025-07-21 21:27:18'),
(20, 'CUS-0020', 'تست کد ملی نامعتبر', NULL, '1234567890', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'normal', 1, NULL, '0.00', '0.00', '0.00', '2025-07-21 21:27:19', '2025-07-21 21:27:19'),
(21, 'CUS-0021', 'تست شماره نامعتبر', '123456789', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'normal', 1, NULL, '0.00', '0.00', '0.00', '2025-07-21 21:27:20', '2025-07-21 21:27:20'),
(22, 'CUS-0022', 'تست ایمیل نامعتبر', NULL, NULL, NULL, NULL, 'invalid-email', NULL, NULL, NULL, NULL, NULL, NULL, 'normal', 1, NULL, '0.00', '0.00', '0.00', '2025-07-21 21:27:20', '2025-07-21 21:27:20'),
(23, 'CUS-0023', 'مشتری کد یکتا اول', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'normal', 1, NULL, '0.00', '0.00', '0.00', '2025-07-21 21:27:20', '2025-07-21 21:27:20'),
(25, 'CUS-0025', 'مشتری کد یکتا سوم', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'normal', 1, NULL, '0.00', '0.00', '0.00', '2025-07-21 21:27:21', '2025-07-21 21:27:21'),
(26, 'CUS-0026', 'محمد حسن زاده', '09123456789', NULL, NULL, 'تهران، خیابان انقلاب، کوچه شهید احمدی، پلاک 25', NULL, NULL, 'male', 'مهندس نرم‌افزار', NULL, NULL, NULL, 'normal', 1, NULL, '0.00', '0.00', '0.00', '2025-07-21 21:30:06', '2025-07-21 21:30:06'),
(28, 'TEST-RESTORE', 'مشتری تست بازیابی', '09123456789', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'normal', 1, NULL, '0.00', '0.00', '0.00', '2025-07-23 22:49:06', '2025-07-23 22:49:06');

-- No data in table: employees

-- No data in table: expenses

-- No data in table: expense_categories

-- Data for table: financial_transactions
DELETE FROM `financial_transactions`;
ALTER TABLE `financial_transactions` AUTO_INCREMENT = 1;
INSERT INTO `financial_transactions` (`id`, `transaction_id`, `transaction_type`, `description`, `amount`, `related_customer_id`, `related_invoice_id`, `transaction_date`, `created_at`) VALUES
(1, 'SALE-INV-0001', 'sale', 'فروش کالا - فاکتور INV-0001', '12250000.00', 15, 7, '2025-07-20 20:30:00', '2025-07-21 22:11:42'),
(2, 'SALE-INV-0008', 'sale', 'فروش کالا - فاکتور INV-0008', '70000000.00', 15, 8, '2025-07-21 20:30:00', '2025-07-22 22:14:10');

-- Data for table: gold_inventory
DELETE FROM `gold_inventory`;
ALTER TABLE `gold_inventory` AUTO_INCREMENT = 1;
INSERT INTO `gold_inventory` (`id`, `transaction_date`, `transaction_date_shamsi`, `transaction_type`, `reference_id`, `weight_change`, `current_weight`, `description`, `created_at`, `updated_at`) VALUES
(1, '2025-07-22 22:01:38', '۱۴۰۴/۰۵/۰۱', 'adjustment', NULL, '50.000', '50.000', '', '2025-07-22 22:01:38', '2025-07-22 22:01:38'),
(2, '2025-07-22 22:13:40', '۱۴۰۴/۰۵/۰۱', 'adjustment', NULL, '0.000', '50.000', '', '2025-07-22 22:13:40', '2025-07-22 22:13:40'),
(3, '2025-07-21 20:30:00', '۱۴۰۴/۰۵/۰۱', 'sale', 8, '-20.000', '30.000', 'فروش طلا - فاکتور شماره INV-0008', '2025-07-22 22:14:10', '2025-07-22 22:14:10'),
(4, '2025-07-21 20:30:00', '۱۴۰۴/۰۵/۰۱', 'purchase', 9, '10.000', '60.000', 'خرید طلا - فاکتور شماره PURCH-0009', '2025-07-22 22:14:33', '2025-07-22 22:14:33');

-- Data for table: gold_rates
DELETE FROM `gold_rates`;
ALTER TABLE `gold_rates` AUTO_INCREMENT = 1;
INSERT INTO `gold_rates` (`id`, `date`, `rate_per_gram`, `created_at`) VALUES
(1, '2025-07-19 20:30:00', '3500000.00', '2025-07-20 23:26:17'),
(2, '2025-07-20 20:30:00', '3500000.00', '2025-07-21 00:05:57');

-- Data for table: inventory_items
DELETE FROM `inventory_items`;
ALTER TABLE `inventory_items` AUTO_INCREMENT = 1;
INSERT INTO `inventory_items` (`id`, `item_code`, `item_name`, `type_id`, `category_id`, `image_path`, `carat`, `precise_weight`, `stone_weight`, `labor_cost_type`, `labor_cost_value`, `profit_margin`, `purchase_cost`, `current_quantity`, `created_at`, `updated_at`) VALUES
(8, 'ITM-0001', 'گردنبند', 1, 2, NULL, 18, '0.000', '0.000', 'fixed', '0.00', '0.00', '0.00', 1, '2025-07-21 22:07:19', '2025-07-21 22:07:19'),
(9, 'ITM-0009', 'انگشتر طلا', 1, 1, NULL, 18, '3.500', '0.000', 'fixed', '0.00', '0.00', '0.00', 3, '2025-07-21 22:07:24', '2025-07-21 22:27:04'),
(10, 'ITM-0010', 'گردنبند طلا', 1, 1, NULL, 18, '8.200', '0.000', 'fixed', '0.00', '0.00', '0.00', 3, '2025-07-21 22:07:24', '2025-07-21 22:07:24'),
(11, 'ITM-0011', 'دستبند طلا', 1, 1, NULL, 18, '12.500', '0.000', 'fixed', '0.00', '0.00', '0.00', 4, '2025-07-21 22:07:24', '2025-07-21 22:07:24'),
(12, 'ITM-0012', 'گوشواره طلا', 1, 1, NULL, 18, '2.800', '0.000', 'fixed', '0.00', '0.00', '0.00', 6, '2025-07-21 22:07:24', '2025-07-21 22:07:24'),
(13, 'ITM-0013', 'انگشتر طلای سفید', 1, 1, NULL, 14, '4.100', '0.000', 'fixed', '0.00', '0.00', '0.00', 3, '2025-07-21 22:07:24', '2025-07-21 22:07:24'),
(14, 'ITM-0014', 'زنجیر طلا', 1, 1, NULL, 18, '15.300', '0.000', 'fixed', '0.00', '0.00', '0.00', 2, '2025-07-21 22:07:24', '2025-07-21 22:07:24'),
(15, 'ITM-0015', 'آویز طلا', 1, 1, NULL, 18, '5.700', '0.000', 'fixed', '0.00', '0.00', '0.00', 3, '2025-07-21 22:07:24', '2025-07-22 22:14:10'),
(16, 'ITM-0016', 'النگو طلا', 1, 1, NULL, 18, '18.900', '0.000', 'fixed', '0.00', '0.00', '0.00', 2, '2025-07-21 22:07:24', '2025-07-21 22:07:24'),
(17, 'ITM-0017', 'انگشتر مردانه', 1, 1, NULL, 18, '6.200', '0.000', 'fixed', '0.00', '0.00', '0.00', 3, '2025-07-21 22:07:24', '2025-07-21 22:07:24'),
(18, 'ITM-0018', 'سرویس طلا', 1, 1, NULL, 18, '25.400', '0.000', 'fixed', '0.00', '0.00', '0.00', 1, '2025-07-21 22:07:24', '2025-07-21 22:07:24'),
(19, 'ITM-0019', 'گردنبند', 1, 2, NULL, 18, '3.500', '0.000', 'fixed', '0.00', '0.00', '0.00', 5, '2025-07-21 22:07:31', '2025-07-21 22:27:34'),
(20, 'ITM-0020', 'گردنبند طلا', 1, 1, NULL, 18, '8.200', '0.000', 'fixed', '0.00', '0.00', '0.00', 3, '2025-07-21 22:07:31', '2025-07-21 22:07:31'),
(21, 'ITM-0021', 'دستبند طلا', 1, 1, NULL, 18, '12.500', '0.000', 'fixed', '0.00', '0.00', '0.00', 4, '2025-07-21 22:07:31', '2025-07-21 22:07:31'),
(22, 'ITM-0022', 'گوشواره طلا', 1, 1, NULL, 18, '2.800', '0.000', 'fixed', '0.00', '0.00', '0.00', 6, '2025-07-21 22:07:31', '2025-07-21 22:07:31'),
(23, 'ITM-0023', 'انگشتر طلای سفید', 1, 1, NULL, 14, '4.100', '0.000', 'fixed', '0.00', '0.00', '0.00', 3, '2025-07-21 22:07:31', '2025-07-21 22:07:31'),
(24, 'ITM-0024', 'زنجیر طلا', 1, 1, NULL, 18, '15.300', '0.000', 'fixed', '0.00', '0.00', '0.00', 2, '2025-07-21 22:07:31', '2025-07-21 22:07:31'),
(25, 'ITM-0025', 'آویز طلا', 1, 1, NULL, 18, '5.700', '0.000', 'fixed', '0.00', '0.00', '0.00', 4, '2025-07-21 22:07:31', '2025-07-21 22:07:31'),
(26, 'ITM-0026', 'النگو طلا', 1, 1, NULL, 18, '18.900', '0.000', 'fixed', '0.00', '0.00', '0.00', 2, '2025-07-21 22:07:31', '2025-07-21 22:07:31'),
(27, 'ITM-0027', 'انگشتر مردانه', 1, 1, NULL, 18, '6.200', '0.000', 'fixed', '0.00', '0.00', '0.00', 3, '2025-07-21 22:07:31', '2025-07-21 22:07:31'),
(28, 'ITM-0028', 'سرویس طلا', 1, 1, NULL, 18, '25.400', '0.000', 'fixed', '0.00', '0.00', '0.00', 3, '2025-07-21 22:07:31', '2025-07-23 22:44:23');

-- Data for table: invoices
DELETE FROM `invoices`;
ALTER TABLE `invoices` AUTO_INCREMENT = 1;
INSERT INTO `invoices` (`id`, `invoice_number`, `customer_id`, `invoice_date`, `invoice_date_shamsi`, `invoice_type`, `gold_rate`, `subtotal`, `discount_amount`, `tax_amount`, `grand_total`, `total_weight`, `plastic_weight`, `final_weight`, `total_labor_cost`, `total_profit`, `total_tax`, `manual_total_weight`, `notes`, `status`, `created_at`, `updated_at`, `paid_amount`, `remaining_amount`, `payment_status`) VALUES
(7, 'INV-0001', 15, '2025-07-20 20:30:00', '۱۴۰۴/۰۴/۳۱', 'sale', '3500000.00', '24500000.00', '0.00', '0.00', '24500000.00', '7.000', '0.000', '7.000', '0.00', '0.00', '0.00', '3.500', 'این فاکتور برای خرید انگشتر طلای ۱۸ عیار می‌باشد. مشتری محترم لطفاً در زمان تحویل کالا حضور داشته باشید.', 'active', '2025-07-21 22:11:42', '2025-07-21 22:27:04', '0.00', '0.00', 'unpaid'),
(8, 'INV-0008', 15, '2025-07-21 20:30:00', '۱۴۰۴/۰۵/۰۱', 'sale', '3500000.00', '70000000.00', '0.00', '0.00', '70000000.00', '20.000', '0.000', '20.000', '0.00', '0.00', '0.00', '20.000', NULL, 'active', '2025-07-22 22:14:10', '2025-07-22 22:14:10', '0.00', '0.00', 'unpaid');

-- Data for table: invoice_items
DELETE FROM `invoice_items`;
ALTER TABLE `invoice_items` AUTO_INCREMENT = 1;
INSERT INTO `invoice_items` (`id`, `invoice_id`, `item_id`, `quantity`, `weight`, `unit_price`, `total_price`, `labor_percentage`, `labor_cost`, `profit_amount`, `tax_percentage`, `tax_cost`, `description`, `carat`, `manual_weight`, `daily_gold_price`, `tax_amount`, `final_unit_price`) VALUES
(1, 7, 9, 2, '3.500', '12250000.00', '24500000.00', '0.00', '0.00', '0.00', '0.00', '0.00', 'انگشتر طلا', 18, '3.500', '3500000.00', '0.00', '12250000.00'),
(2, 8, 15, 1, '20.000', '70000000.00', '70000000.00', '0.00', '0.00', '0.00', '0.00', '0.00', 'آویز طلا', 18, '20.000', '3500000.00', '0.00', '70000000.00');

-- Data for table: item_types
DELETE FROM `item_types`;
ALTER TABLE `item_types` AUTO_INCREMENT = 1;
INSERT INTO `item_types` (`id`, `name`, `name_persian`) VALUES
(1, 'ring', 'انگشتر'),
(2, 'necklace', 'گردنبند'),
(3, 'bracelet', 'دستبند'),
(4, 'earring', 'گوشواره'),
(5, 'coin', 'سکه'),
(6, 'melted_gold', 'طلای آب‌شده');

-- No data in table: journal_entries

-- No data in table: journal_entry_details

-- No data in table: other_parties

-- No data in table: payments

-- No data in table: suppliers

-- Data for table: system_settings
DELETE FROM `system_settings`;
ALTER TABLE `system_settings` AUTO_INCREMENT = 1;
INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `updated_at`, `updated_by`) VALUES
(1, 'gold_inventory_initial', '50', '2025-07-22 22:01:38', NULL);

-- No data in table: transactions

-- Data for table: users
DELETE FROM `users`;
ALTER TABLE `users` AUTO_INCREMENT = 1;
INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `role`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2a$10$A67/Zv0UmmUA1pqc5PpUxuNsIaor4BdvUyJqledvTLJVO.akMbUny', 'مدیر سیستم', 'admin', '2025-07-20 23:26:17', '2025-07-21 00:01:19');

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
-- Backup completed at: ۱۴۰۴/۵/۲, ۲:۲۷:۲۹
