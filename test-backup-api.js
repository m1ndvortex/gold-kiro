// Test backup system API endpoints
const fetch = require('node-fetch').default || require('node-fetch');

async function testBackupAPI() {
    console.log('🧪 Testing Backup System API...\n');
    
    const baseURL = 'http://localhost:3000';
    
    try {
        // Test 1: Check if server is running
        console.log('1. Testing server connection...');
        const healthCheck = await fetch(`${baseURL}/`);
        if (healthCheck.status === 200 || healthCheck.status === 302) {
            console.log('   ✅ Server is running');
        } else {
            throw new Error('Server not responding');
        }
        
        // Test 2: Try to access backup page (should redirect to login)
        console.log('\n2. Testing backup page access...');
        const backupPageResponse = await fetch(`${baseURL}/backup`);
        if (backupPageResponse.status === 302) {
            console.log('   ✅ Backup page requires authentication (redirects to login)');
        } else {
            console.log('   ⚠️  Backup page response:', backupPageResponse.status);
        }
        
        // Test 3: Check backup status endpoint (should require auth)
        console.log('\n3. Testing backup status endpoint...');
        const statusResponse = await fetch(`${baseURL}/backup/status`);
        if (statusResponse.status === 302) {
            console.log('   ✅ Backup status requires authentication');
        } else {
            console.log('   ⚠️  Status endpoint response:', statusResponse.status);
        }
        
        console.log('\n🎉 API tests completed!');
        console.log('\n📝 Next steps:');
        console.log('   1. Open browser: http://localhost:3000');
        console.log('   2. Login with admin credentials');
        console.log('   3. Navigate to: /backup or /settings');
        console.log('   4. Test backup creation manually');
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Solution: Make sure the server is running with: node server.js');
        }
    }
}

// Check if node-fetch is available
try {
    require('node-fetch');
    testBackupAPI();
} catch (e) {
    console.log('📦 node-fetch not available, testing with curl instead...\n');
    
    // Alternative test using curl
    const { exec } = require('child_process');
    
    exec('curl -I http://localhost:3000', (error, stdout, stderr) => {
        if (error) {
            console.log('❌ Server connection test failed');
            console.log('💡 Make sure server is running: node server.js');
        } else {
            console.log('✅ Server is responding');
            console.log('\n📝 Manual test steps:');
            console.log('   1. Open: http://localhost:3000');
            console.log('   2. Login as admin');
            console.log('   3. Go to: /backup');
            console.log('   4. Create a test backup');
            console.log('   5. Download the backup file');
        }
    });
}