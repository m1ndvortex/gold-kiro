// Startup script for backup system
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Gold Shop Backup System...\n');

// Check required directories
const requiredDirs = [
    'backups',
    'temp_uploads',
    'public/uploads'
];

console.log('📁 Checking required directories:');
requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
        console.log(`   ✅ Created: ${dir}`);
    } else {
        console.log(`   ✅ Exists: ${dir}`);
    }
});

// Check environment file
if (fs.existsSync('.env')) {
    console.log('\n✅ Environment file (.env) found');
} else {
    console.log('\n⚠️  Environment file (.env) not found');
    console.log('   Creating sample .env file...');
    
    const sampleEnv = `# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gold_shop_db

# Server Configuration
PORT=3000
SESSION_SECRET=your-secret-key-here

# Backup Configuration
MAX_BACKUP_FILES=10
BACKUP_RETENTION_DAYS=30
`;
    
    fs.writeFileSync('.env', sampleEnv);
    console.log('   ✅ Sample .env file created');
}

// Check package.json dependencies
if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = [
        'express',
        'mysql2',
        'bcryptjs',
        'express-session',
        'multer',
        'moment',
        'express-ejs-layouts',
        'dotenv'
    ];
    
    console.log('\n📦 Checking required dependencies:');
    requiredDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
            console.log(`   ✅ ${dep}: ${packageJson.dependencies[dep]}`);
        } else {
            console.log(`   ❌ ${dep}: Missing`);
        }
    });
} else {
    console.log('\n❌ package.json not found');
}

// Check database connection
console.log('\n🔍 Testing database connection...');
const testDb = require('./test-backup-creation.js');

console.log('\n🎉 Backup system startup check completed!');
console.log('\n📝 Next steps:');
console.log('   1. Ensure MySQL is running');
console.log('   2. Update .env with correct database credentials');
console.log('   3. Run: npm install (if dependencies are missing)');
console.log('   4. Run: node server.js');
console.log('   5. Navigate to: http://localhost:3000/backup');