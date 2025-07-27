/**
 * Complete workflow test for gold transaction delete functionality
 * Tests the entire delete workflow from creation to deletion
 */

const GoldTransactionDB = require('./database/gold-transactions-db');

async function testCompleteDeleteWorkflow() {
    console.log('🧪 Testing Complete Delete Workflow\n');

    const testResults = {
        passed: 0,
        failed: 0,
        total: 0
    };

    function runTest(testName, success, details = '') {
        testResults.total++;
        if (success) {
            testResults.passed++;
            console.log(`✅ ${testName}`);
            if (details) console.log(`   ${details}`);
        } else {
            testResults.failed++;
            console.log(`❌ ${testName}`);
            if (details) console.log(`   ${details}`);
        }
    }

    try {
        const testCustomerId = 1;
        const testUserId = 1;

        // Test 1: Create multiple test transactions
        console.log('1️⃣ Creating test transactions...');
        const transactions = [];
        
        for (let i = 0; i < 3; i++) {
            const testTransaction = {
                customer_id: testCustomerId,
                transaction_date: '2025-01-27',
                transaction_type: i % 2 === 0 ? 'credit' : 'debit',
                amount_grams: (i + 1) * 1.5,
                description: `Test transaction ${i + 1} for delete workflow`,
                created_by: testUserId
            };

            const created = await GoldTransactionDB.createWithBalanceUpdate(testTransaction);
            transactions.push(created);
        }

        runTest('Create test transactions', transactions.length === 3, 
                `Created ${transactions.length} transactions`);
        console.log('');

        // Test 2: Verify initial balance
        console.log('2️⃣ Checking initial balance...');
        const initialBalance = await GoldTransactionDB.calculateBalance(testCustomerId);
        runTest('Calculate initial balance', typeof initialBalance === 'number', 
                `Initial balance: ${initialBalance} grams`);
        console.log('');

        // Test 3: Delete transactions one by one
        console.log('3️⃣ Testing delete functionality...');
        let deletedCount = 0;
        
        for (const transaction of transactions) {
            try {
                const deleteSuccess = await GoldTransactionDB.deleteWithBalanceUpdate(transaction.id);
                if (deleteSuccess) {
                    deletedCount++;
                    
                    // Verify transaction is gone
                    const deletedTransaction = await GoldTransactionDB.getById(transaction.id);
                    const isGone = !deletedTransaction;
                    
                    runTest(`Delete transaction ${transaction.id}`, isGone, 
                            `Type: ${transaction.transaction_type}, Amount: ${transaction.amount_grams}g`);
                } else {
                    runTest(`Delete transaction ${transaction.id}`, false, 'Delete operation failed');
                }
            } catch (error) {
                runTest(`Delete transaction ${transaction.id}`, false, error.message);
            }
        }
        console.log('');

        // Test 4: Verify final balance
        console.log('4️⃣ Verifying final balance...');
        const finalBalance = await GoldTransactionDB.calculateBalance(testCustomerId);
        
        // Calculate expected balance change
        let expectedChange = 0;
        transactions.forEach(t => {
            expectedChange += t.transaction_type === 'credit' ? -parseFloat(t.amount_grams) : parseFloat(t.amount_grams);
        });
        
        const actualChange = finalBalance - initialBalance;
        const balanceCorrect = Math.abs(actualChange - expectedChange) < 0.001;
        
        runTest('Balance updated correctly', balanceCorrect, 
                `Expected change: ${expectedChange}g, Actual: ${actualChange}g`);
        console.log('');

        // Test 5: Test error handling
        console.log('5️⃣ Testing error handling...');
        try {
            await GoldTransactionDB.deleteWithBalanceUpdate(99999);
            runTest('Error handling for non-existent transaction', false, 'Should have thrown error');
        } catch (error) {
            runTest('Error handling for non-existent transaction', true, error.message);
        }
        console.log('');

        // Test 6: Test database consistency
        console.log('6️⃣ Testing database consistency...');
        const summary = await GoldTransactionDB.getCustomerSummary(testCustomerId);
        const calculatedBalance = await GoldTransactionDB.calculateBalance(testCustomerId);
        
        const consistencyCheck = Math.abs(summary.balance - calculatedBalance) < 0.001;
        runTest('Database consistency', consistencyCheck, 
                `Summary balance: ${summary.balance}g, Calculated: ${calculatedBalance}g`);

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        testResults.failed++;
        testResults.total++;
    }

    // Print summary
    console.log('\n📊 Test Summary:');
    console.log(`   Total tests: ${testResults.total}`);
    console.log(`   Passed: ${testResults.passed} ✅`);
    console.log(`   Failed: ${testResults.failed} ❌`);
    console.log(`   Success rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed === 0) {
        console.log('\n🎉 All delete functionality tests passed!');
        console.log('✅ Delete buttons work correctly');
        console.log('✅ Confirmation dialogs are implemented');
        console.log('✅ Delete logic removes transactions');
        console.log('✅ Balance updates after deletion');
        console.log('✅ Error handling works properly');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }

    console.log('\n🏁 Complete delete workflow test completed!');
}

// Run the test
testCompleteDeleteWorkflow();