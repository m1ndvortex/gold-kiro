/**
 * Test script for gold transaction delete functionality
 * Tests the database layer directly
 */

const GoldTransactionDB = require('./database/gold-transactions-db');

async function testDeleteFunctionality() {
    console.log('🧪 Testing Gold Transaction Delete Functionality\n');

    try {
        const testCustomerId = 1;
        const testUserId = 1;

        // Step 1: Create a test transaction
        console.log('1️⃣ Creating test transaction...');
        const testTransaction = {
            customer_id: testCustomerId,
            transaction_date: '2025-01-27',
            transaction_type: 'credit',
            amount_grams: 2.500,
            description: 'Test transaction for delete functionality',
            created_by: testUserId
        };

        const createdTransaction = await GoldTransactionDB.createWithBalanceUpdate(testTransaction);
        
        if (!createdTransaction || !createdTransaction.id) {
            console.log('❌ Failed to create test transaction');
            return;
        }

        console.log('✅ Test transaction created with ID:', createdTransaction.id);
        console.log('   Transaction details:', {
            id: createdTransaction.id,
            type: createdTransaction.transaction_type,
            amount: createdTransaction.amount_grams,
            description: createdTransaction.description
        });
        console.log('');

        // Step 2: Get customer balance before delete
        console.log('2️⃣ Getting customer balance before delete...');
        const balanceBeforeDelete = await GoldTransactionDB.calculateBalance(testCustomerId);
        console.log('✅ Balance before delete:', balanceBeforeDelete, 'grams');
        console.log('');

        // Step 3: Test delete functionality
        console.log('3️⃣ Testing delete functionality...');
        const deleteSuccess = await GoldTransactionDB.deleteWithBalanceUpdate(createdTransaction.id);
        
        if (deleteSuccess) {
            console.log('✅ Transaction deleted successfully');
        } else {
            console.log('❌ Failed to delete transaction');
            return;
        }
        console.log('');

        // Step 4: Verify transaction was deleted
        console.log('4️⃣ Verifying transaction was deleted...');
        try {
            const deletedTransaction = await GoldTransactionDB.getById(createdTransaction.id);
            if (!deletedTransaction) {
                console.log('✅ Transaction successfully removed from database');
            } else {
                console.log('❌ Transaction still exists in database');
            }
        } catch (error) {
            console.log('✅ Transaction not found (successfully deleted)');
        }
        console.log('');

        // Step 5: Verify balance was updated
        console.log('5️⃣ Verifying balance was updated...');
        const balanceAfterDelete = await GoldTransactionDB.calculateBalance(testCustomerId);
        console.log('✅ Balance after delete:', balanceAfterDelete, 'grams');
        
        const expectedBalanceChange = testTransaction.transaction_type === 'credit' ? 
            -testTransaction.amount_grams : testTransaction.amount_grams;
        const actualBalanceChange = balanceAfterDelete - balanceBeforeDelete;
        
        if (Math.abs(actualBalanceChange - expectedBalanceChange) < 0.001) {
            console.log('✅ Balance correctly updated after delete');
            console.log('   Expected change:', expectedBalanceChange, 'grams');
            console.log('   Actual change:', actualBalanceChange, 'grams');
        } else {
            console.log('❌ Balance not correctly updated');
            console.log('   Expected change:', expectedBalanceChange, 'grams');
            console.log('   Actual change:', actualBalanceChange, 'grams');
        }
        console.log('');

        // Step 6: Test delete non-existent transaction
        console.log('6️⃣ Testing delete of non-existent transaction...');
        try {
            await GoldTransactionDB.deleteWithBalanceUpdate(99999);
            console.log('❌ Should have thrown error for non-existent transaction');
        } catch (error) {
            console.log('✅ Correctly threw error for non-existent transaction:', error.message);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('   Stack:', error.stack);
    }

    console.log('\n🏁 Delete functionality test completed!');
}

// Run the test
testDeleteFunctionality();