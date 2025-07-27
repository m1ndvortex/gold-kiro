/**
 * Extended tests for Gold Transaction Database Functions
 * Tests additional utility functions and transaction handling
 */

const GoldTransactionDB = require('./database/gold-transactions-db');

// Test data
const testCustomerId = 1;
const testUserId = 1;

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

// Test 1: Create with balance update
async function testCreateWithBalanceUpdate() {
    const transactionData = {
        customer_id: testCustomerId,
        transaction_date: '2025-01-27',
        transaction_type: 'debit',
        amount_grams: 5.250,
        description: 'تست تراکنش با بروزرسانی موجودی - بدهکار',
        created_by: testUserId
    };
    
    const transaction = await GoldTransactionDB.createWithBalanceUpdate(transactionData);
    
    if (!transaction || !transaction.id) {
        throw new Error('Transaction not created properly');
    }
    
    global.testTransactionId = transaction.id;
    console.log(`   📝 Created transaction with ID: ${transaction.id}`);
}

// Test 2: Update with balance update
async function testUpdateWithBalanceUpdate() {
    if (!global.testTransactionId) {
        throw new Error('No test transaction ID available');
    }
    
    const updateData = {
        amount_grams: 7.500,
        description: 'تست بروزرسانی با موجودی'
    };
    
    const updatedTransaction = await GoldTransactionDB.updateWithBalanceUpdate(
        global.testTransactionId, 
        updateData
    );
    
    if (parseFloat(updatedTransaction.amount_grams) !== parseFloat(updateData.amount_grams)) {
        throw new Error('Amount not updated properly');
    }
    
    console.log(`   📝 Updated transaction amount to: ${updatedTransaction.amount_grams} grams`);
}

// Test 3: Get by date range
async function testGetByDateRange() {
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';
    
    const transactions = await GoldTransactionDB.getByDateRange(testCustomerId, startDate, endDate);
    
    if (!Array.isArray(transactions)) {
        throw new Error('Expected array of transactions');
    }
    
    console.log(`   📝 Found ${transactions.length} transactions in date range`);
}

// Test 4: Get balance at date
async function testGetBalanceAtDate() {
    const testDate = '2025-01-27';
    const balance = await GoldTransactionDB.getBalanceAtDate(testCustomerId, testDate);
    
    if (typeof balance !== 'number') {
        throw new Error('Balance should be a number');
    }
    
    console.log(`   📝 Balance at ${testDate}: ${balance} grams`);
}

// Test 5: Get all customers with balances
async function testGetAllCustomersWithBalances() {
    const customers = await GoldTransactionDB.getAllCustomersWithBalances();
    
    if (!Array.isArray(customers)) {
        throw new Error('Expected array of customers');
    }
    
    console.log(`   📝 Found ${customers.length} customers with gold balances`);
}

// Test 6: Validation function
async function testValidation() {
    // Test valid data
    const validData = {
        customer_id: testCustomerId,
        transaction_date: '2025-01-27',
        transaction_type: 'credit',
        amount_grams: 10.5,
        description: 'تست اعتبارسنجی داده‌های صحیح',
        created_by: testUserId
    };
    
    const validResult = GoldTransactionDB.validateTransactionData(validData);
    if (!validResult.isValid) {
        throw new Error('Valid data should pass validation');
    }
    
    // Test invalid data
    const invalidData = {
        customer_id: null,
        transaction_date: '2025-12-31', // Future date
        transaction_type: 'invalid',
        amount_grams: -5,
        description: 'کم', // Too short
        created_by: null
    };
    
    const invalidResult = GoldTransactionDB.validateTransactionData(invalidData);
    if (invalidResult.isValid) {
        throw new Error('Invalid data should fail validation');
    }
    
    if (invalidResult.errors.length < 5) {
        throw new Error('Should have multiple validation errors');
    }
    
    console.log(`   📝 Validation tests passed (${invalidResult.errors.length} errors caught)`);
}

// Test 7: Delete with balance update (cleanup)
async function testDeleteWithBalanceUpdate() {
    if (!global.testTransactionId) {
        throw new Error('No test transaction ID available');
    }
    
    const deleted = await GoldTransactionDB.deleteWithBalanceUpdate(global.testTransactionId);
    
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
async function runExtendedTests() {
    console.log('🚀 Starting Extended Gold Transaction Database Tests...\n');
    console.log('=' .repeat(60));
    
    try {
        // Run all tests
        await runTest('Create with Balance Update', testCreateWithBalanceUpdate);
        await runTest('Update with Balance Update', testUpdateWithBalanceUpdate);
        await runTest('Get by Date Range', testGetByDateRange);
        await runTest('Get Balance at Date', testGetBalanceAtDate);
        await runTest('Get All Customers with Balances', testGetAllCustomersWithBalances);
        await runTest('Validation Function', testValidation);
        await runTest('Delete with Balance Update', testDeleteWithBalanceUpdate);
        
    } catch (error) {
        console.log(`❌ Test setup failed: ${error.message}`);
        process.exit(1);
    }
    
    // Print results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Extended Test Results:');
    console.log(`   Total Tests: ${testResults.total}`);
    console.log(`   Passed: ${testResults.passed} ✅`);
    console.log(`   Failed: ${testResults.failed} ❌`);
    console.log(`   Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
        console.log('\n🎉 All extended tests passed!');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some extended tests failed. Please check the errors above.');
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runExtendedTests();
}

module.exports = {
    runExtendedTests,
    testResults
};