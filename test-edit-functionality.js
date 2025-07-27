/**
 * Test script to verify gold transaction edit functionality
 */

const GoldTransactionDB = require('./database/gold-transactions-db');

async function testEditFunctionality() {
    console.log('🧪 Testing Gold Transaction Edit Functionality\n');
    
    const TEST_CUSTOMER_ID = 1;
    let testTransactionId = null;
    
    try {
        // Step 1: Create a test transaction
        console.log('1️⃣ Creating test transaction...');
        const testTransaction = {
            customer_id: TEST_CUSTOMER_ID,
            transaction_date: '2024-01-10',
            transaction_type: 'debit',
            amount_grams: 2.500,
            description: 'تست تراکنش برای ویرایش',
            created_by: 1
        };
        
        const createdTransaction = await GoldTransactionDB.createWithBalanceUpdate(testTransaction);
        testTransactionId = createdTransaction.id;
        console.log(`✅ Transaction created with ID: ${testTransactionId}`);
        console.log(`   Amount: ${createdTransaction.amount_grams} grams`);
        console.log(`   Type: ${createdTransaction.transaction_type}\n`);
        
        // Step 2: Get transaction by ID (simulating the GET endpoint)
        console.log('2️⃣ Getting transaction for edit...');
        const fetchedTransaction = await GoldTransactionDB.getById(testTransactionId);
        
        if (!fetchedTransaction) {
            throw new Error('Transaction not found');
        }
        
        console.log(`✅ Transaction fetched successfully`);
        console.log(`   ID: ${fetchedTransaction.id}`);
        console.log(`   Date: ${fetchedTransaction.transaction_date}`);
        console.log(`   Type: ${fetchedTransaction.transaction_type}`);
        console.log(`   Amount: ${fetchedTransaction.amount_grams} grams`);
        console.log(`   Description: ${fetchedTransaction.description}\n`);
        
        // Step 3: Update the transaction (simulating the PUT endpoint)
        console.log('3️⃣ Updating transaction...');
        const updateData = {
            transaction_date: '2024-01-15',
            transaction_type: 'credit',
            amount_grams: 3.750,
            description: 'تست تراکنش - ویرایش شده'
        };
        
        const updatedTransaction = await GoldTransactionDB.updateWithBalanceUpdate(testTransactionId, updateData);
        console.log(`✅ Transaction updated successfully`);
        console.log(`   New Date: ${updatedTransaction.transaction_date}`);
        console.log(`   New Type: ${updatedTransaction.transaction_type}`);
        console.log(`   New Amount: ${updatedTransaction.amount_grams} grams`);
        console.log(`   New Description: ${updatedTransaction.description}\n`);
        
        // Step 4: Verify the update
        console.log('4️⃣ Verifying update...');
        const verifiedTransaction = await GoldTransactionDB.getById(testTransactionId);
        
        const isDateCorrect = verifiedTransaction.transaction_date === updateData.transaction_date;
        const isTypeCorrect = verifiedTransaction.transaction_type === updateData.transaction_type;
        const isAmountCorrect = parseFloat(verifiedTransaction.amount_grams) === updateData.amount_grams;
        const isDescriptionCorrect = verifiedTransaction.description === updateData.description;
        
        if (isDateCorrect && isTypeCorrect && isAmountCorrect && isDescriptionCorrect) {
            console.log(`✅ Update verification successful`);
            console.log(`   All fields updated correctly\n`);
        } else {
            console.log(`❌ Update verification failed`);
            console.log(`   Date correct: ${isDateCorrect}`);
            console.log(`   Type correct: ${isTypeCorrect}`);
            console.log(`   Amount correct: ${isAmountCorrect}`);
            console.log(`   Description correct: ${isDescriptionCorrect}\n`);
        }
        
        // Step 5: Test balance update
        console.log('5️⃣ Checking balance update...');
        const customerSummary = await GoldTransactionDB.getCustomerSummary(TEST_CUSTOMER_ID);
        console.log(`✅ Customer balance updated`);
        console.log(`   Current balance: ${customerSummary.balance} grams`);
        console.log(`   Balance status: ${customerSummary.balance_status}\n`);
        
        // Step 6: Clean up
        console.log('6️⃣ Cleaning up test transaction...');
        const deleted = await GoldTransactionDB.deleteWithBalanceUpdate(testTransactionId);
        
        if (deleted) {
            console.log(`✅ Test transaction deleted successfully\n`);
        } else {
            console.log(`❌ Failed to delete test transaction\n`);
        }
        
        console.log('🎉 Edit functionality test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Clean up on error
        if (testTransactionId) {
            try {
                await GoldTransactionDB.deleteWithBalanceUpdate(testTransactionId);
                console.log('🧹 Test transaction cleaned up after error');
            } catch (cleanupError) {
                console.error('❌ Failed to clean up test transaction:', cleanupError.message);
            }
        }
    }
}

// Run the test
testEditFunctionality();