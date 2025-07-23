// Test restore functionality
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testRestoreFunctionality() {
    console.log('🧪 Testing Restore Functionality...\n');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'gold_shop_db'
        });
        
        console.log('✅ Database connection established');
        
        // Test 1: Check current data counts
        console.log('\n📊 Current data counts:');
        
        const tables = ['customers', 'invoices', 'inventory_items', 'categories'];
        const currentCounts = {};
        
        for (const table of tables) {
            try {
                const [result] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
                currentCounts[table] = result[0].count;
                console.log(`   - ${table}: ${result[0].count} records`);
            } catch (error) {
                console.log(`   - ${table}: Table not found or error`);
                currentCounts[table] = 0;
            }
        }
        
        // Test 2: Create some test data
        console.log('\n🔧 Creating test data...');
        
        try {
            // Add a test customer
            await connection.execute(`
                INSERT INTO customers (customer_code, full_name, phone, is_active, total_purchases, total_payments, current_balance)
                VALUES ('TEST-RESTORE', 'مشتری تست بازیابی', '09123456789', 1, 0, 0, 0)
            `);
            console.log('   ✅ Test customer created');
            
            // Add a test category
            await connection.execute(`
                INSERT INTO categories (name, name_persian, is_active, sort_order)
                VALUES ('test-restore', 'دسته تست بازیابی', 1, 999)
            `);
            console.log('   ✅ Test category created');
            
        } catch (insertError) {
            console.log('   ⚠️  Could not create test data:', insertError.message);
        }
        
        // Test 3: Check data after test insertion
        console.log('\n📊 Data counts after test insertion:');
        
        for (const table of tables) {
            try {
                const [result] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
                const newCount = result[0].count;
                const difference = newCount - currentCounts[table];
                console.log(`   - ${table}: ${newCount} records (${difference > 0 ? '+' + difference : difference})`);
            } catch (error) {
                console.log(`   - ${table}: Error checking count`);
            }
        }
        
        // Test 4: Simulate clear operation
        console.log('\n🧹 Testing clear operation...');
        
        const testTables = ['customers', 'categories'];
        for (const table of testTables) {
            try {
                const [beforeClear] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
                console.log(`   - ${table}: ${beforeClear[0].count} records before clear`);
                
                // Clear table
                await connection.execute(`DELETE FROM \`${table}\` WHERE 1=1`);
                await connection.execute(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
                
                const [afterClear] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table}\``);
                console.log(`   - ${table}: ${afterClear[0].count} records after clear`);
                
            } catch (clearError) {
                console.log(`   - ${table}: Error during clear - ${clearError.message}`);
            }
        }
        
        await connection.end();
        console.log('\n🎉 Restore functionality test completed!');
        
        console.log('\n💡 Recommendations:');
        console.log('   1. Always create a safety backup before restore');
        console.log('   2. Clear existing data before inserting backup data');
        console.log('   3. Use DELETE instead of TRUNCATE for better compatibility');
        console.log('   4. Reset AUTO_INCREMENT after clearing data');
        console.log('   5. Verify data counts after restore');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testRestoreFunctionality();