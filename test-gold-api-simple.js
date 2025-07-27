const GoldTransactionDB = require('./database/gold-transactions-db');

async function testGoldTransactionAPI() {
    console.log('🧪 Testing Gold Transaction Database Functions\n');
    
    try {
        // Test 1: Create a new transaction
        console.log('1️⃣ Testing createWithBalanceUpdate...');
        const testTransaction = {
            customer_id: 1,
            transaction_date: '2025-01-27',
            transaction_type: 'credit',
            amount_grams: 2.5,
            description: 'تست تراکنش طلا - بستانکار',
            created_by: 1
        };
        
        const newTransaction = await GoldTransactionDB.createWithBalanceUpdate(testTransaction);
        console.log('✅ Transaction created successfully');
        console.log('   Transaction ID:', newTransaction.id);
        console.log('   Amount:', newTransaction.amount_grams, 'grams');
        console.log('   Type:', newTransaction.transaction_type);
        
        // Test 2: Get customer transactions
        console.log('\n2️⃣ Testing getByCustomer...');
        const transactions = await GoldTransactionDB.getByCustomer(1, { limit: 5 });
        console.log('✅ Retrieved transactions successfully');
        console.log('   Total transactions:', transactions.length);
        
        // Test 3: Calculate balance
        console.log('\n3️⃣ Testing calculateBalance...');
        const balance = await GoldTransactionDB.calculateBalance(1);
        console.log('✅ Balance calculated successfully');
        console.log('   Customer balance:', balance, 'grams');
        
        // Test 4: Get customer summary
        console.log('\n4️⃣ Testing getCustomerSummary...');
        const summary = await GoldTransactionDB.getCustomerSummary(1);
        console.log('✅ Summary retrieved successfully');
        console.log('   Transaction count:', summary.transaction_count);
        console.log('   Total credit:', summary.total_credit, 'grams');
        console.log('   Total debit:', summary.total_debit, 'grams');
        console.log('   Balance:', summary.balance, 'grams');
        console.log('   Status:', summary.balance_status);
        
        // Test 5: Update transaction
        console.log('\n5️⃣ Testing updateWithBalanceUpdate...');
        const updateData = {
            amount_grams: 3.0,
            description: 'تست تراکنش طلا - بستانکار (ویرایش شده)'
        };
        
        const updatedTransaction = await GoldTransactionDB.updateWithBalanceUpdate(newTransaction.id, updateData);
        console.log('✅ Transaction updated successfully');
        console.log('   New amount:', updatedTransaction.amount_grams, 'grams');
        console.log('   New description:', updatedTransaction.description);
        
        // Test 6: Validation
        console.log('\n6️⃣ Testing validation...');
        
        // Test invalid transaction type
        try {
            await GoldTransactionDB.createWithBalanceUpdate({
                ...testTransaction,
                transaction_type: 'invalid'
            });
            console.log('❌ Invalid transaction type validation: FAILED (should have failed)');
        } catch (error) {
            console.log('✅ Invalid transaction type validation: SUCCESS');
            console.log('   Error:', error.message);
        }
        
        // Test negative amount
        try {
            await GoldTransactionDB.createWithBalanceUpdate({
                ...testTransaction,
                amount_grams: -5
            });
            console.log('❌ Negative amount validation: FAILED (should have failed)');
        } catch (error) {
            console.log('✅ Negative amount validation: SUCCESS');
            console.log('   Error:', error.message);
        }
        
        // Test short description
        try {
            await GoldTransactionDB.createWithBalanceUpdate({
                ...testTransaction,
                description: 'کوتاه'
            });
            console.log('❌ Short description validation: FAILED (should have failed)');
        } catch (error) {
            console.log('✅ Short description validation: SUCCESS');
            console.log('   Error:', error.message);
        }
        
        // Test 7: Delete transaction
        console.log('\n7️⃣ Testing deleteWithBalanceUpdate...');
        const deleteSuccess = await GoldTransactionDB.deleteWithBalanceUpdate(newTransaction.id);
        console.log('✅ Transaction deleted successfully');
        console.log('   Delete result:', deleteSuccess);
        
        // Final balance check
        console.log('\n8️⃣ Final balance check...');
        const finalBalance = await GoldTransactionDB.calculateBalance(1);
        console.log('✅ Final balance calculated');
        console.log('   Customer balance after deletion:', finalBalance, 'grams');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('   Stack:', error.stack);
    }
    
    console.log('\n🏁 Database function tests completed!');
}

// Run test if this file is executed directly
if (require.main === module) {
    testGoldTransactionAPI().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testGoldTransactionAPI };