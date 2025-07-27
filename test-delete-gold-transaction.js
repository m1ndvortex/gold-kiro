/**
 * Test script for gold transaction delete functionality
 */

const http = require('http');
const querystring = require('querystring');

const BASE_URL = 'http://localhost:3000';
const TEST_CUSTOMER_ID = 1; // Assuming customer with ID 1 exists

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, cookies = '') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': method === 'POST' || method === 'PUT' ? 'application/json' : 'application/x-www-form-urlencoded',
                'Cookie': cookies
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(body);
                    resolve({
                        success: true,
                        data: jsonData,
                        statusCode: res.statusCode,
                        headers: res.headers
                    });
                } catch (e) {
                    resolve({
                        success: false,
                        error: 'Invalid JSON response',
                        body: body,
                        statusCode: res.statusCode,
                        headers: res.headers
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(typeof data === 'string' ? data : JSON.stringify(data));
        }
        req.end();
    });
}

async function testDeleteGoldTransaction() {
    console.log('🧪 Testing Gold Transaction Delete Functionality\n');

    try {
        // Step 1: Login to get session cookie
        console.log('🔐 Logging in...');
        const loginData = querystring.stringify({
            username: 'admin',
            password: 'admin123'
        });

        const loginResult = await makeRequest('POST', '/login', loginData);
        
        if (loginResult.statusCode !== 302) {
            console.log('❌ Login failed');
            return;
        }

        const cookies = loginResult.headers['set-cookie']?.join('; ') || '';
        console.log('✅ Login successful\n');

        // Step 2: Create a test transaction first
        console.log('1️⃣ Creating test transaction...');
        const testTransaction = {
            transaction_date: '2025-01-27',
            transaction_type: 'credit',
            amount_grams: 1.500,
            description: 'Test transaction for delete functionality'
        };

        const createResult = await makeRequest('POST', `/customers/${TEST_CUSTOMER_ID}/gold-transactions`, testTransaction, cookies);
        
        if (!createResult.success || !createResult.data.success) {
            console.log('❌ Failed to create test transaction');
            console.log('   Error:', createResult.error || createResult.data?.message);
            return;
        }

        const createdTransactionId = createResult.data.transaction.id;
        console.log('✅ Test transaction created with ID:', createdTransactionId);
        console.log('');

        // Step 3: Test delete functionality
        console.log('2️⃣ Testing DELETE functionality...');
        const deleteResult = await makeRequest('DELETE', `/customers/${TEST_CUSTOMER_ID}/gold-transactions/${createdTransactionId}`, null, cookies);
        
        if (deleteResult.success && deleteResult.data.success) {
            console.log('✅ Delete transaction: SUCCESS');
            console.log('   Message:', deleteResult.data.message);
        } else {
            console.log('❌ Delete transaction: FAILED');
            console.log('   Error:', deleteResult.error || deleteResult.data?.message);
            console.log('   Status Code:', deleteResult.statusCode);
        }
        console.log('');

        // Step 4: Verify transaction was deleted
        console.log('3️⃣ Verifying transaction was deleted...');
        const verifyResult = await makeRequest('GET', `/customers/${TEST_CUSTOMER_ID}/gold-transactions/${createdTransactionId}`, null, cookies);
        
        if (verifyResult.statusCode === 404 || (verifyResult.data && !verifyResult.data.success)) {
            console.log('✅ Transaction successfully deleted (not found)');
        } else {
            console.log('❌ Transaction still exists after delete');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }

    console.log('\n🏁 Delete functionality test completed!');
}

// Run the test
testDeleteGoldTransaction();