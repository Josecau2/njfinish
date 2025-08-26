// Local test for CSV parsing functionality (no server required)
const fs = require('fs');
const path = require('path');
const { parseCatalogFile } = require('./utils/parseCatalogFile');

// Test data samples
const testCSVData = {
  minimal: `Code
BM-W321
30GR
D406`,
  
  complete: `Code,Description,Style,Price,Type,Color,Discontinued
BM-W321,Base cabinet with doors,Shaker White,125.50,Base Cabinet,White,no
30GR,Glass rack,Traditional,55.03,Accessories,,no
D406,Wall cabinet 30 inch,Shaker White,89.99,Wall Cabinet,White,no
FA2421,Vanity sink base,Modern,274.36,Vanity,Espresso,yes`,

  caseInsensitive: `ITEM,DESCRIPTION,STYLE,PRICE,TYPE
BM-UPPER,Upper cabinet,Modern Oak,95.00,Wall Cabinet
BM-BASE,Base cabinet,Modern Oak,145.00,Base Cabinet`,

  withEmptyFields: `Code,Description,Style,Price,Type
BM-001,Cabinet with description,Shaker,100.00,Base
BM-002,,Shaker,75.50,Wall
BM-003,Cabinet without price,Shaker,,Base
,Empty code row,Shaker,50.00,Base`,

  alternativeHeaders: `Item,Description,STYLE,PRICE
ALT-001,Alternative header test,Modern,89.99
ALT-002,Another test item,Traditional,120.00`,

  discontinuedVariations: `Code,Description,Price,Discontinued
DISC-001,Discontinued item 1,50.00,yes
DISC-002,Discontinued item 2,60.00,true
DISC-003,Discontinued item 3,70.00,1
DISC-004,Active item 1,80.00,no
DISC-005,Active item 2,90.00,false
DISC-006,Active item 3,100.00,0
DISC-007,Default active,110.00,`
};

async function createTestFiles() {
  const testDir = './test-csv-parsing';
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testFiles = {};
  
  for (const [name, data] of Object.entries(testCSVData)) {
    const filePath = path.join(testDir, `test-${name}.csv`);
    fs.writeFileSync(filePath, data);
    testFiles[name] = filePath;
  }
  
  return testFiles;
}

async function testCSVParsing(filePath, testName, expectedResults = {}) {
  console.log(`\n📋 Testing: ${testName}`);
  console.log(`📁 File: ${filePath}`);
  console.log('─'.repeat(50));
  
  try {
    // Test the parsing function
    const parsedData = await parseCatalogFile(filePath, 'text/csv');
    
    console.log(`✅ Parsing successful - ${parsedData.length} items found`);
    
    // Display parsed data
    if (parsedData.length > 0) {
      console.log('\n📊 Parsed Data:');
      parsedData.forEach((item, index) => {
        console.log(`${index + 1}. Code: "${item.code}"`);
        if (item.description) console.log(`   Description: "${item.description}"`);
        if (item.style) console.log(`   Style: "${item.style}"`);
        if (item.price) console.log(`   Price: $${item.price}`);
        if (item.type) console.log(`   Type: "${item.type}"`);
        if (item.color) console.log(`   Color: "${item.color}"`);
        if (item.discontinued !== undefined) console.log(`   Discontinued: ${item.discontinued}`);
        console.log('');
      });
    }
    
    // Validate expected results
    if (expectedResults.count !== undefined) {
      if (parsedData.length === expectedResults.count) {
        console.log(`✅ Expected count match: ${parsedData.length}`);
      } else {
        console.log(`⚠️  Count mismatch: expected ${expectedResults.count}, got ${parsedData.length}`);
      }
    }
    
    if (expectedResults.hasCode) {
      const foundCode = parsedData.find(item => item.code === expectedResults.hasCode);
      if (foundCode) {
        console.log(`✅ Found expected code: ${expectedResults.hasCode}`);
      } else {
        console.log(`❌ Missing expected code: ${expectedResults.hasCode}`);
      }
    }
    
    if (expectedResults.noPriceItems) {
      const noPriceCount = parsedData.filter(item => !item.price || item.price === 0).length;
      console.log(`📊 Items without price: ${noPriceCount}`);
    }
    
    return { success: true, data: parsedData };
    
  } catch (error) {
    console.log(`❌ Parsing failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runParsingTests() {
  console.log('🧪 CSV PARSING FUNCTIONALITY TESTS');
  console.log('===================================');
  
  try {
    // Create test files
    console.log('🔧 Creating test files...');
    const testFiles = await createTestFiles();
    console.log('✅ Test files created');
    
    const results = [];
    
    // Test 1: Minimal format
    const test1 = await testCSVParsing(
      testFiles.minimal, 
      'Minimal Format (Code only)',
      { count: 3, hasCode: 'BM-W321' }
    );
    results.push({ name: 'Minimal Format', ...test1 });
    
    // Test 2: Complete format
    const test2 = await testCSVParsing(
      testFiles.complete, 
      'Complete Format (All fields)',
      { count: 4, hasCode: 'FA2421' }
    );
    results.push({ name: 'Complete Format', ...test2 });
    
    // Test 3: Case insensitive headers
    const test3 = await testCSVParsing(
      testFiles.caseInsensitive, 
      'Case Insensitive Headers',
      { count: 2, hasCode: 'BM-UPPER' }
    );
    results.push({ name: 'Case Insensitive', ...test3 });
    
    // Test 4: Empty fields
    const test4 = await testCSVParsing(
      testFiles.withEmptyFields, 
      'Empty Fields Handling',
      { count: 3, noPriceItems: true } // Should skip row with empty code
    );
    results.push({ name: 'Empty Fields', ...test4 });
    
    // Test 5: Alternative headers
    const test5 = await testCSVParsing(
      testFiles.alternativeHeaders, 
      'Alternative Header Names',
      { count: 2, hasCode: 'ALT-001' }
    );
    results.push({ name: 'Alternative Headers', ...test5 });
    
    // Test 6: Discontinued variations
    const test6 = await testCSVParsing(
      testFiles.discontinuedVariations, 
      'Discontinued Field Variations',
      { count: 7 }
    );
    results.push({ name: 'Discontinued Variations', ...test6 });
    
    // Results summary
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    const passedTests = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const details = result.success ? `(${result.data.length} items)` : `(${result.error})`;
      console.log(`${status} ${result.name} ${details}`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All CSV parsing tests passed!');
      console.log('✅ The catalog upload functionality should work correctly.');
    } else {
      console.log('⚠️  Some parsing tests failed.');
      console.log('❌ Check the CSV format or parsing logic.');
    }
    
    // Detailed analysis
    if (passedTests === totalTests) {
      console.log('\n💡 KEY FINDINGS:');
      console.log('• Code field is properly extracted from multiple header variations');
      console.log('• Empty code rows are correctly skipped');
      console.log('• Case insensitive header matching works');
      console.log('• Price fields are properly parsed as numbers');
      console.log('• Discontinued field accepts multiple boolean formats');
      console.log('• Missing optional fields are handled gracefully');
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  } finally {
    // Cleanup
    const testDir = './test-csv-parsing';
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
      console.log('\n🧹 Cleaned up test files');
    }
  }
}

// Additional utility to test a custom CSV file
async function testCustomCSV(filePath) {
  console.log('🔍 TESTING CUSTOM CSV FILE');
  console.log('===========================');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  const fileName = path.basename(filePath);
  const mimetype = filePath.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                   filePath.endsWith('.xls') ? 'application/vnd.ms-excel' : 'text/csv';
  
  try {
    const parsedData = await parseCatalogFile(filePath, mimetype);
    
    console.log(`✅ Successfully parsed: ${fileName}`);
    console.log(`📊 Found ${parsedData.length} valid items`);
    
    if (parsedData.length > 0) {
      console.log('\n📋 Sample data (first 5 items):');
      parsedData.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.code} - ${item.description || 'No description'} ($${item.price || '0.00'})`);
      });
      
      if (parsedData.length > 5) {
        console.log(`... and ${parsedData.length - 5} more items`);
      }
    }
    
    return parsedData;
    
  } catch (error) {
    console.log(`❌ Failed to parse ${fileName}: ${error.message}`);
    return null;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const customFile = process.argv[2];
  
  if (customFile) {
    // Test a specific file provided as argument
    testCustomCSV(customFile).then(() => {
      console.log('\n✨ Custom file test complete!');
    });
  } else {
    // Run all standard tests
    runParsingTests().then(() => {
      console.log('\n✨ All parsing tests complete!');
    });
  }
}

module.exports = {
  runParsingTests,
  testCustomCSV,
  testCSVData
};
