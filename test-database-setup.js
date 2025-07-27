const db = require('./config/database');

async function testDatabaseSetup() {
    console.log('🔍 Testing Database Setup for Gold Transactions\n');
    
    try {
        // Test database connection
        console.log('1️⃣ Testing database connection...');
        const [rows] = await db.execute('SELECT 1 as test');
        console.log('✅ Database connection: SUCCESS\n');
        
        // Check if customer_gold_transactions table exists
        console.log('2️⃣ Checking customer_gold_transactions table...');
        try {
            const [tableInfo] = await db.execute(`
                DESCRIBE customer_gold_transactions
            `);
            console.log('✅ customer_gold_transactions table exists');
            console.log('   Columns:', tableInfo.map(col => `${col.Field} (${col.Type})`).join(', '));
        } catch (error) {
            console.log('❌ customer_gold_transactions table does not exist');
            console.log('   Error:', error.message);
            console.log('   💡 Run: mysql -u root -p gold_shop_db < database/customer_gold_transactions.sql');
        }
        console.log('');
        
        // Check if customers table has gold_balance_grams column
        console.log('3️⃣ Checking customers table for gold_balance_grams column...');
        try {
            const [customerColumns] = await db.execute(`
                DESCRIBE customers
            `);
            const hasGoldBalance = customerColumns.some(col => col.Field === 'gold_balance_grams');
            
            if (hasGoldBalance) {
                console.log('✅ customers.gold_balance_grams column exists');
            } else {
                console.log('❌ customers.gold_balance_grams column does not exist');
                console.log('   💡 Run: mysql -u root -p gold_shop_db < database/add_gold_balance_to_customers.sql');
            }
        } catch (error) {
            console.log('❌ Error checking customers table:', error.message);
        }
        console.log('');
        
        // Check if users table exists (for foreign key)
        console.log('4️⃣ Checking users table...');
        try {
            const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
            console.log('✅ users table exists');
            console.log('   User count:', userCount[0].count);
        } catch (error) {
            console.log('❌ users table issue:', error.message);
        }
        console.log('');
        
        // Check if customers table exists (for foreign key)
        console.log('5️⃣ Checking customers table...');
        try {
            const [customerCount] = await db.execute('SELECT COUNT(*) as count FROM customers');
            console.log('✅ customers table exists');
            console.log('   Customer count:', customerCount[0].count);
        } catch (error) {
            console.log('❌ customers table issue:', error.message);
        }
        console.log('');
        
        // Test GoldTransactionDB class
        console.log('6️⃣ Testing GoldTransactionDB class...');
        try {
            const GoldTransactionDB = require('./database/gold-transactions-db');
            
            // Test with customer ID 1 if it exists
            const [firstCustomer] = await db.execute('SELECT id FROM customers LIMIT 1');
            if (firstCustomer.length > 0) {
                const customerId = firstCustomer[0].id;
                const balance = await GoldTransactionDB.calculateBalance(customerId);
                console.log('✅ GoldTransactionDB.calculateBalance works');
                console.log(`   Customer ${customerId} balance: ${balance} grams`);
                
                const transactions = await GoldTransactionDB.getByCustomer(customerId, { limit: 5 });
                console.log('✅ GoldTransactionDB.getByCustomer works');
                console.log(`   Customer ${customerId} has ${transactions.length} transactions`);
            } else {
                console.log('⚠️  No customers found to test with');
            }
        } catch (error) {
            console.log('❌ GoldTransactionDB class error:', error.message);
        }
        
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        console.log('   💡 Make sure MySQL is running and database exists');
    }
    
    console.log('\n🏁 Database setup test completed!');
}

// Run test if this file is executed directly
if (require.main === module) {
    testDatabaseSetup().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testDatabaseSetup };