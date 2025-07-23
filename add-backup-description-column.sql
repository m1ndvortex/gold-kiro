-- Add description column to backup_history table
-- This migration adds the missing description column for backup descriptions

USE gold_shop_db;

-- Add description column if it doesn't exist
ALTER TABLE backup_history 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL 
AFTER backup_type;

-- Update existing records to have empty description
UPDATE backup_history 
SET description = '' 
WHERE description IS NULL;

-- Show the updated table structure
DESCRIBE backup_history;