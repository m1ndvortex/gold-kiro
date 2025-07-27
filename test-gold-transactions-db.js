/**
 * Unit tests for Gold Transaction Database Functions
 * Tests CRUD operations, balance calculations, and error handling
 */

const GoldTransactionDB = require('./database/gold-transactions-db');
const db = require('./config/database');

// Test data
const testCustomerId = 1; // Assuming customer with ID 1 exists
const testUserId = 1; // Assuming user with ID 1 exists

// Test transaction data
const testTransactionData = {
    customer_id: testCustomerId,
    transaction_date: '2025-01-27',
    transaction_type: 'credit',
    amount_grams: 10.500,
    description: 'تست تراکنش طلا - بستانکار',
    created_by: testUserId
};

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

// Helper function to run a test
async function runTest(testName, testFunction) {
    testResults.total++;
    console.log(`\n🧪 Testing: ${testName}`);
    
    try {
        await testFunction();
        testResults.passed++;
        console.log(`   ✅ PASSED: ${testName}`);
    } catch (error) {
        testResults.failed++;
        console.log(`   ❌ FAILED: ${testName}`);
        console.log(`   Error: ${error.message}`);
    }
}

// Test 1: Create transaction
async function testCreateTransaction() {
    const transaction = await GoldTransactionDB.create(testTransactionData);
    
    if (!transaction || !transaction.id) {
        throw new Error('Transaction not created properly');
    }
    
    if (transaction.customer_id !== testTransactionData.customer_id) {
        throw new Error('Customer ID mismatch');
    }
    
    if (parseFloat(transaction.amount_grams) !== parseFloat(testTransactionData.amount_grams)) {
        throw new Error(`Amount mismatch: expected ${testTransactionData.amount_grams}, got ${transaction.amount_grams}`);
    }
    
    // Store transaction ID for other tests
    global.testTransactionId = transaction.id;
    console.log(`   📝 Created transaction with ID: ${transaction.id}`);
}

// Test 2: Get transaction by ID
async function testGetById() {
    if (!global.testTransactionId) {
        throw new Error('No test transaction ID available');
    }
    
    const transaction = await GoldTransactionDB.getById(global.testTransactionId);
    
    if (!transaction) {
        throw new Error('Transaction not found');
    }
    
    if (transaction.id !== global.testTransactionId) {
        throw new Error('Transaction ID mismatch');
    }
    
    console.log(`   📝 Retrieved transaction: ${transaction.description}`);
}

// Test 3: Get transactions by customer
async function testGetByCustomer() {
    const transactions = await GoldTransactionDB.getByCustomer(testCustomerId);
    
    if (!Array.isArray(transactions)) {
        throw new Error('Expected array of transactions');
    }
    
    console.log(`   📝 Found ${transactions.length} transactions for customer ${testCustomerId}`);
}

// Test 4: Update transaction
async function testUpdateTransaction() {
    if (!global.testTransactionId) {
        throw new Error('No test transaction ID available');
    }
    
    const updateData = {
        amount_grams: 15.750,
        description: 'تست تراکنش طلا - بروزرسانی شده'
    };
    
    const updatedTransaction = await GoldTransactionDB.update(global.testTransactionId, updateData);
    
    if (parseFloat(updatedTransaction.amount_grams) !== parseFloat(updateData.amount_grams)) {
        throw new Error(`Amount not updated properly: expected ${updateData.amount_grams}, got ${updatedTransaction.amount_grams}`);
    }
    
    if (updatedTransaction.description !== updateData.description) {
        throw new Error('Description not updated properly');
    }
    
    console.log(`   📝 Updated transaction amount to: ${updatedTransaction.amount_grams} grams`);
}

// Test 5: Calculate balance
async function testCalculateBalance() {
    const balance = await GoldTransactionDB.calculateBalance(testCustomerId);
    
    if (typeof balance !== 'number') {
        throw new Error('Balance should be a number');
    }
    
    console.log(`   📝 Customer ${testCustomerId} balance: ${balance} grams`);
}

// Test 6: Update customer balance
async function testUpdateCustomerBalance() {
    const balance = await GoldTransactionDB.updateCustomerBalance(testCustomerId);
    
    if (typeof balance !== 'number') {
        throw new Error('Balance should be a number');
    }
    
    // Verify the balance was updated in customers table
    const [rows] = await db.execute(
        'SELECT gold_balance_grams FROM customers WHERE id = ?',
        [testCustomerId]
    );
    
    if (rows.length === 0) {
        throw new Error('Customer not found');
    }
    
    if (parseFloat(rows[0].gold_balance_grams) !== balance) {
        throw new Error('Balance not updated in customers table');
    }
    
    console.log(`   📝 Updated customer balance to: ${balance} grams`);
}

// Test 7: Get customer summary
async function testGetCustomerSummary() {
    const summary = await GoldTransactionDB.getCustomerSummary(testCustomerId);
    
    if (!summary || typeof summary !== 'object') {
        throw new Error('Summary should be an object');
    }
    
    const requiredFields = ['transaction_count', 'total_credit', 'total_debit', 'balance', 'balance_status'];
    for (const field of requiredFields) {
        if (!(field in summary)) {
            throw new Error(`Missing field in summary: ${field}`);
        }
    }
    
    console.log(`   📝 Summary - Transactions: ${summary.transaction_count}, Balance: ${summary.balance} grams (${summary.balance_status})`);
}

// Test 8: Validation tests
async function testValidation() {
    // Test invalid transaction type
    try {
        await GoldTransactionDB.create({
            ...testTransactionData,
            transaction_type: 'invalid'
        });
        throw new Error('Should have failed with invalid transaction type');
    } catch (error) {
        if (!error.message.includes('debit یا credit')) {
            throw new Error('Wrong validation error message');
        }
    }
    
    // Test negative amount
    try {
        await GoldTransactionDB.create({
            ...testTransactionData,
            amount_grams: -5
        });
        throw new Error('Should have failed with negative amount');
    } catch (error) {
        if (!error.message.includes('عدد مثبت')) {
            throw new Error('Wrong validation error message');
        }
    }
    
    console.log('   📝 Validation tests passed');
}

// Test 9: Delete transaction (cleanup)
async function testDeleteTransaction() {
    if (!global.testTransactionId) {
        throw new Error('No test transaction ID available');
    }
    
    const deleted = await GoldTransactionDB.delete(global.testTransactionId);
    
    if (!deleted) {
        throw new Error('Transaction not deleted');
    }
    
    // Verify transaction is deleted
    const transaction = await GoldTransactionDB.getById(global.testTransactionId);
    if (transaction) {
        throw new Error('Transaction still exists after deletion');
    }
    
    console.log(`   📝 Deleted transaction with ID: ${global.testTransactionId}`);
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Gold Transaction Database Tests...\n');
    console.log('=' .repeat(60));
    
    try {
        // Check database connection
        await db.execute('SELECT 1');
        console.log('✅ Database connection successful');
        
        // Run all tests
        await runTest('Create Transaction', testCreateTransaction);
        await runTest('Get Transaction by ID', testGetById);
        await runTest('Get Transactions by Customer', testGetByCustomer);
        await runTest('Update Transaction', testUpdateTransaction);
        await runTest('Calculate Balance', testCalculateBalance);
        await runTest('Update Customer Balance', testUpdateCustomerBalance);
        await runTest('Get Customer Summary', testGetCustomerSummary);
        await runTest('Validation Tests', testValidation);
        await runTest('Delete Transaction', testDeleteTransaction);
        
    } catch (error) {
        console.log(`❌ Database connection failed: ${error.message}`);
        process.exit(1);
    }
    
    // Print results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Test Results:');
    console.log(`   Total Tests: ${testResults.total}`);
    console.log(`   Passed: ${testResults.passed} ✅`);
    console.log(`   Failed: ${testResults.failed} ❌`);
    console.log(`   Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed. Please check the errors above.');
        process.exit(1);
    }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.log(`\n❌ Uncaught Exception: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.log(`\n❌ Unhandled Rejection: ${error.message}`);
    process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    runAllTests,
    testResults
};