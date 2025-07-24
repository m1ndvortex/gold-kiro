-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 24, 2025 at 01:20 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gold_shop_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `backup_history`
--

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
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `backup_history`
--

INSERT INTO `backup_history` (`id`, `filename`, `backup_type`, `description`, `file_size`, `status`, `error_message`, `created_at`, `completed_at`, `created_by`) VALUES
(1753355960723, 'final_backup_before_reset_2025-07-24T11-19-20-712Z.sql', 'full', 'بک‌آپ نهایی قبل از پاک‌سازی سیستم برای تحویل', 0, 'success', NULL, '2025-07-24 11:19:20', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `bank_accounts`
--

CREATE TABLE `bank_accounts` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bank_transactions`
--

CREATE TABLE `bank_transactions` (
  `id` int(11) NOT NULL,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `name_persian` varchar(200) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chart_of_accounts`
--

CREATE TABLE `chart_of_accounts` (
  `id` int(11) NOT NULL,
  `account_code` varchar(10) NOT NULL,
  `account_name` varchar(200) NOT NULL,
  `account_name_persian` varchar(200) NOT NULL,
  `account_type` enum('asset','liability','equity','revenue','expense') NOT NULL,
  `parent_account_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_system_account` tinyint(1) DEFAULT 0,
  `balance` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories`
--

CREATE TABLE `expense_categories` (
  `id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `category_name_persian` varchar(100) NOT NULL,
  `parent_category_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `financial_transactions`
--

CREATE TABLE `financial_transactions` (
  `id` int(11) NOT NULL,
  `transaction_id` varchar(50) NOT NULL,
  `transaction_type` enum('sale','payment','expense','stock_adjustment') NOT NULL,
  `description` text NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `related_customer_id` int(11) DEFAULT NULL,
  `related_invoice_id` int(11) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gold_inventory`
--

CREATE TABLE `gold_inventory` (
  `id` int(11) NOT NULL,
  `transaction_date` datetime NOT NULL,
  `transaction_date_shamsi` varchar(20) DEFAULT NULL,
  `transaction_type` enum('initial','sale','purchase','adjustment') NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `weight_change` decimal(10,3) NOT NULL COMMENT 'Positive for additions, negative for reductions',
  `current_weight` decimal(10,3) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gold_rates`
--

CREATE TABLE `gold_rates` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `rate_per_gram` decimal(15,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gold_rates`
--

INSERT INTO `gold_rates` (`id`, `date`, `rate_per_gram`, `created_at`) VALUES
(1, '2025-07-24', 3500000.00, '2025-07-24 11:19:21');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_items`
--

CREATE TABLE `inventory_items` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
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
  `payment_status` enum('unpaid','partial','paid') DEFAULT 'unpaid' COMMENT 'وضعیت پرداخت'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL,
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
  `final_unit_price` decimal(15,2) DEFAULT 0.00 COMMENT 'قیمت نهایی واحد'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_types`
--

CREATE TABLE `item_types` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `name_persian` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `item_types`
--

INSERT INTO `item_types` (`id`, `name`, `name_persian`) VALUES
(1, 'ring', 'انگشتر'),
(2, 'necklace', 'گردنبند'),
(3, 'bracelet', 'دستبند'),
(4, 'earring', 'گوشواره'),
(5, 'coin', 'سکه'),
(6, 'melted_gold', 'طلای آب‌شده');

-- --------------------------------------------------------

--
-- Table structure for table `journal_entries`
--

CREATE TABLE `journal_entries` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `journal_entry_details`
--

CREATE TABLE `journal_entry_details` (
  `id` int(11) NOT NULL,
  `journal_entry_id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `debit_amount` decimal(15,2) DEFAULT 0.00,
  `credit_amount` decimal(15,2) DEFAULT 0.00,
  `customer_id` int(11) DEFAULT NULL,
  `bank_account_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `other_parties`
--

CREATE TABLE `other_parties` (
  `id` int(11) NOT NULL,
  `party_code` varchar(20) NOT NULL,
  `party_name` varchar(255) NOT NULL,
  `party_type` varchar(100) DEFAULT NULL,
  `contact_info` varchar(255) DEFAULT NULL,
  `current_balance` decimal(15,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` enum('cash','card','transfer') NOT NULL,
  `payment_date` date NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `role`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2a$10$A67/Zv0UmmUA1pqc5PpUxuNsIaor4BdvUyJqledvTLJVO.akMbUny', 'مدیر سیستم', 'admin', '2025-07-20 23:26:17', '2025-07-21 00:01:19'),
(2, 'crystalah', '$2a$10$nEjq09rCVS1x9QYh25WXE.F6zk8VGu.PJfoj5ykJhUVDJ7IfnLtrC', 'Crystalah Admin', 'admin', '2025-07-24 11:02:23', '2025-07-24 11:02:23');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `backup_history`
--
ALTER TABLE `backup_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `bank_accounts`
--
ALTER TABLE `bank_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `account_number` (`account_number`),
  ADD KEY `idx_account_number` (`account_number`);

--
-- Indexes for table `bank_transactions`
--
ALTER TABLE `bank_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `related_journal_entry_id` (`related_journal_entry_id`),
  ADD KEY `idx_bank_account` (`bank_account_id`),
  ADD KEY `idx_transaction_date` (`transaction_date`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_parent_id` (`parent_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_sort_order` (`sort_order`);

--
-- Indexes for table `chart_of_accounts`
--
ALTER TABLE `chart_of_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `account_code` (`account_code`),
  ADD KEY `parent_account_id` (`parent_account_id`),
  ADD KEY `idx_account_code` (`account_code`),
  ADD KEY `idx_account_type` (`account_type`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `customer_code` (`customer_code`),
  ADD KEY `idx_customer_code` (`customer_code`),
  ADD KEY `idx_full_name` (`full_name`),
  ADD KEY `idx_phone` (`phone`),
  ADD KEY `idx_customer_type` (`customer_type`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employee_code` (`employee_code`),
  ADD KEY `idx_employee_code` (`employee_code`),
  ADD KEY `idx_full_name` (`full_name`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `expense_number` (`expense_number`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `bank_account_id` (`bank_account_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_expense_number` (`expense_number`),
  ADD KEY `idx_expense_date` (`expense_date`);

--
-- Indexes for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_category_id` (`parent_category_id`),
  ADD KEY `idx_category_name` (`category_name_persian`);

--
-- Indexes for table `financial_transactions`
--
ALTER TABLE `financial_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_id` (`transaction_id`),
  ADD KEY `related_customer_id` (`related_customer_id`),
  ADD KEY `related_invoice_id` (`related_invoice_id`),
  ADD KEY `idx_transaction_type` (`transaction_type`),
  ADD KEY `idx_transaction_date` (`transaction_date`);

--
-- Indexes for table `gold_inventory`
--
ALTER TABLE `gold_inventory`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gold_rates`
--
ALTER TABLE `gold_rates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `date` (`date`);

--
-- Indexes for table `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `item_code` (`item_code`),
  ADD KEY `type_id` (`type_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_item_code` (`item_code`),
  ADD KEY `idx_item_name` (`item_name`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `idx_invoice_number` (`invoice_number`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_invoice_date` (`invoice_date`),
  ADD KEY `idx_invoice_type` (`invoice_type`);

--
-- Indexes for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invoice_id` (`invoice_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `item_types`
--
ALTER TABLE `item_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `entry_number` (`entry_number`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `posted_by` (`posted_by`),
  ADD KEY `idx_entry_number` (`entry_number`),
  ADD KEY `idx_entry_date` (`entry_date`),
  ADD KEY `idx_reference` (`reference_type`,`reference_id`);

--
-- Indexes for table `journal_entry_details`
--
ALTER TABLE `journal_entry_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `bank_account_id` (`bank_account_id`),
  ADD KEY `idx_journal_entry` (`journal_entry_id`),
  ADD KEY `idx_account` (`account_id`);

--
-- Indexes for table `other_parties`
--
ALTER TABLE `other_parties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `party_code` (`party_code`),
  ADD KEY `idx_party_code` (`party_code`),
  ADD KEY `idx_party_name` (`party_name`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invoice_id` (`invoice_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_payment_date` (`payment_date`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `supplier_code` (`supplier_code`),
  ADD KEY `idx_supplier_code` (`supplier_code`),
  ADD KEY `idx_company_name` (`company_name`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_number` (`transaction_number`),
  ADD KEY `idx_transaction_date` (`transaction_date`),
  ADD KEY `idx_transaction_type` (`transaction_type`),
  ADD KEY `idx_party` (`party_type`,`party_id`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `bank_account_id` (`bank_account_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bank_accounts`
--
ALTER TABLE `bank_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bank_transactions`
--
ALTER TABLE `bank_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chart_of_accounts`
--
ALTER TABLE `chart_of_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expense_categories`
--
ALTER TABLE `expense_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `financial_transactions`
--
ALTER TABLE `financial_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gold_inventory`
--
ALTER TABLE `gold_inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gold_rates`
--
ALTER TABLE `gold_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `inventory_items`
--
ALTER TABLE `inventory_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `item_types`
--
ALTER TABLE `item_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `journal_entries`
--
ALTER TABLE `journal_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `journal_entry_details`
--
ALTER TABLE `journal_entry_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `other_parties`
--
ALTER TABLE `other_parties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `backup_history`
--
ALTER TABLE `backup_history`
  ADD CONSTRAINT `backup_history_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `bank_transactions`
--
ALTER TABLE `bank_transactions`
  ADD CONSTRAINT `bank_transactions_ibfk_1` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`),
  ADD CONSTRAINT `bank_transactions_ibfk_2` FOREIGN KEY (`related_journal_entry_id`) REFERENCES `journal_entries` (`id`);

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `chart_of_accounts`
--
ALTER TABLE `chart_of_accounts`
  ADD CONSTRAINT `chart_of_accounts_ibfk_1` FOREIGN KEY (`parent_account_id`) REFERENCES `chart_of_accounts` (`id`);

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`),
  ADD CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`),
  ADD CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `expenses_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD CONSTRAINT `expense_categories_ibfk_1` FOREIGN KEY (`parent_category_id`) REFERENCES `expense_categories` (`id`);

--
-- Constraints for table `financial_transactions`
--
ALTER TABLE `financial_transactions`
  ADD CONSTRAINT `financial_transactions_ibfk_1` FOREIGN KEY (`related_customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `financial_transactions_ibfk_2` FOREIGN KEY (`related_invoice_id`) REFERENCES `invoices` (`id`);

--
-- Constraints for table `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD CONSTRAINT `inventory_items_ibfk_1` FOREIGN KEY (`type_id`) REFERENCES `item_types` (`id`),
  ADD CONSTRAINT `inventory_items_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`);

--
-- Constraints for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`);

--
-- Constraints for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD CONSTRAINT `journal_entries_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `journal_entries_ibfk_2` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `journal_entry_details`
--
ALTER TABLE `journal_entry_details`
  ADD CONSTRAINT `journal_entry_details_ibfk_1` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `journal_entry_details_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`),
  ADD CONSTRAINT `journal_entry_details_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `journal_entry_details_ibfk_4` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
