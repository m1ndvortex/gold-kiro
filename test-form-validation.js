/**
 * Test script for Gold Transaction Form Validation
 */

// Mock DOM elements for testing
const mockDOM = {
    getElementById: (id) => {
        const mockElements = {
            'transactionDate': { value: '', closest: () => ({ classList: { add: () => {}, remove: () => {} }, querySelector: () => null, appendChild: () => {} }) },
            'transactionType': { value: '', closest: () => ({ classList: { add: () => {}, remove: () => {} }, querySelector: () => null, appendChild: () => {} }) },
            'amountGrams': { value: '', closest: () => ({ classList: { add: () => {}, remove: () => {} }, querySelector: () => null, appendChild: () => {} }) },
            'description': { value: '', closest: () => ({ classList: { add: () => {}, remove: () => {} }, querySelector: () => null, appendChild: () => {} }) }
        };
        return mockElements[id] || null;
    },
    querySelectorAll: () => [],
    createElement: () => ({ textContent: '', style: { display: '' }, className: '' }),
    addEventListener: () => {}
};

// Mock global document
global.document = mockDOM;

// Test Persian date validation
function testPersianDateValidation() {
    console.log('🧪 Testing Persian Date Validation...\n');
    
    const testCases = [
        { input: '1403/01/15', expected: true, description: 'Valid Persian date' },
        { input: '1403/1/15', expected: false, description: 'Invalid format (single digit month)' },
        { input: '1403/13/15', expected: false, description: 'Invalid month (13)' },
        { input: '1403/01/32', expected: false, description: 'Invalid day (32)' },
        { input: '1200/01/15', expected: false, description: 'Invalid year (too old)' },
        { input: '1600/01/15', expected: false, description: 'Invalid year (too new)' },
        { input: '1403-01-15', expected: false, description: 'Wrong separator' },
        { input: '', expected: false, description: 'Empty string' },
        { input: 'abc/def/ghi', expected: false, description: 'Non-numeric' }
    ];
    
    // Persian date validation function (copied from gold-account.js)
    function isValidPersianDate(dateStr) {
        const regex = /^\d{4}\/\d{2}\/\d{2}$/;
        if (!regex.test(dateStr)) return false;
        
        const parts = dateStr.split('/');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        
        return year >= 1300 && year <= 1500 && 
               month >= 1 && month <= 12 && 
               day >= 1 && day <= 31;
    }
    
    let passed = 0;
    let failed = 0;
    
    testCases.forEach((testCase, index) => {
        const result = isValidPersianDate(testCase.input);
        const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';
        
        console.log(`${index + 1}. ${status} - ${testCase.description}`);
        console.log(`   Input: "${testCase.input}" | Expected: ${testCase.expected} | Got: ${result}`);
        
        if (result === testCase.expected) {
            passed++;
        } else {
            failed++;
        }
    });
    
    console.log(`\n📊 Persian Date Validation Results: ${passed} passed, ${failed} failed\n`);
    return failed === 0;
}

// Test amount validation
function testAmountValidation() {
    console.log('🧪 Testing Amount Validation...\n');
    
    const testCases = [
        { input: '2.500', expected: true, description: 'Valid amount' },
        { input: '0.001', expected: true, description: 'Minimum valid amount' },
        { input: '0.0001', expected: false, description: 'Below minimum' },
        { input: '0', expected: false, description: 'Zero amount' },
        { input: '-1', expected: false, description: 'Negative amount' },
        { input: 'abc', expected: false, description: 'Non-numeric' },
        { input: '', expected: false, description: 'Empty string' },
        { input: '1000.123', expected: true, description: 'Large valid amount' }
    ];
    
    function validateAmount(input) {
        const value = parseFloat(input);
        return !isNaN(value) && value > 0 && value >= 0.001;
    }
    
    let passed = 0;
    let failed = 0;
    
    testCases.forEach((testCase, index) => {
        const result = validateAmount(testCase.input);
        const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';
        
        console.log(`${index + 1}. ${status} - ${testCase.description}`);
        console.log(`   Input: "${testCase.input}" | Expected: ${testCase.expected} | Got: ${result}`);
        
        if (result === testCase.expected) {
            passed++;
        } else {
            failed++;
        }
    });
    
    console.log(`\n📊 Amount Validation Results: ${passed} passed, ${failed} failed\n`);
    return failed === 0;
}

// Test description validation
function testDescriptionValidation() {
    console.log('🧪 Testing Description Validation...\n');
    
    const testCases = [
        { input: 'خرید طلا از بازار', expected: true, description: 'Valid description' },
        { input: 'کوتا', expected: false, description: 'Too short (4 chars)' },
        { input: '', expected: false, description: 'Empty string' },
        { input: '     ', expected: false, description: 'Only spaces' },
        { input: 'دقیقاً پنج', expected: true, description: 'Exactly 5 characters' },
        { input: 'این یک توضیح بسیار طولانی است که باید قبول شود', expected: true, description: 'Long description' }
    ];
    
    function validateDescription(input) {
        const trimmed = input.trim();
        return trimmed.length >= 5;
    }
    
    let passed = 0;
    let failed = 0;
    
    testCases.forEach((testCase, index) => {
        const result = validateDescription(testCase.input);
        const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';
        
        console.log(`${index + 1}. ${status} - ${testCase.description}`);
        console.log(`   Input: "${testCase.input}" | Expected: ${testCase.expected} | Got: ${result}`);
        
        if (result === testCase.expected) {
            passed++;
        } else {
            failed++;
        }
    });
    
    console.log(`\n📊 Description Validation Results: ${passed} passed, ${failed} failed\n`);
    return failed === 0;
}

// Test Persian to Gregorian conversion
function testDateConversion() {
    console.log('🧪 Testing Persian to Gregorian Date Conversion...\n');
    
    function convertPersianToGregorian(persianDateStr) {
        try {
            const parts = persianDateStr.split('/');
            if (parts.length !== 3) return null;
            
            const year = parseInt(parts[0]) + 621;
            const month = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);
            
            return new Date(year, month, day);
        } catch (error) {
            return null;
        }
    }
    
    const testCases = [
        { input: '1403/01/15', description: 'Valid Persian date' },
        { input: '1403/12/29', description: 'End of Persian year' },
        { input: '1400/01/01', description: 'Start of Persian year' },
        { input: 'invalid', description: 'Invalid format' }
    ];
    
    testCases.forEach((testCase, index) => {
        const result = convertPersianToGregorian(testCase.input);
        const status = result instanceof Date && !isNaN(result) ? '✅ PASS' : '❌ FAIL';
        
        console.log(`${index + 1}. ${status} - ${testCase.description}`);
        console.log(`   Input: "${testCase.input}" | Result: ${result ? result.toDateString() : 'null'}`);
    });
    
    console.log('\n📊 Date Conversion Test Completed\n');
}

// Run all tests
function runAllTests() {
    console.log('🚀 Starting Gold Transaction Form Validation Tests\n');
    console.log('=' .repeat(60));
    
    const results = {
        dateValidation: testPersianDateValidation(),
        amountValidation: testAmountValidation(),
        descriptionValidation: testDescriptionValidation()
    };
    
    testDateConversion();
    
    console.log('=' .repeat(60));
    console.log('📋 FINAL TEST SUMMARY:');
    console.log(`   Persian Date Validation: ${results.dateValidation ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Amount Validation: ${results.amountValidation ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Description Validation: ${results.descriptionValidation ? '✅ PASSED' : '❌ FAILED'}`);
    
    const allPassed = Object.values(results).every(result => result === true);
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
}

// Run the tests
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testPersianDateValidation,
    testAmountValidation,
    testDescriptionValidation,
    testDateConversion,
    runAllTests
};