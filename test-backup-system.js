// Simple test script to verify backup system functionality
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Backup System...\n');

// Test 1: Check if backup directory exists
const backupDir = path.join(__dirname, 'backups');
if (fs.existsSync(backupDir)) {
    console.log('✅ Backup directory exists');
    const files = fs.readdirSync(backupDir);
    console.log(`📁 Found ${files.length} backup files`);
    
    // List recent backup files
    if (files.length > 0) {
        console.log('\n📋 Recent backup files:');
        files.slice(0, 5).forEach(file => {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            const sizeKB = Math.round(stats.size / 1024);
            console.log(`   - ${file} (${sizeKB} KB)`);
        });
    }
} else {
    console.log('❌ Backup directory does not exist');
    console.log('Creating backup directory...');
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('✅ Backup directory created');
}

// Test 2: Check temp uploads directory
const tempDir = path.join(__dirname, 'temp_uploads');
if (!fs.existsSync(tempDir)) {
    console.log('\n📁 Creating temp uploads directory...');
    fs.mkdirSync(tempDir, { recursive: true, mode: 0o700 });
    console.log('✅ Temp uploads directory created');
} else {
    console.log('\n✅ Temp uploads directory exists');
}

// Test 3: Verify server.js has backup routes
const serverPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    const backupRoutes = [
        '/backup/create',
        '/backup/restore',
        '/backup/download',
        '/backup/delete',
        '/backup/settings'
    ];
    
    console.log('\n🔍 Checking backup routes in server.js:');
    backupRoutes.forEach(route => {
        if (serverContent.includes(route)) {
            console.log(`   ✅ ${route}`);
        } else {
            console.log(`   ❌ ${route} - Missing!`);
        }
    });
    
    // Check for security features
    console.log('\n🔒 Checking security features:');
    const securityFeatures = [
        'requireAuth',
        'role === \'admin\'',
        'crypto.randomBytes',
        'FOREIGN_KEY_CHECKS',
        'path traversal'
    ];
    
    securityFeatures.forEach(feature => {
        if (serverContent.includes(feature)) {
            console.log(`   ✅ ${feature}`);
        } else {
            console.log(`   ⚠️  ${feature} - Check implementation`);
        }
    });
} else {
    console.log('\n❌ server.js not found');
}

// Test 4: Check backup view files
const viewFiles = [
    'views/backup.ejs',
    'views/backup-history.ejs'
];

console.log('\n🎨 Checking view files:');
viewFiles.forEach(viewFile => {
    if (fs.existsSync(viewFile)) {
        console.log(`   ✅ ${viewFile}`);
        
        // Check for security elements in views
        const content = fs.readFileSync(viewFile, 'utf8');
        if (content.includes('امن') || content.includes('secure')) {
            console.log(`      🔒 Contains security elements`);
        }
    } else {
        console.log(`   ❌ ${viewFile} - Missing!`);
    }
});

console.log('\n🎉 Backup system test completed!');
console.log('\n📝 Next steps:');
console.log('   1. Start the server: node server.js');
console.log('   2. Login as admin user');
console.log('   3. Navigate to /backup or /settings');
console.log('   4. Test backup creation and download');
console.log('   5. Test restore functionality (admin only)');