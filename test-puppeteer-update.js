// Test script to verify puppeteer functionality before updating
const puppeteer = require('puppeteer');

async function testPuppeteerFunctionality() {
    console.log('🧪 Testing Puppeteer functionality...\n');
    
    try {
        console.log('1. Launching browser...');
        const browser = await puppeteer.launch({ headless: true });
        console.log('   ✅ Browser launched successfully');
        
        console.log('2. Creating new page...');
        const page = await browser.newPage();
        console.log('   ✅ Page created successfully');
        
        console.log('3. Setting test content...');
        const testHTML = `
            <html>
                <head><title>Test PDF</title></head>
                <body>
                    <h1>تست PDF فارسی</h1>
                    <p>این یک تست برای تولید PDF است</p>
                    <table border="1">
                        <tr><th>نام</th><th>قیمت</th></tr>
                        <tr><td>طلا</td><td>1000000</td></tr>
                    </table>
                </body>
            </html>
        `;
        
        await page.setContent(testHTML, { waitUntil: 'networkidle0' });
        console.log('   ✅ Content set successfully');
        
        console.log('4. Generating PDF...');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
        });
        console.log('   ✅ PDF generated successfully');
        console.log(`   📄 PDF size: ${pdfBuffer.length} bytes`);
        
        console.log('5. Closing browser...');
        await browser.close();
        console.log('   ✅ Browser closed successfully');
        
        console.log('\n🎉 Puppeteer test completed successfully!');
        console.log('✅ Your PDF generation functionality is working correctly');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Puppeteer test failed:', error.message);
        console.log('\n💡 This means updating puppeteer might break your PDF functionality');
        return false;
    }
}

testPuppeteerFunctionality();