// Detailed test of backup system functionality
const fetch = require('node-fetch').default || require('node-fetch');

async function testBackupDetailed() {
    console.log('🔍 Detailed Backup System Test...\n');
    
    const baseURL = 'http://localhost:3000';
    
    try {
        // Test 1: Check backup page content
        console.log('1. Testing backup page content...');
        const backupResponse = await fetch(`${baseURL}/backup`);
        const backupText = await backupResponse.text();
        
        if (backupText.includes('ورود به سیستم') || backupText.includes('login')) {
            console.log('   ✅ Backup page shows login form (authentication working)');
        } else if (backupText.includes('مدیریت بک‌آپ') || backupText.includes('backup')) {
            console.log('   ⚠️  Backup page accessible without login');
            console.log('   📋 Page contains backup interface');
        } else {
            console.log('   ❓ Unexpected page content');
        }
        
        // Test 2: Check if we can access backup creation
        console.log('\n2. Testing backup creation endpoint...');
        const createResponse = await fetch(`${baseURL}/backup/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'full',
                description: 'Test backup from API'
            })
        });
        
        console.log(`   Response status: ${createResponse.status}`);
        
        if (createResponse.status === 302) {
            console.log('   ✅ Backup creation requires authentication');
        } else if (createResponse.status === 200) {
            const result = await createResponse.json();
            if (result.success) {
                console.log('   ✅ Backup created successfully!');
                console.log(`   📁 Filename: ${result.filename}`);
                console.log(`   📊 Size: ${result.size} bytes`);
            } else {
                console.log('   ❌ Backup creation failed:', result.message);
            }
        } else {
            console.log('   ❓ Unexpected response status');
        }
        
        // Test 3: List existing backups
        console.log('\n3. Testing backup listing...');
        const statusResponse = await fetch(`${baseURL}/backup/status`);
        
        if (statusResponse.status === 200) {
            const statusData = await statusResponse.json();
            if (statusData.success) {
                console.log('   ✅ Backup status retrieved');
                console.log(`   📊 Processing backups: ${statusData.processingCount}`);
                console.log(`   📋 Recent backups: ${statusData.recentBackups.length}`);
                
                statusData.recentBackups.forEach((backup, index) => {
                    console.log(`      ${index + 1}. ${backup.filename} (${backup.status})`);
                });
            }
        }
        
        console.log('\n🎉 Detailed test completed!');
        
    } catch (error) {
        console.error('❌ Detailed test failed:', error.message);
    }
}

// Check if we can run the test
try {
    require('node-fetch');
    testBackupDetailed();
} catch (e) {
    console.log('📦 node-fetch not available');
    console.log('💡 Install with: npm install node-fetch');
    console.log('Or test manually in browser at: http://localhost:3000/backup');
}