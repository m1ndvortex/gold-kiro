-- Gold Shop Management System Backup
-- Created: ۱۴۰۴/۴/۱۹, ۲۲:۰۷:۲۹
-- Type: full
-- Description: No description

-- Table: backup_history
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: bank_accounts
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: bank_transactions
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: categories
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
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_parent_category` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: chart_of_accounts
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
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: customer_credit_limits
DROP TABLE IF EXISTS `customer_credit_limits`;
CREATE TABLE `customer_credit_limits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `credit_limit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `current_used_credit` decimal(15,2) DEFAULT 0.00,
  `available_credit` decimal(15,2) GENERATED ALWAYS AS (`credit_limit` - `current_used_credit`) STORED,
  `effective_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_id` (`customer_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `customer_credit_limits_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `customer_credit_limits_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: customer_summary
DROP TABLE IF EXISTS `customer_summary`;
undefined;

-- Table: customers
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(20) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `national_id` varchar(20) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `total_purchases` decimal(15,2) DEFAULT 0.00,
  `total_payments` decimal(15,2) DEFAULT 0.00,
  `current_balance` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `email` varchar(100) DEFAULT NULL COMMENT 'ایمیل مشتری',
  `birth_date` date DEFAULT NULL COMMENT 'تاریخ تولد',
  `gender` enum('male','female','other') DEFAULT NULL COMMENT 'جنسیت',
  `job_title` varchar(100) DEFAULT NULL COMMENT 'شغل',
  `emergency_phone` varchar(20) DEFAULT NULL COMMENT 'تماس اضطراری',
  `reference_name` varchar(100) DEFAULT NULL COMMENT 'نام معرف',
  `notes` text DEFAULT NULL COMMENT 'یادداشت‌ها',
  `customer_type` enum('normal','vip','wholesale','regular') DEFAULT 'normal' COMMENT 'نوع مشتری',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'وضعیت فعال/غیرفعال',
  `last_purchase_date` date DEFAULT NULL COMMENT 'آخرین خرید',
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_code` (`customer_code`),
  UNIQUE KEY `unique_national_id` (`national_id`),
  KEY `idx_customer_code` (`customer_code`),
  KEY `idx_full_name` (`full_name`),
  KEY `idx_phone` (`phone`),
  KEY `idx_customer_type` (`customer_type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_email` (`email`),
  KEY `idx_emergency_phone` (`emergency_phone`),
  KEY `idx_birth_date` (`birth_date`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: employees
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: expense_categories
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: expenses
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: financial_transactions
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: gold_rates
DROP TABLE IF EXISTS `gold_rates`;
CREATE TABLE `gold_rates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `rate_per_gram` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `date` (`date`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: inventory_items
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
  KEY `idx_item_code` (`item_code`),
  KEY `idx_item_name` (`item_name`),
  KEY `fk_category` (`category_id`),
  CONSTRAINT `fk_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `inventory_items_ibfk_1` FOREIGN KEY (`type_id`) REFERENCES `item_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: inventory_items_with_categories
DROP TABLE IF EXISTS `inventory_items_with_categories`;
undefined;

-- Table: invoice_items
DROP TABLE IF EXISTS `invoice_items`;
CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(15,2) NOT NULL,
  `total_price` decimal(15,2) NOT NULL,
  `weight` decimal(8,3) NOT NULL DEFAULT 0.000,
  `carat` int(11) NOT NULL DEFAULT 18,
  `description` text DEFAULT NULL,
  `daily_gold_rate` decimal(15,2) DEFAULT 0.00 COMMENT 'قیمت روز طلا هر گرم',
  `labor_cost` decimal(15,2) DEFAULT 0.00 COMMENT 'اجرت ساخت',
  `profit_amount` decimal(15,2) DEFAULT 0.00 COMMENT 'سود طلافروش',
  `tax_amount` decimal(15,2) DEFAULT 0.00 COMMENT 'مالیات بر ارزش افزوده',
  `manual_weight` decimal(8,3) DEFAULT 0.000,
  `daily_gold_price` decimal(15,2) DEFAULT 0.00,
  `final_unit_price` decimal(15,2) DEFAULT 0.00,
  `labor_percentage` decimal(5,2) DEFAULT 0.00,
  `tax_percentage` decimal(5,2) DEFAULT 0.00,
  `tax_cost` decimal(15,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: invoices
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(20) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `invoice_date` date NOT NULL,
  `invoice_type` enum('sale','purchase') DEFAULT 'sale',
  `gold_rate` decimal(15,2) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `discount_amount` decimal(15,2) DEFAULT 0.00,
  `tax_amount` decimal(15,2) DEFAULT 0.00,
  `grand_total` decimal(15,2) NOT NULL,
  `total_weight` decimal(8,3) DEFAULT 0.000,
  `plastic_weight` decimal(8,3) DEFAULT 0.000,
  `final_weight` decimal(8,3) DEFAULT 0.000,
  `notes` text DEFAULT NULL,
  `status` enum('active','cancelled','returned') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `total_labor_cost` decimal(15,2) DEFAULT 0.00 COMMENT '总工费',
  `total_profit` decimal(15,2) DEFAULT 0.00 COMMENT '总利润',
  `total_tax` decimal(15,2) DEFAULT 0.00 COMMENT '总税费',
  `manual_total_weight` decimal(8,3) DEFAULT 0.000 COMMENT '手动输入的总重量',
  `invoice_date_shamsi` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `idx_invoice_number` (`invoice_number`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_invoice_date` (`invoice_date`),
  KEY `idx_invoice_type` (`invoice_type`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: item_types
DROP TABLE IF EXISTS `item_types`;
CREATE TABLE `item_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `name_persian` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: item_types_backup
DROP TABLE IF EXISTS `item_types_backup`;
CREATE TABLE `item_types_backup` (
  `id` int(11) NOT NULL DEFAULT 0,
  `name` varchar(50) NOT NULL,
  `name_persian` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: journal_entries
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: journal_entry_details
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: other_parties
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: payments
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` enum('cash','card','transfer') NOT NULL,
  `payment_date` date NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_payment_date` (`payment_date`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: stock_adjustments
DROP TABLE IF EXISTS `stock_adjustments`;
CREATE TABLE `stock_adjustments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `adjustment_type` enum('increase','decrease') NOT NULL,
  `quantity_changed` int(11) NOT NULL,
  `reason` varchar(500) NOT NULL,
  `adjusted_by` int(11) NOT NULL,
  `adjustment_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  KEY `adjusted_by` (`adjusted_by`),
  CONSTRAINT `stock_adjustments_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`),
  CONSTRAINT `stock_adjustments_ibfk_2` FOREIGN KEY (`adjusted_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: suppliers
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: system_settings
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: transaction_attachments
DROP TABLE IF EXISTS `transaction_attachments`;
CREATE TABLE `transaction_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `transaction_id` (`transaction_id`),
  CONSTRAINT `transaction_attachments_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: transactions
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
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: users
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table: bank_accounts
INSERT INTO `bank_accounts` (`id`, `account_number`, `bank_name`, `branch_name`, `account_holder`, `account_type`, `current_balance`, `initial_balance`, `is_active`, `notes`, `created_at`, `updated_at`) VALUES
(1, '6037997554185509', 'بانک ملی', NULL, 'آرمان مرتضوی', 'checking', '500000000.00', '500000000.00', 0, NULL, '2025-07-04 14:50:09', '2025-07-04 19:39:19'),
(2, '231312313131', 'asdadasdad', 'asdasda', 'sadasdads', 'checking', '30000666.00', '50000666.00', 1, NULL, '2025-07-04 19:39:01', '2025-07-07 10:56:15'),
(3, '60356478216636', 'meli bank', '01234', 'mohammad moosapoor', 'business', '40000000.00', '90000000.00', 1, NULL, '2025-07-07 11:11:50', '2025-07-07 11:13:01');

-- Data for table: bank_transactions
INSERT INTO `bank_transactions` (`id`, `bank_account_id`, `transaction_type`, `amount`, `balance_after`, `transaction_date`, `description`, `reference_number`, `related_journal_entry_id`, `reconciled`, `reconciled_at`, `created_at`) VALUES
(1, 2, 'withdrawal', '20000000.00', '0.00', '2025-07-06 20:30:00', 'test ', '6037994587451105', 4, 0, NULL, '2025-07-07 10:56:14'),
(2, 3, 'withdrawal', '50000000.00', '0.00', '2025-07-06 20:30:00', 'this is test', '', 5, 0, NULL, '2025-07-07 11:13:01');

-- Data for table: categories
INSERT INTO `categories` (`id`, `name`, `name_persian`, `parent_id`, `description`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'jewelry', 'جواهرات', NULL, 'انواع جواهرات طلا', 1, 1, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(2, 'coins', 'سکه و گرمی', NULL, 'سکه‌ها و طلای گرمی', 1, 2, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(3, 'raw_gold', 'طلای خام', NULL, 'طلای آب‌شده و خام', 1, 3, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(4, 'accessories', 'اکسسوری', NULL, 'انواع اکسسوری طلا', 1, 4, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(5, 'rings', 'انگشتر', 1, 'انواع انگشتر طلا', 1, 1, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(6, 'necklaces', 'گردنبند', 1, 'انواع گردنبند طلا', 1, 2, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(7, 'bracelets', 'دستبند', 1, 'انواع دستبند طلا', 1, 3, '2025-07-02 12:00:46', '2025-07-02 12:00:46'),
(8, 'earrings', 'گوشواره', 1, 'انواع گوشواره طلا', 1, 4, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(9, 'sets', 'نیم‌ست', 1, 'ست‌های طلا', 1, 5, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(10, 'pendants', 'آویز', 1, 'انواع آویز طلا', 1, 6, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(11, 'full_coins', 'سکه تمام', 2, 'سکه‌های تمام طلا', 1, 1, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(12, 'half_coins', 'نیم سکه', 2, 'نیم سکه‌های طلا', 1, 2, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(13, 'quarter_coins', 'ربع سکه', 2, 'ربع سکه‌های طلا', 1, 3, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(14, 'gram_gold', 'طلای گرمی', 2, 'طلای گرمی', 1, 4, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(15, 'melted_gold', 'طلای آب‌شده', 3, 'طلای ذوب شده', 1, 1, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(16, 'scrap_gold', 'ضایعات طلا', 3, 'ضایعات و قراضه طلا', 1, 2, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(17, 'watches', 'ساعت', 4, 'ساعت‌های طلا', 1, 1, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(18, 'chains', 'زنجیر', 4, 'انواع زنجیر طلا', 1, 2, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(19, 'cufflinks', 'دکمه سر آستین', 4, 'دکمه‌های طلا', 1, 3, '2025-07-01 14:01:20', '2025-07-01 14:01:20'),
(20, 'expermental', 'آزمایشی', 4, NULL, 1, 0, '2025-07-01 15:04:07', '2025-07-01 15:04:07');

-- Data for table: chart_of_accounts
INSERT INTO `chart_of_accounts` (`id`, `account_code`, `account_name`, `account_name_persian`, `account_type`, `parent_account_id`, `is_active`, `is_system_account`, `balance`, `created_at`, `updated_at`) VALUES
(1, '1000', 'Assets', 'دارایی‌ها', 'asset', NULL, 1, 1, '-50000000.00', '2025-07-04 14:47:13', '2025-07-07 11:13:01'),
(2, '1100', 'Current Assets', 'دارایی‌های جاری', 'asset', 1, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(3, '1110', 'Cash in Hand', 'موجودی نقد', 'asset', 2, 1, 1, '90000000.00', '2025-07-04 14:47:13', '2025-07-07 11:19:04'),
(4, '1120', 'Bank Accounts', 'حساب‌های بانکی', 'asset', 2, 1, 1, '20000000.00', '2025-07-04 14:47:13', '2025-07-07 11:19:04'),
(5, '1130', 'Accounts Receivable', 'حساب‌های دریافتنی', 'asset', 2, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(6, '1140', 'Inventory - Gold', 'موجودی کالا - طلا', 'asset', 2, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(7, '1150', 'Prepaid Expenses', 'هزینه‌های پیش‌پرداخت', 'asset', 2, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(8, '2000', 'Liabilities', 'بدهی‌ها', 'liability', NULL, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(9, '2100', 'Current Liabilities', 'بدهی‌های جاری', 'liability', 8, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(10, '2110', 'Accounts Payable', 'حساب‌های پرداختنی', 'liability', 9, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(11, '2120', 'Accrued Expenses', 'هزینه‌های تعهدی', 'liability', 9, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(12, '2130', 'Customer Deposits', 'پیش‌دریافت از مشتریان', 'liability', 9, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(13, '3000', 'Equity', 'حقوق صاحبان سهام', 'equity', NULL, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(14, '3100', 'Owner Equity', 'سرمایه مالک', 'equity', 13, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(15, '3200', 'Retained Earnings', 'سود انباشته', 'equity', 13, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(16, '4000', 'Revenue', 'درآمدها', 'revenue', NULL, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(17, '4100', 'Sales Revenue', 'درآمد فروش', 'revenue', 16, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(18, '4110', 'Gold Sales', 'فروش طلا', 'revenue', 17, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(19, '4120', 'Labor Charges', 'اجرت ساخت', 'revenue', 17, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(20, '4900', 'Other Revenue', 'سایر درآمدها', 'revenue', 16, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(21, '5000', 'Expenses', 'هزینه‌ها', 'expense', NULL, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(22, '5100', 'Cost of Goods Sold', 'بهای تمام‌شده کالای فروخته‌شده', 'expense', 21, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(23, '5200', 'Operating Expenses', 'هزینه‌های عملیاتی', 'expense', 21, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:13'),
(24, '5210', 'Rent Expense', 'اجاره', 'expense', 23, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:14'),
(25, '5220', 'Utilities', 'آب و برق و گاز', 'expense', 23, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:14'),
(26, '5230', 'Salaries', 'حقوق و دستمزد', 'expense', 23, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:14'),
(27, '5240', 'Marketing', 'تبلیغات و بازاریابی', 'expense', 23, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:14'),
(28, '5250', 'Office Supplies', 'لوازم اداری', 'expense', 23, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:14'),
(29, '5260', 'Insurance', 'بیمه', 'expense', 23, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:14'),
(30, '5270', 'Repairs & Maintenance', 'تعمیر و نگهداری', 'expense', 23, 1, 1, '0.00', '2025-07-04 14:47:13', '2025-07-04 14:47:14'),
(31, '5900', 'Other Expenses', 'سایر هزینه‌ها', 'expense', 21, 1, 1, '-20000000.00', '2025-07-04 14:47:13', '2025-07-07 10:56:14');

-- Data for table: customer_summary
INSERT INTO `customer_summary` (`id`, `customer_code`, `full_name`, `phone`, `national_id`, `address`, `total_purchases`, `total_payments`, `current_balance`, `created_at`, `updated_at`, `email`, `birth_date`, `gender`, `job_title`, `emergency_phone`, `reference_name`, `notes`, `customer_type`, `is_active`, `last_purchase_date`, `age`, `balance_status`, `days_since_last_purchase`) VALUES
(1, 'CUS-0001', 'احمد رضایی', '09123456789', '0123456789', NULL, '726000032.00', '756000032.00', '-30000000.00', '2025-07-01 19:05:49', '2025-07-08 14:14:28', 'ahmad@example.com', '1980-05-14 19:30:00', 'male', 'مهندس', '09987654321', 'علی احمدی', 'مشتری VIP - خریدار طلای سکه', 'vip', 1, NULL, 45, 'بستانکار', NULL),
(2, 'CUS-0002', 'فاطمه محمدی', '09111111111', '1234567890', NULL, '0.00', '0.00', '50000000.00', '2025-07-01 19:05:49', '2025-07-07 10:45:24', 'fatemeh@example.com', '1990-08-19 20:30:00', 'female', 'دکتر', NULL, NULL, 'مشتری عادی', 'normal', 1, NULL, 34, 'بدهکار', NULL),
(3, 'CUS-0003', 'شرکت طلا و جواهر پارسیان', '02122334455', '9876543210', NULL, '0.00', '0.00', '20000000.00', '2025-07-01 19:05:49', '2025-07-07 10:56:14', 'info@parsian-gold.com', NULL, NULL, NULL, NULL, NULL, 'مشتری عمده‌فروش', 'wholesale', 1, NULL, NULL, 'بدهکار', NULL),
(5, 'CUST-001', 'احمد رضایی', '09123456789', NULL, 'خیابان آزادی، پلاک 123', '634800030.00', '634800030.00', '0.00', '2025-07-03 13:14:37', '2025-07-10 17:38:41', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'normal', 1, NULL, NULL, 'تسویه', NULL),
(6, 'CUST-002', 'فاطمه احمدی', '09987654321', NULL, 'خیابان چهارباغ، پلاک 456', '0.00', '0.00', '50000000.00', '2025-07-03 13:14:37', '2025-07-07 11:13:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'normal', 1, NULL, NULL, 'بدهکار', NULL);

-- Data for table: customers
INSERT INTO `customers` (`id`, `customer_code`, `full_name`, `phone`, `national_id`, `city`, `address`, `total_purchases`, `total_payments`, `current_balance`, `created_at`, `updated_at`, `email`, `birth_date`, `gender`, `job_title`, `emergency_phone`, `reference_name`, `notes`, `customer_type`, `is_active`, `last_purchase_date`) VALUES
(1, 'CUS-0001', 'احمد رضایی', '09123456789', '0123456789', NULL, NULL, '726000032.00', '756000032.00', '-30000000.00', '2025-07-01 19:05:49', '2025-07-08 14:14:28', 'ahmad@example.com', '1980-05-14 19:30:00', 'male', 'مهندس', '09987654321', 'علی احمدی', 'مشتری VIP - خریدار طلای سکه', 'vip', 1, NULL),
(2, 'CUS-0002', 'فاطمه محمدی', '09111111111', '1234567890', NULL, NULL, '0.00', '0.00', '50000000.00', '2025-07-01 19:05:49', '2025-07-07 10:45:24', 'fatemeh@example.com', '1990-08-19 20:30:00', 'female', 'دکتر', NULL, NULL, 'مشتری عادی', 'normal', 1, NULL),
(3, 'CUS-0003', 'شرکت طلا و جواهر پارسیان', '02122334455', '9876543210', NULL, NULL, '0.00', '0.00', '20000000.00', '2025-07-01 19:05:49', '2025-07-07 10:56:14', 'info@parsian-gold.com', NULL, NULL, NULL, NULL, NULL, 'مشتری عمده‌فروش', 'wholesale', 1, NULL),
(5, 'CUST-001', 'احمد رضایی', '09123456789', NULL, 'تهران', 'خیابان آزادی، پلاک 123', '634800030.00', '634800030.00', '0.00', '2025-07-03 13:14:37', '2025-07-10 17:38:41', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'normal', 1, NULL),
(6, 'CUST-002', 'فاطمه احمدی', '09987654321', NULL, 'اصفهان', 'خیابان چهارباغ، پلاک 456', '0.00', '0.00', '50000000.00', '2025-07-03 13:14:37', '2025-07-07 11:13:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'normal', 1, NULL);

-- Data for table: employees
INSERT INTO `employees` (`id`, `employee_code`, `full_name`, `position`, `department`, `phone`, `email`, `hire_date`, `salary`, `current_balance`, `is_active`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'EMP001', 'محمد حسینی', 'مدیر فروش', 'فروش', '09123456792', NULL, NULL, '0.00', '0.00', 1, NULL, '2025-07-07 10:59:58', '2025-07-07 10:59:58'),
(2, 'EMP002', 'زهرا کریمی', 'حسابدار', 'مالی', '09123456793', NULL, NULL, '0.00', '0.00', 1, NULL, '2025-07-07 10:59:58', '2025-07-07 10:59:58'),
(3, 'EMP003', 'رضا احمدی', 'کارشناس فنی', 'تولید', '09123456794', NULL, NULL, '0.00', '0.00', 1, NULL, '2025-07-07 10:59:58', '2025-07-07 10:59:58');

-- Data for table: expense_categories
INSERT INTO `expense_categories` (`id`, `category_name`, `category_name_persian`, `parent_category_id`, `is_active`, `created_at`) VALUES
(1, 'operational', 'هزینه‌های عملیاتی', NULL, 1, '2025-07-04 14:47:13'),
(2, 'administrative', 'هزینه‌های اداری', NULL, 1, '2025-07-04 14:47:13'),
(3, 'marketing', 'تبلیغات و بازاریابی', NULL, 1, '2025-07-04 14:47:13'),
(4, 'utilities', 'آب و برق و گاز', NULL, 1, '2025-07-04 14:47:13'),
(5, 'rent', 'اجاره', NULL, 1, '2025-07-04 14:47:13'),
(6, 'salaries', 'حقوق و دستمزد', NULL, 1, '2025-07-04 14:47:13'),
(7, 'supplies', 'لوازم و ملزومات', NULL, 1, '2025-07-04 14:47:13'),
(8, 'maintenance', 'تعمیر و نگهداری', NULL, 1, '2025-07-04 14:47:13'),
(9, 'insurance', 'بیمه', NULL, 1, '2025-07-04 14:47:13'),
(10, 'taxes', 'مالیات و عوارض', NULL, 1, '2025-07-04 14:47:13'),
(11, 'professional_services', 'خدمات حرفه‌ای', NULL, 1, '2025-07-04 14:47:13'),
(12, 'transportation', 'حمل و نقل', NULL, 1, '2025-07-04 14:47:13'),
(13, 'communication', 'ارتباطات', NULL, 1, '2025-07-04 14:47:13'),
(14, 'entertainment', 'پذیرایی', NULL, 1, '2025-07-04 14:47:13'),
(15, 'other', 'سایر هزینه‌ها', NULL, 1, '2025-07-04 14:47:13');

-- Data for table: financial_transactions
INSERT INTO `financial_transactions` (`id`, `transaction_id`, `transaction_type`, `description`, `amount`, `related_customer_id`, `related_invoice_id`, `transaction_date`, `created_at`) VALUES
(3, 'SALE-INV-0001', 'sale', 'فروش کالا - فاکتور INV-0001', '35683200.00', 1, 2, '2025-07-02 20:30:00', '2025-07-03 08:44:26'),
(4, 'CANCEL-INV-0001-1751549943798', 'sale', 'لغو فاکتور INV-0001', '-35683200.00', 1, 2, '2025-07-02 20:30:00', '2025-07-03 13:39:03'),
(5, 'SALE-INV-0003', 'sale', 'فروش کالا - فاکتور INV-0003', '756000032.00', 1, 3, '0621-03-19 20:34:16', '2025-07-03 14:20:31'),
(6, 'SALE-INV-0004', 'sale', 'فروش کالا - فاکتور INV-0004', '378000014.00', 5, 4, '2025-07-03 20:30:00', '2025-07-04 10:52:38'),
(7, 'PAY-1751655394787', 'payment', 'دریافت پرداخت', '10000000.00', 1, NULL, '2025-07-03 20:30:00', '2025-07-04 18:56:34'),
(8, 'PAY-1751658633172', 'payment', 'دریافت پرداخت', '10000000.00', 1, NULL, '2025-07-03 20:30:00', '2025-07-04 19:50:33'),
(9, 'SALE-INV-0005', 'sale', 'فروش کالا - فاکتور INV-0005', '256800016.00', 5, 5, '2025-07-04 20:30:00', '2025-07-05 09:20:46'),
(10, 'PAY-1751817144350', 'payment', 'دریافت پرداخت', '736000032.00', 1, NULL, '2025-07-05 20:30:00', '2025-07-06 15:52:24'),
(11, 'PURCHASE-PURCH-0006', '', 'خرید کالا - فاکتور PURCH-0006', '-30000000.00', 1, 6, '2025-07-07 20:30:00', '2025-07-08 14:14:28'),
(12, 'PAY-1752169121650', 'payment', 'دریافت پرداخت', '634800030.00', 5, NULL, '2025-07-09 20:30:00', '2025-07-10 17:38:41');

-- Data for table: gold_rates
INSERT INTO `gold_rates` (`id`, `date`, `rate_per_gram`, `created_at`) VALUES
(1, '2025-06-30 20:30:00', '3500000.00', '2025-07-01 12:57:56'),
(2, '2025-07-02 20:30:00', '3500000.00', '2025-07-03 13:14:37');

-- Data for table: inventory_items
INSERT INTO `inventory_items` (`id`, `item_code`, `item_name`, `type_id`, `category_id`, `image_path`, `carat`, `precise_weight`, `stone_weight`, `labor_cost_type`, `labor_cost_value`, `profit_margin`, `purchase_cost`, `current_quantity`, `created_at`, `updated_at`) VALUES
(6, 'ITM-0001', 'جواهرات', 1, 6, NULL, 18, '21.000', '0.000', 'percentage', '18.00', '0.00', '1211111.00', 8, '2025-07-02 12:10:59', '2025-07-05 09:20:46'),
(7, 'ITM-0007', 'جواهرات', 1, 7, '/uploads/1751459046344-sssssss.png', 18, '21.000', '0.000', 'percentage', '12.00', '0.00', '111211.00', 1, '2025-07-02 12:24:06', '2025-07-02 12:24:06'),
(8, 'ITM-0008', 'جواهرات', 1, 5, NULL, 18, '31231.000', '0.000', 'percentage', '131.00', '0.00', '231.00', 1, '2025-07-02 12:25:36', '2025-07-02 12:25:36'),
(10, 'ITM-0009', 'جواهرات', 1, 9, NULL, 18, '0.000', '0.000', 'fixed', '0.00', '0.00', '0.00', 22, '2025-07-02 13:29:17', '2025-07-08 14:14:28'),
(11, 'ITM-0011', 'جواهرات', 1, 10, NULL, 18, '0.000', '0.000', 'fixed', '0.00', '0.00', '0.00', 33, '2025-07-02 13:33:45', '2025-07-03 13:39:03'),
(12, 'ITM-0002', 'جواهرات', 1, 5, NULL, 21, '4.200', '0.100', 'percentage', '10.00', '5.00', '3200000.00', 3, '2025-07-03 13:14:36', '2025-07-03 13:14:36'),
(13, 'ITM-0003', 'جواهرات', 1, 5, NULL, 24, '5.000', '0.000', 'percentage', '10.00', '5.00', '4800000.00', 0, '2025-07-03 13:14:36', '2025-07-04 10:52:38'),
(14, 'ITM-0004', 'جواهرات', 2, 6, NULL, 18, '8.500', '1.000', 'percentage', '10.00', '5.00', '6000000.00', 0, '2025-07-03 13:14:36', '2025-07-03 14:20:31'),
(15, 'ITM-0005', 'جواهرات', 2, 6, NULL, 21, '12.000', '0.500', 'percentage', '10.00', '5.00', '9500000.00', 2, '2025-07-03 13:14:36', '2025-07-03 13:14:36'),
(16, 'ITM-0006', 'جواهرات', 3, 7, NULL, 18, '15.000', '2.000', 'percentage', '10.00', '5.00', '9800000.00', 3, '2025-07-03 13:14:36', '2025-07-03 13:14:36'),
(17, 'ITM-0010', 'سکه و گرمی', 5, 11, NULL, 24, '8.133', '0.000', 'percentage', '5.00', '3.00', '8500000.00', 10, '2025-07-03 13:14:36', '2025-07-03 13:14:36');

-- Data for table: inventory_items_with_categories
INSERT INTO `inventory_items_with_categories` (`id`, `item_code`, `item_name`, `carat`, `current_quantity`, `image_path`, `category_name`, `parent_category_name`, `display_name`, `category_id`, `parent_id`) VALUES
(8, 'ITM-0008', 'جواهرات', 18, 1, NULL, 'انگشتر', 'جواهرات', '[انگشتر] جواهرات - 18 عیار - موجودی: 1', 5, 1),
(12, 'ITM-0002', 'جواهرات', 21, 3, NULL, 'انگشتر', 'جواهرات', '[انگشتر] جواهرات - 21 عیار - موجودی: 3', 5, 1),
(15, 'ITM-0005', 'جواهرات', 21, 2, NULL, 'گردنبند', 'جواهرات', '[گردنبند] جواهرات - 21 عیار - موجودی: 2', 6, 1),
(6, 'ITM-0001', 'جواهرات', 18, 8, NULL, 'گردنبند', 'جواهرات', '[گردنبند] جواهرات - 18 عیار - موجودی: 8', 6, 1),
(16, 'ITM-0006', 'جواهرات', 18, 3, NULL, 'دستبند', 'جواهرات', '[دستبند] جواهرات - 18 عیار - موجودی: 3', 7, 1),
(7, 'ITM-0007', 'جواهرات', 18, 1, '/uploads/1751459046344-sssssss.png', 'دستبند', 'جواهرات', '[دستبند] جواهرات - 18 عیار - موجودی: 1', 7, 1),
(10, 'ITM-0009', 'جواهرات', 18, 22, NULL, 'نیم‌ست', 'جواهرات', '[نیم‌ست] جواهرات - 18 عیار - موجودی: 22', 9, 1),
(11, 'ITM-0011', 'جواهرات', 18, 33, NULL, 'آویز', 'جواهرات', '[آویز] جواهرات - 18 عیار - موجودی: 33', 10, 1),
(17, 'ITM-0010', 'سکه و گرمی', 24, 10, NULL, 'سکه تمام', 'سکه و گرمی', '[سکه تمام] سکه و گرمی - 24 عیار - موجودی: 10', 11, 2);

-- Data for table: invoice_items
INSERT INTO `invoice_items` (`id`, `invoice_id`, `item_id`, `quantity`, `unit_price`, `total_price`, `weight`, `carat`, `description`, `daily_gold_rate`, `labor_cost`, `profit_amount`, `tax_amount`, `manual_weight`, `daily_gold_price`, `final_unit_price`, `labor_percentage`, `tax_percentage`, `tax_cost`) VALUES
(2, 2, 6, 4, '8920800.00', '35683200.00', '21.000', 18, 'جواهرات', '3500000.00', '0.00', '0.00', '0.00', '0.000', '0.00', '0.00', '0.00', '0.00', '0.00'),
(3, 2, 10, 1, '0.00', '0.00', '0.000', 18, 'جواهرات', '3500000.00', '0.00', '0.00', '0.00', '0.000', '0.00', '0.00', '0.00', '0.00', '0.00'),
(4, 2, 11, 1, '0.00', '0.00', '0.000', 18, 'جواهرات', '3500000.00', '0.00', '0.00', '0.00', '0.000', '0.00', '0.00', '0.00', '0.00', '0.00'),
(5, 3, 14, 4, '189000008.00', '756000032.00', '50.000', 18, 'جواهرات', '0.00', '56000000.00', '8.00', '0.00', '50.000', '3500000.00', '189000008.00', '8.00', '0.00', '0.00'),
(6, 4, 13, 2, '189000007.00', '378000014.00', '50.000', 24, 'جواهرات', '0.00', '28000000.00', '7.00', '0.00', '50.000', '3500000.00', '189000007.00', '8.00', '0.00', '0.00'),
(7, 5, 6, 2, '128400008.00', '256800016.00', '2.000', 18, 'جواهرات', '0.00', '16800000.00', '8.00', '0.00', '2.000', '60000000.00', '128400008.00', '7.00', '0.00', '0.00'),
(8, 6, 10, 1, '30000000.00', '30000000.00', '0.500', 18, NULL, '0.00', '0.00', '0.00', '0.00', '0.000', '0.00', '0.00', '0.00', '0.00', '0.00');

-- Data for table: invoices
INSERT INTO `invoices` (`id`, `invoice_number`, `customer_id`, `invoice_date`, `invoice_type`, `gold_rate`, `subtotal`, `discount_amount`, `tax_amount`, `grand_total`, `total_weight`, `plastic_weight`, `final_weight`, `notes`, `status`, `created_at`, `updated_at`, `total_labor_cost`, `total_profit`, `total_tax`, `manual_total_weight`, `invoice_date_shamsi`) VALUES
(2, 'INV-0001', 1, '2025-07-02 20:30:00', 'sale', '360000.00', '35683200.00', '0.00', '0.00', '35683200.00', '84.000', '0.000', '84.000', NULL, 'cancelled', '2025-07-03 08:44:26', '2025-07-03 13:39:03', '0.00', '0.00', '0.00', '0.000', NULL),
(3, 'INV-0003', 1, '0621-03-19 20:34:16', 'sale', '3500000.00', '756000032.00', '0.00', '0.00', '756000032.00', '200.000', '0.000', '200.000', NULL, 'active', '2025-07-03 14:20:31', '2025-07-03 14:20:31', '56000000.00', '32.00', '0.00', '200.000', '۱۴۰۴/۰5/۱۲'),
(4, 'INV-0004', 5, '2025-07-03 20:30:00', 'sale', '3500000.00', '378000014.00', '0.00', '0.00', '378000014.00', '100.000', '0.000', '100.000', NULL, 'active', '2025-07-04 10:52:38', '2025-07-04 10:52:38', '28000000.00', '14.00', '0.00', '100.000', '۱۴۰۴/۰۴/۱۳'),
(5, 'INV-0005', 5, '2025-07-04 20:30:00', 'sale', '60000000.00', '256800016.00', '0.00', '0.00', '256800016.00', '4.000', '0.000', '4.000', NULL, 'active', '2025-07-05 09:20:45', '2025-07-05 09:20:45', '16800000.00', '16.00', '0.00', '4.000', '۱۴۰۴/۰۴/۱۴'),
(6, 'PURCH-0006', 1, '2025-07-07 20:30:00', 'purchase', '60000000.00', '30000000.00', '0.00', '0.00', '30000000.00', '0.500', '0.000', '0.500', NULL, 'active', '2025-07-08 14:14:28', '2025-07-08 14:14:28', '0.00', '0.00', '0.00', '0.500', '۱۴۰۴/۰۴/۱۷');

-- Data for table: item_types
INSERT INTO `item_types` (`id`, `name`, `name_persian`) VALUES
(1, 'ring', 'انگشتر'),
(2, 'necklace', 'گردنبند'),
(3, 'bracelet', 'دستبند'),
(4, 'earring', 'گوشواره'),
(5, 'coin', 'سکه'),
(6, 'melted_gold', 'طلای آب‌شده');

-- Data for table: item_types_backup
INSERT INTO `item_types_backup` (`id`, `name`, `name_persian`) VALUES
(1, 'ring', 'انگشتر'),
(2, 'necklace', 'گردنبند'),
(3, 'bracelet', 'دستبند'),
(4, 'earring', 'گوشواره'),
(5, 'coin', 'سکه'),
(6, 'melted_gold', 'طلای آب‌شده');

-- Data for table: journal_entries
INSERT INTO `journal_entries` (`id`, `entry_number`, `entry_date`, `description`, `reference_type`, `reference_id`, `total_debit`, `total_credit`, `is_balanced`, `status`, `created_by`, `posted_by`, `posted_at`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'JE-1751819149727', '2025-07-05 20:30:00', 'ممم', 'manual', NULL, '5000000.00', '5000000.00', 1, 'posted', 1, 1, '2025-07-06 16:25:49', NULL, '2025-07-06 16:25:49', '2025-07-06 16:25:49'),
(2, 'JE-1751883888212', '2025-07-06 20:30:00', 'س', 'manual', NULL, '40000000.00', '0.00', 0, 'posted', 1, 1, '2025-07-07 10:24:48', NULL, '2025-07-07 10:24:48', '2025-07-07 10:24:48'),
(3, 'JE-TR-1751884979189', '2025-07-06 20:30:00', 'فثسف', '', 1, '50000000.00', '50000000.00', 1, 'posted', 1, 1, '2025-07-07 10:45:24', NULL, '2025-07-07 10:45:24', '2025-07-07 10:45:24'),
(4, 'JE-TR-1751885343173', '2025-07-06 20:30:00', 'test ', '', 2, '20000000.00', '20000000.00', 1, 'posted', 1, 1, '2025-07-07 10:56:14', NULL, '2025-07-07 10:56:14', '2025-07-07 10:56:14'),
(5, 'JE-TR-1751886719450', '2025-07-06 20:30:00', 'this is test', '', 3, '50000000.00', '50000000.00', 1, 'posted', 1, 1, '2025-07-07 11:13:01', NULL, '2025-07-07 11:13:01', '2025-07-07 11:13:01'),
(6, 'JE-TR-1751887042823', '2025-07-06 20:30:00', 'فق', '', 4, '90000000.00', '90000000.00', 1, 'posted', 1, 1, '2025-07-07 11:19:04', NULL, '2025-07-07 11:19:04', '2025-07-07 11:19:04');

-- Data for table: journal_entry_details
INSERT INTO `journal_entry_details` (`id`, `journal_entry_id`, `account_id`, `description`, `debit_amount`, `credit_amount`, `customer_id`, `bank_account_id`, `created_at`) VALUES
(1, 1, 4, 'ممم', '5000000.00', '5000000.00', NULL, 2, '2025-07-06 16:25:49'),
(2, 2, 4, 'س', '40000000.00', '0.00', NULL, 2, '2025-07-07 10:24:48'),
(3, 3, 4, 'فثسف', '50000000.00', '0.00', NULL, NULL, '2025-07-07 10:45:24'),
(4, 3, 4, 'فثسف', '0.00', '50000000.00', NULL, NULL, '2025-07-07 10:45:24'),
(5, 4, 4, 'test ', '20000000.00', '0.00', NULL, NULL, '2025-07-07 10:56:14'),
(6, 4, 31, 'test ', '0.00', '20000000.00', NULL, NULL, '2025-07-07 10:56:14'),
(7, 5, 4, 'this is test', '50000000.00', '0.00', NULL, NULL, '2025-07-07 11:13:01'),
(8, 5, 1, 'this is test', '0.00', '50000000.00', NULL, NULL, '2025-07-07 11:13:01'),
(9, 6, 3, 'فق', '90000000.00', '0.00', NULL, NULL, '2025-07-07 11:19:04'),
(10, 6, 4, 'فق', '0.00', '90000000.00', NULL, NULL, '2025-07-07 11:19:04');

-- Data for table: other_parties
INSERT INTO `other_parties` (`id`, `party_code`, `party_name`, `party_type`, `contact_info`, `current_balance`, `is_active`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'OTH001', 'سازمان مالیات', 'ادارات دولتی', '021-12345678', '0.00', 1, NULL, '2025-07-07 10:59:58', '2025-07-07 10:59:58'),
(2, 'OTH002', 'بیمه اجتماعی', 'ادارات دولتی', '021-87654321', '0.00', 1, NULL, '2025-07-07 10:59:58', '2025-07-07 10:59:58'),
(3, 'OTH003', 'شرکت حمل و نقل سریع', 'خدمات', '09123456795', '0.00', 1, NULL, '2025-07-07 10:59:58', '2025-07-07 10:59:58');

-- Data for table: payments
INSERT INTO `payments` (`id`, `customer_id`, `amount`, `payment_method`, `payment_date`, `description`, `created_at`) VALUES
(1, 1, '10000000.00', 'card', '2025-07-03 20:30:00', '', '2025-07-04 18:56:34'),
(2, 1, '10000000.00', 'card', '2025-07-03 20:30:00', '', '2025-07-04 19:50:33'),
(3, 1, '736000032.00', 'card', '2025-07-05 20:30:00', '', '2025-07-06 15:52:24'),
(4, 5, '634800030.00', 'cash', '2025-07-09 20:30:00', '', '2025-07-10 17:38:41');

-- Data for table: suppliers
INSERT INTO `suppliers` (`id`, `supplier_code`, `company_name`, `contact_person`, `phone`, `email`, `address`, `tax_number`, `current_balance`, `credit_limit`, `payment_terms`, `is_active`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'SUP001', 'شرکت طلا و جواهر آرین', 'احمد محمدی', '09123456789', NULL, NULL, NULL, '0.00', '0.00', 30, 1, NULL, '2025-07-07 10:59:58', '2025-07-07 10:59:58'),
(2, 'SUP002', 'واردات طلای شرق', 'علی رضایی', '09123456790', NULL, NULL, NULL, '0.00', '0.00', 30, 1, NULL, '2025-07-07 10:59:58', '2025-07-07 10:59:58'),
(3, 'SUP003', 'کارخانه جواهرسازی پارس', 'فاطمه احمدی', '09123456791', NULL, NULL, NULL, '0.00', '0.00', 30, 1, NULL, '2025-07-07 10:59:58', '2025-07-07 10:59:58');

-- Data for table: system_settings
INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `updated_at`, `updated_by`) VALUES
(1, 'shop_name', 'طلافروشی موسی پور', '2025-07-10 17:54:58', 1),
(2, 'shop_address', 'حمام گپ ـ ابتدای خیابان حافظ', '2025-07-10 17:54:59', 1),
(3, 'shop_phone', '09106307746', '2025-07-10 17:54:59', 1),
(4, 'auto_backup', 'disabled', '2025-07-10 17:54:59', 1);

-- Data for table: transactions
INSERT INTO `transactions` (`id`, `transaction_number`, `transaction_date`, `transaction_type`, `description`, `party_type`, `party_id`, `amount`, `payment_method`, `reference_number`, `beneficiary_name`, `bank_account_id`, `notes`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'TR-1751884979189', '2025-07-06 20:30:00', 'sale', 'فثسف', 'customer', 2, '50000000.00', 'check', NULL, NULL, NULL, NULL, 'completed', 1, '2025-07-07 10:45:24', '2025-07-07 10:45:24'),
(2, 'TR-1751885343173', '2025-07-06 20:30:00', 'purchase', 'test ', 'customer', 3, '20000000.00', 'card', '6037994587451105', NULL, 2, NULL, 'completed', 1, '2025-07-07 10:56:14', '2025-07-07 10:56:14'),
(3, 'TR-1751886719450', '2025-07-06 20:30:00', 'purchase', 'this is test', 'customer', 6, '50000000.00', 'online', NULL, NULL, 3, NULL, 'completed', 1, '2025-07-07 11:13:01', '2025-07-07 11:13:01'),
(4, 'TR-1751887042823', '2025-07-06 20:30:00', 'sale', 'فق', 'customer', 1, '90000000.00', 'check', '646446466466664644', NULL, NULL, NULL, 'completed', 1, '2025-07-07 11:19:04', '2025-07-07 11:19:04');

-- Data for table: users
INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `role`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2a$10$JBu4.97WYBUf4Q7WdcZyVOSzJDarHWkEWoaNMRVaoxGQeA37xxT4i', 'مدیر سیستم', 'admin', '2025-07-01 12:57:56', '2025-07-01 13:13:32');

