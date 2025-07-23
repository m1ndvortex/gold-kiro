
-- Safe Restore Script for Gold Shop Database
-- Generated: ۱۴۰۴/۵/۲, ۲:۲۰:۰۴

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- Clear existing data in safe order
DELETE FROM `bank_transactions`;
DELETE FROM `categories`;
DELETE FROM `chart_of_accounts`;
DELETE FROM `expenses`;
DELETE FROM `expense_categories`;
DELETE FROM `financial_transactions`;
DELETE FROM `inventory_items`;
DELETE FROM `invoices`;
DELETE FROM `invoice_items`;
DELETE FROM `journal_entries`;
DELETE FROM `journal_entry_details`;
DELETE FROM `payments`;
DELETE FROM `transactions`;
DELETE FROM `employees`;
DELETE FROM `gold_inventory`;
DELETE FROM `gold_rates`;
DELETE FROM `other_parties`;
DELETE FROM `suppliers`;
DELETE FROM `bank_accounts`;
DELETE FROM `customers`;
DELETE FROM `item_types`;

-- Reset auto increment
ALTER TABLE `bank_transactions` AUTO_INCREMENT = 1;
ALTER TABLE `categories` AUTO_INCREMENT = 1;
ALTER TABLE `chart_of_accounts` AUTO_INCREMENT = 1;
ALTER TABLE `expenses` AUTO_INCREMENT = 1;
ALTER TABLE `expense_categories` AUTO_INCREMENT = 1;
ALTER TABLE `financial_transactions` AUTO_INCREMENT = 1;
ALTER TABLE `inventory_items` AUTO_INCREMENT = 1;
ALTER TABLE `invoices` AUTO_INCREMENT = 1;
ALTER TABLE `invoice_items` AUTO_INCREMENT = 1;
ALTER TABLE `journal_entries` AUTO_INCREMENT = 1;
ALTER TABLE `journal_entry_details` AUTO_INCREMENT = 1;
ALTER TABLE `payments` AUTO_INCREMENT = 1;
ALTER TABLE `transactions` AUTO_INCREMENT = 1;
ALTER TABLE `employees` AUTO_INCREMENT = 1;
ALTER TABLE `gold_inventory` AUTO_INCREMENT = 1;
ALTER TABLE `gold_rates` AUTO_INCREMENT = 1;
ALTER TABLE `other_parties` AUTO_INCREMENT = 1;
ALTER TABLE `suppliers` AUTO_INCREMENT = 1;
ALTER TABLE `bank_accounts` AUTO_INCREMENT = 1;
ALTER TABLE `customers` AUTO_INCREMENT = 1;
ALTER TABLE `item_types` AUTO_INCREMENT = 1;

-- Your backup data will be inserted here

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
