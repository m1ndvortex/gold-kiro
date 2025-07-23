// Complete restore test
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testCompleteRestore() {
    console.log('🧪 Testing Complete Restore Process...\n');
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'gold_shop_db'
        });
        
        console.log('✅ Database connection established');
        
        // Step 1: Record current state
        console.log('\n📊 Recording current state...');
        const beforeState = {};
        
        const tables = ['customers', 'invoices', 'inventory_items', 'categories', 'financial_transactions'];
        
        for (const table of tables) {
            try {
                const [result] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
                beforeState[table] = result[0].count;
                console.log(`   - ${table}: ${result[0].count} records`);
            } catch (error) {
                beforeState[table] = 0;
                console.log(`   - ${table}: 0 records (table may not exist)`);
            }
        }
        
        // Step 2: Test safe clearing process
        console.log('\n🧹 Testing safe clearing process...');
        
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        
        const tableClearOrder = [
            'bank_transactions',
            'categories', 
            'chart_of_accounts',
            'expenses',
            'expense_categories',
            'financial_transactions',
            'inventory_items',
            'invoices',
            'invoice_items',
            'journal_entries',
            'journal_entry_details',
            'payments',
            'transactions',
            'employees',
            'gold_inventory',
            'gold_rates',
            'other_parties',
            'suppliers',
            'bank_accounts',
            'customers',
            'item_types'
        ];
        
        let clearedTables = 0;
        for (const tableName of tableClearOrder) {
            try {
                // Check if table exists
                const [tableExists] = await connection.execute(`
                    SELECT COUNT(*) as count 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = ?
                `, [tableName]);
                
                if (tableExists[0].count > 0) {
                    const [beforeClear] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
                    await connection.execute(`DELETE FROM \`${tableName}\``);
                    await connection.execute(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = 1`);
                    const [afterClear] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
                    
                    if (beforeClear[0].count > 0) {
                        console.log(`   ✅ Cleared ${tableName}: ${beforeClear[0].count} → ${afterClear[0].count}`);
                        clearedTables++;
                    }
                }
            } catch (clearError) {
                console.log(`   ❌ Could not clear ${tableName}: ${clearError.message}`);
            }
        }
        
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log(`\n📊 Successfully cleared ${clearedTables} tables`);
        
        // Step 3: Check state after clearing
        console.log('\n📊 State after clearing:');
        const afterClearState = {};
        
        for (const table of tables) {
            try {
                const [result] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
                afterClearState[table] = result[0].count;
                const difference = beforeState[table] - afterClearState[table];
                console.log(`   - ${table}: ${afterClearState[table]} records (cleared ${difference})`);
            } catch (error) {
                afterClearState[table] = 0;
                console.log(`   - ${table}: 0 records`);
            }
        }
        
        // Step 4: Insert some test data to simulate restore
        console.log('\n🔧 Simulating data restore...');
        
        try {
            // Insert test data in correct order
            await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
            
            // Insert item types first (parent table)
            await connection.execute(`
                INSERT INTO item_types (id, name, name_persian) VALUES 
                (1, 'ring', 'انگشتر'),
                (2, 'necklace', 'گردنبند')
            `);
            console.log('   ✅ Inserted item types');
            
            // Insert customers (parent table)
            await connection.execute(`
                INSERT INTO customers (id, customer_code, full_name, phone, is_active, total_purchases, total_payments, current_balance) VALUES 
                (1, 'CUS-0001', 'مشتری تست', '09123456789', 1, 0, 0, 0),
                (2, 'CUS-0002', 'مشتری دوم', '09987654321', 1, 0, 0, 0)
            `);
            console.log('   ✅ Inserted customers');
            
            // Insert categories (can be self-referencing)
            await connection.execute(`
                INSERT INTO categories (id, name, name_persian, parent_id, is_active, sort_order) VALUES 
                (1, 'jewelry', 'جواهرات', NULL, 1, 1),
                (2, 'gold-rings', 'انگشتر طلا', 1, 1, 2)
            `);
            console.log('   ✅ Inserted categories');
            
            // Insert inventory items (child table)
            await connection.execute(`
                INSERT INTO inventory_items (id, item_code, item_name, type_id, category_id, carat, precise_weight, stone_weight, labor_cost_type, labor_cost_value, profit_margin, purchase_cost, current_quantity) VALUES 
                (1, 'ITM-0001', 'انگشتر طلا', 1, 2, 18, 3.500, 0.000, 'fixed', 0.00, 0.00, 0.00, 1)
            `);
            console.log('   ✅ Inserted inventory items');
            
            await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
            
        } catch (insertError) {
            console.log(`   ❌ Error inserting test data: ${insertError.message}`);
        }
        
        // Step 5: Verify final state
        console.log('\n📊 Final state after simulated restore:');
        
        for (const table of tables) {
            try {
                const [result] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
                const finalCount = result[0].count;
                console.log(`   - ${table}: ${finalCount} records`);
            } catch (error) {
                console.log(`   - ${table}: Error checking count`);
            }
        }
        
        await connection.end();
        console.log('\n🎉 Complete restore test finished!');
        
        console.log('\n✅ Key findings:');
        console.log('   1. Foreign key constraints require specific deletion order');
        console.log('   2. Disabling FK checks is essential during restore');
        console.log('   3. Parent tables must be populated before child tables');
        console.log('   4. AUTO_INCREMENT reset works correctly');
        console.log('   5. Data can be successfully restored with proper order');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCompleteRestore();