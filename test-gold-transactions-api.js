const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CUSTOMER_ID = 1; // Assuming customer with ID 1 exists

// Login credentials
const LOGIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Test data
const testTransaction = {
    transaction_date: '2025-01-27',
    transaction_type: 'credit',
    amount_grams: 5.5,
    description: 'تست تراکنش طلا - بستانکار'
};

const updatedTransaction = {
    transaction_date: '2025-01-26',
    transaction_type: 'debit',
    amount_grams: 3.2,
    description: 'تست تراکنش طلا - بدهکار (ویرایش شده)'
};

// Create axios instance with cookie jar for session management
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Helper function to login and get session
async function login() {
    try {
        const response = await axiosInstance.post('/login', LOGIN_CREDENTIALS, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: new URLSearchParams(LOGIN_CREDENTIALS).toString()
        });
        
        return { success: true, cookies: response.headers['set-cookie'] };
    } catch (error) {
        return { 
            success: false, 
            error: error.response ? error.response.data : error.message 
        };
    }
}

// Helper function to make authenticated requests
async function makeRequest(method, url, data = null, cookies = null) {
    try {
        const config = {
            method,
            url: url,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (cookies) {
            config.headers['Cookie'] = cookies.join('; ');
        }
        
        if (data) {
            config.data = data;
        }
        
        const response = await axiosInstance(config);
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response ? error.response.data : error.message 
        };
    }
}

async function runTests() {
    console.log('🧪 Testing Gold Transactions API Endpoints\n');
    
    // First, login to get session
    console.log('🔐 Logging in...');
    const loginResult = await login();
    
    if (!loginResult.success) {
        console.log('❌ Login failed:', loginResult.error);
        return;
    }
    
    console.log('✅ Login successful\n');
    const cookies = loginResult.cookies;
    
    let createdTransactionId = null;
    
    // Test 1: Create new gold transaction
    console.log('1️⃣ Testing POST /customers/:id/gold-transactions');
    const createResult = await makeRequest('POST', `/customers/${TEST_CUSTOMER_ID}/gold-transactions`, testTransaction, cookies);
    
    if (createResult.success) {
        console.log('✅ Create transaction: SUCCESS');
        console.log('   Response:', JSON.stringify(createResult.data, null, 2));
        createdTransactionId = createResult.data.transaction?.id;
    } else {
        console.log('❌ Create transaction: FAILED');
        console.log('   Error:', createResult.error);
    }
    console.log('');
    
    // Test 2: Get customer's gold transactions
    console.log('2️⃣ Testing GET /customers/:id/gold-transactions');
    const getResult = await makeRequest('GET', `/customers/${TEST_CUSTOMER_ID}/gold-transactions?page=1&limit=10`, null, cookies);
    
    if (getResult.success) {
        console.log('✅ Get transactions: SUCCESS');
        console.log('   Response:', JSON.stringify(getResult.data, null, 2));
    } else {
        console.log('❌ Get transactions: FAILED');
        console.log('   Error:', getResult.error);
    }
    console.log('');
    
    // Test 3: Update gold transaction (only if we created one)
    if (createdTransactionId) {
        console.log('3️⃣ Testing PUT /customers/:id/gold-transactions/:transactionId');
        const updateResult = await makeRequest('PUT', `/customers/${TEST_CUSTOMER_ID}/gold-transactions/${createdTransactionId}`, updatedTransaction, cookies);
        
        if (updateResult.success) {
            console.log('✅ Update transaction: SUCCESS');
            console.log('   Message:', updateResult.data.message);
            console.log('   Updated amount:', updateResult.data.transaction?.amount_grams, 'grams');
        } else {
            console.log('❌ Update transaction: FAILED');
            console.log('   Error:', updateResult.error);
        }
        console.log('');
    }
    
    // Test 4: Delete gold transaction (only if we created one)
    if (createdTransactionId) {
        console.log('4️⃣ Testing DELETE /customers/:id/gold-transactions/:transactionId');
        const deleteResult = await makeRequest('DELETE', `/customers/${TEST_CUSTOMER_ID}/gold-transactions/${createdTransactionId}`, null, cookies);
        
        if (deleteResult.success) {
            console.log('✅ Delete transaction: SUCCESS');
            console.log('   Message:', deleteResult.data.message);
        } else {
            console.log('❌ Delete transaction: FAILED');
            console.log('   Error:', deleteResult.error);
        }
        console.log('');
    }
    
    // Test 5: Validation tests
    console.log('5️⃣ Testing validation');
    
    // Test invalid transaction type
    const invalidTypeResult = await makeRequest('POST', `/customers/${TEST_CUSTOMER_ID}/gold-transactions`, {
        ...testTransaction,
        transaction_type: 'invalid'
    }, cookies);
    
    if (!invalidTypeResult.success) {
        console.log('✅ Invalid transaction type validation: SUCCESS');
        console.log('   Error message:', invalidTypeResult.error.message);
    } else {
        console.log('❌ Invalid transaction type validation: FAILED (should have failed)');
    }
    
    // Test negative amount
    const negativeAmountResult = await makeRequest('POST', `/customers/${TEST_CUSTOMER_ID}/gold-transactions`, {
        ...testTransaction,
        amount_grams: -5
    }, cookies);
    
    if (!negativeAmountResult.success) {
        console.log('✅ Negative amount validation: SUCCESS');
        console.log('   Error message:', negativeAmountResult.error.message);
    } else {
        console.log('❌ Negative amount validation: FAILED (should have failed)');
    }
    
    // Test short description
    const shortDescResult = await makeRequest('POST', `/customers/${TEST_CUSTOMER_ID}/gold-transactions`, {
        ...testTransaction,
        description: 'کوتاه'
    }, cookies);
    
    if (!shortDescResult.success) {
        console.log('✅ Short description validation: SUCCESS');
        console.log('   Error message:', shortDescResult.error.message);
    } else {
        console.log('❌ Short description validation: FAILED (should have failed)');
    }
    
    console.log('\n🏁 API Tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };