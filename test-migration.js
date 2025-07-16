const http = require('http');
const https = require('https');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const LOCAL_FILES = [
    '/css/bootstrap.min.css',
    '/css/style.css',
    '/js/jquery.min.js',
    '/js/bootstrap.bundle.min.js',
    '/js/moment.min.js',
    '/js/moment-jalaali.js',
    '/js/main.js'
];

// Test results
let testResults = {
    passed: 0,
    failed: 0,
    details: []
};

function testFileAccess(filePath) {
    return new Promise((resolve) => {
        const url = `${BASE_URL}${filePath}`;
        
        http.get(url, (res) => {
            const result = {
                file: filePath,
                status: res.statusCode,
                contentType: res.headers['content-type'],
                contentLength: res.headers['content-length'],
                success: res.statusCode === 200
            };
            
            if (result.success) {
                testResults.passed++;
                console.log(`✅ ${filePath} - Status: ${res.statusCode}, Type: ${result.contentType}`);
            } else {
                testResults.failed++;
                console.log(`❌ ${filePath} - Status: ${res.statusCode}`);
            }
            
            testResults.details.push(result);
            resolve(result);
        }).on('error', (err) => {
            testResults.failed++;
            const result = {
                file: filePath,
                error: err.message,
                success: false
            };
            console.log(`❌ ${filePath} - Error: ${err.message}`);
            testResults.details.push(result);
            resolve(result);
        });
    });
}

async function runTests() {
    console.log('🧪 Testing CDN Migration - Local File Access\n');
    console.log('Testing local files accessibility...\n');
    
    // Test all local files
    const promises = LOCAL_FILES.map(file => testFileAccess(file));
    await Promise.all(promises);
    
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
        console.log('\n🎉 All local files are accessible! CDN migration successful.');
    } else {
        console.log('\n⚠️  Some files failed to load. Check the details above.');
    }
    
    return testResults;
}

// Run the tests
runTests().catch(console.error);