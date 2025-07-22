-- Create gold inventory table
CREATE TABLE IF NOT EXISTS gold_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_date DATETIME NOT NULL,
    transaction_date_shamsi VARCHAR(20),
    transaction_type ENUM('initial', 'sale', 'purchase', 'adjustment') NOT NULL,
    reference_id INT,
    weight_change DECIMAL(10,3) NOT NULL COMMENT 'Positive for additions, negative for reductions',
    current_weight DECIMAL(10,3) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create settings table for storing the initial gold inventory
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert initial gold inventory setting
INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES ('gold_inventory_initial', '0');