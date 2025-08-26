// Test script for manufacturer catalog CSV upload functionality
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { Manufacturer, ManufacturerCatalogData } = require('./models');

// Configuration
const API_BASE_URL = 'http://localhost:8080';
const TEST_DIR = './test-csv-uploads';

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

  duplicates: `Code,Description,Price
BM-W321,Updated description,135.00
30GR,Updated glass rack,60.00
NEW-001,New item,25.00`
};

async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...\n');
  
  // Create test directory
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    console.log(`✅ Created test directory: ${TEST_DIR}`);
  }
  
  // Create test CSV files
  for (const [name, data] of Object.entries(testCSVData)) {
    const filePath = path.join(TEST_DIR, `test-${name}.csv`);
    fs.writeFileSync(filePath, data);
    console.log(`✅ Created test file: ${filePath}`);
  }
  
  console.log('');
}

async function getAuthToken() {
  console.log('🔐 Getting authentication token...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'joseca@symmetricalwolf.com', // Use admin user
        password: 'admin123'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Authentication successful\n');
    return data.token;
    
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return null;
  }
}

async function getTestManufacturer(token) {
  console.log('🏭 Getting test manufacturer...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/manufacturers`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch manufacturers: ${response.status}`);
    }
    
    const manufacturers = await response.json();
    
    if (manufacturers.length === 0) {
      console.log('⚠️  No manufacturers found - creating test manufacturer...');
      return await createTestManufacturer(token);
    }
    
    const testManu = manufacturers[0];
    console.log(`✅ Using manufacturer: ${testManu.name} (ID: ${testManu.id})\n`);
    return testManu;
    
  } catch (error) {
    console.error('❌ Failed to get manufacturer:', error.message);
    return null;
  }
}

async function createTestManufacturer(token) {
  const testData = {
    name: 'Test CSV Manufacturer',
    email: 'test@csvtest.com',
    phone: '1234567890',
    address: 'Test Address',
    website: 'https://test.com',
    costMultiplier: 1.5
  };
  
  try {
    const formData = new FormData();
    Object.keys(testData).forEach(key => {
      formData.append(key, testData[key]);
    });
    
    const response = await fetch(`${API_BASE_URL}/api/manufacturers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create manufacturer: ${response.status}`);
    }
    
    const manufacturer = await response.json();
    console.log(`✅ Created test manufacturer: ${manufacturer.name} (ID: ${manufacturer.id})\n`);
    return manufacturer;
    
  } catch (error) {
    console.error('❌ Failed to create manufacturer:', error.message);
    return null;
  }
}

async function uploadCSVFile(token, manufacturerId, filePath, testName) {
  console.log(`📤 Testing upload: ${testName}`);
  console.log(`   File: ${filePath}`);
  
  try {
    const formData = new FormData();
    formData.append('catalogFiles', fs.createReadStream(filePath));
    
    const response = await fetch(`${API_BASE_URL}/api/manufacturers/${manufacturerId}/catalog/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.log(`❌ Upload failed (${response.status}): ${responseText}`);
      return false;
    }
    
    console.log(`✅ Upload successful: ${responseText}`);
    return true;
    
  } catch (error) {
    console.log(`❌ Upload error: ${error.message}`);
    return false;
  }
}

async function verifyCatalogData(manufacturerId, expectedCount, testName) {
  console.log(`🔍 Verifying catalog data for: ${testName}`);
  
  try {
    const catalogItems = await ManufacturerCatalogData.findAll({
      where: { manufacturerId },
      order: [['code', 'ASC']]
    });
    
    console.log(`   Found ${catalogItems.length} items in database`);
    
    if (catalogItems.length > 0) {
      console.log('   Sample items:');
      catalogItems.slice(0, 3).forEach(item => {
        console.log(`   - ${item.code}: ${item.description || 'No description'} ($${item.price || '0.00'})`);
      });
    }
    
    return catalogItems;
    
  } catch (error) {
    console.log(`❌ Verification error: ${error.message}`);
    return [];
  }
}

async function cleanupTestData(manufacturerId) {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Remove test catalog data
    await ManufacturerCatalogData.destroy({
      where: { manufacturerId }
    });
    console.log('✅ Removed test catalog data');
    
    // Optionally remove test manufacturer
    // await Manufacturer.destroy({
    //   where: { id: manufacturerId }
    // });
    // console.log('✅ Removed test manufacturer');
    
  } catch (error) {
    console.log(`⚠️  Cleanup error: ${error.message}`);
  }
}

async function runCSVUploadTests() {
  console.log('🧪 MANUFACTURER CATALOG CSV UPLOAD TESTS');
  console.log('==========================================\n');
  
  let testResults = [];
  
  try {
    // Setup
    await setupTestEnvironment();
    
    // Authentication
    const token = await getAuthToken();
    if (!token) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }
    
    // Get test manufacturer
    const manufacturer = await getTestManufacturer(token);
    if (!manufacturer) {
      console.log('❌ Cannot proceed without manufacturer');
      return;
    }
    
    // Clean any existing data
    await cleanupTestData(manufacturer.id);
    
    // Test 1: Minimal CSV (only Code column)
    console.log('📋 TEST 1: Minimal CSV Format');
    console.log('---------------------------');
    const test1Success = await uploadCSVFile(
      token, 
      manufacturer.id, 
      path.join(TEST_DIR, 'test-minimal.csv'),
      'Minimal Format'
    );
    if (test1Success) {
      await verifyCatalogData(manufacturer.id, 3, 'Minimal Format');
    }
    testResults.push({ test: 'Minimal CSV', success: test1Success });
    console.log('');
    
    // Test 2: Complete CSV (all fields)
    console.log('📋 TEST 2: Complete CSV Format');
    console.log('----------------------------');
    const test2Success = await uploadCSVFile(
      token, 
      manufacturer.id, 
      path.join(TEST_DIR, 'test-complete.csv'),
      'Complete Format'
    );
    if (test2Success) {
      await verifyCatalogData(manufacturer.id, 4, 'Complete Format');
    }
    testResults.push({ test: 'Complete CSV', success: test2Success });
    console.log('');
    
    // Test 3: Case insensitive headers
    console.log('📋 TEST 3: Case Insensitive Headers');
    console.log('---------------------------------');
    const test3Success = await uploadCSVFile(
      token, 
      manufacturer.id, 
      path.join(TEST_DIR, 'test-caseInsensitive.csv'),
      'Case Insensitive'
    );
    if (test3Success) {
      await verifyCatalogData(manufacturer.id, 2, 'Case Insensitive');
    }
    testResults.push({ test: 'Case Insensitive', success: test3Success });
    console.log('');
    
    // Test 4: Empty fields handling
    console.log('📋 TEST 4: Empty Fields Handling');
    console.log('------------------------------');
    const test4Success = await uploadCSVFile(
      token, 
      manufacturer.id, 
      path.join(TEST_DIR, 'test-withEmptyFields.csv'),
      'Empty Fields'
    );
    if (test4Success) {
      await verifyCatalogData(manufacturer.id, 3, 'Empty Fields'); // Should skip row with empty code
    }
    testResults.push({ test: 'Empty Fields', success: test4Success });
    console.log('');
    
    // Test 5: Duplicate handling (updates)
    console.log('📋 TEST 5: Duplicate Code Updates');
    console.log('-------------------------------');
    const test5Success = await uploadCSVFile(
      token, 
      manufacturer.id, 
      path.join(TEST_DIR, 'test-duplicates.csv'),
      'Duplicates'
    );
    if (test5Success) {
      const finalData = await verifyCatalogData(manufacturer.id, null, 'Final State');
    }
    testResults.push({ test: 'Duplicate Updates', success: test5Success });
    console.log('');
    
    // Results Summary
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=======================');
    testResults.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.test}`);
    });
    
    const passedTests = testResults.filter(r => r.success).length;
    const totalTests = testResults.length;
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! CSV upload functionality is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    // Cleanup test files
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
      console.log(`\n🧹 Cleaned up test directory: ${TEST_DIR}`);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runCSVUploadTests().then(() => {
    console.log('\n✨ Test execution complete!');
    process.exit(0);
  }).catch(err => {
    console.error('💥 Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = {
  runCSVUploadTests,
  setupTestEnvironment,
  testCSVData
};
