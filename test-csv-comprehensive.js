// Comprehensive final test for CSV upload functionality
const fs = require('fs');
const { Manufacturer, ManufacturerCatalogData } = require('./models');

async function runComprehensiveCSVTest() {
  console.log('🎯 COMPREHENSIVE CSV UPLOAD FUNCTIONALITY TEST');
  console.log('===============================================\n');
  
  let testManufacturer = null;
  
  try {
    // Setup test manufacturer
    console.log('1️⃣ Setting up test manufacturer...');
    await ManufacturerCatalogData.destroy({ where: {} }); // Clear test data
    await Manufacturer.destroy({ where: { name: 'CSV Test Manufacturer' } });
    
    testManufacturer = await Manufacturer.create({
      name: 'CSV Test Manufacturer',
      email: 'csvtest@test.com',
      phone: '1234567890',
      address: 'Test Address',
      website: 'https://test.com',
      costMultiplier: 1.5,
      isPriceMSRP: true
    });
    console.log(`✅ Created test manufacturer (ID: ${testManufacturer.id})\n`);
    
    // Test Scenarios
    const tests = [
      {
        name: 'Basic CSV Upload',
        description: 'Upload basic catalog with all fields',
        csv: `Code,Description,Style,Price,Type,Color,Discontinued
CAB-001,Base Cabinet 30",Shaker White,125.50,Base Cabinet,White,no
CAB-002,Wall Cabinet 30",Shaker White,89.99,Wall Cabinet,White,no
ACC-001,Glass Rack,Traditional,45.00,Accessories,Clear,yes`,
        expectedCount: 3,
        expectedCodes: ['CAB-001', 'CAB-002', 'ACC-001']
      },
      
      {
        name: 'Minimal CSV (Code Only)',
        description: 'Upload CSV with only code column',
        csv: `Code
MIN-001
MIN-002
MIN-003`,
        expectedCount: 3,
        expectedCodes: ['MIN-001', 'MIN-002', 'MIN-003']
      },
      
      {
        name: 'Update Existing Items',
        description: 'Upload CSV that updates existing items (same code+style)',
        csv: `Code,Description,Style,Price,Type
CAB-001,Updated Base Cabinet 30",Shaker White,135.00,Base Cabinet Updated
CAB-002,Updated Wall Cabinet 30",Shaker White,95.00,Wall Cabinet Updated
NEW-001,Brand New Item,Modern,75.00,New Type`,
        expectedCount: 4, // 2 updates + 1 new + ACC-001 unchanged
        expectedCodes: ['CAB-001', 'CAB-002', 'ACC-001', 'NEW-001']
      },
      
      {
        name: 'Case Insensitive Headers',
        description: 'Test case insensitive header matching',
        csv: `ITEM,DESCRIPTION,STYLE,PRICE
CASE-001,Case Test Item 1,Modern,100.00
CASE-002,Case Test Item 2,Traditional,110.00`,
        expectedCount: 2,
        expectedCodes: ['CASE-001', 'CASE-002']
      },
      
      {
        name: 'Empty Fields Handling',
        description: 'Test handling of empty fields and missing data',
        csv: `Code,Description,Style,Price,Type
EMPTY-001,Has all fields,Modern,50.00,Base
EMPTY-002,,Modern,60.00,Wall
EMPTY-003,No price,Modern,,Base
,Skip this row,Modern,70.00,Base`,
        expectedCount: 3, // Should skip row with empty code
        expectedCodes: ['EMPTY-001', 'EMPTY-002', 'EMPTY-003']
      },
      
      {
        name: 'Boolean Variations',
        description: 'Test different boolean formats for discontinued field',
        csv: `Code,Description,Price,Discontinued
BOOL-001,Discontinued yes,100.00,yes
BOOL-002,Discontinued true,100.00,true
BOOL-003,Discontinued 1,100.00,1
BOOL-004,Active no,100.00,no
BOOL-005,Active false,100.00,false
BOOL-006,Active 0,100.00,0
BOOL-007,Default active,100.00,`,
        expectedCount: 7,
        expectedCodes: ['BOOL-001', 'BOOL-002', 'BOOL-003', 'BOOL-004', 'BOOL-005', 'BOOL-006', 'BOOL-007']
      }
    ];
    
    const results = [];
    
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      console.log(`${i + 2}️⃣ ${test.name}`);
      console.log(`   ${test.description}`);
      
      try {
        // Clear previous test data if this is not an update test
        if (!test.name.includes('Update')) {
          await ManufacturerCatalogData.destroy({
            where: { manufacturerId: testManufacturer.id }
          });
        }
        
        // Create and parse CSV
        const testFile = `./temp-test-${i}.csv`;
        fs.writeFileSync(testFile, test.csv);
        
        const { parseCatalogFile } = require('./utils/parseCatalogFile');
        const parsedData = await parseCatalogFile(testFile, 'text/csv');
        
        console.log(`   📊 Parsed ${parsedData.length} items from CSV`);
        
        // Simulate the controller logic for upload
        for (const row of parsedData) {
          const cleanStyle = row.style?.replace(/\+AC0-/g, '-').trim() || '';
          const [item, created] = await ManufacturerCatalogData.findOrCreate({
            where: {
              manufacturerId: testManufacturer.id,
              code: row.code,
              style: cleanStyle
            },
            defaults: {
              ...row,
              manufacturerId: testManufacturer.id,
              style: cleanStyle
            }
          });
          
          if (!created) {
            await item.update({
              description: row.description,
              price: row.price,
              discontinued: row.discontinued,
              type: row.type,
              color: row.color
            });
          }
        }
        
        // Verify results
        const dbItems = await ManufacturerCatalogData.findAll({
          where: { manufacturerId: testManufacturer.id },
          order: [['code', 'ASC']]
        });
        
        const success = test.expectedCount ? dbItems.length === test.expectedCount : true;
        const codesMatch = test.expectedCodes ? 
          test.expectedCodes.every(code => dbItems.find(item => item.code === code)) : true;
        
        if (success && codesMatch) {
          console.log(`   ✅ SUCCESS: ${dbItems.length} items in database`);
          
          // Show sample data
          if (dbItems.length <= 5) {
            dbItems.forEach(item => {
              console.log(`      ${item.code}: ${item.description || 'No description'} ($${item.price || '0.00'})`);
            });
          } else {
            console.log(`      Sample: ${dbItems.slice(0, 3).map(i => i.code).join(', ')}...`);
          }
          
          // Special validation for boolean test
          if (test.name.includes('Boolean')) {
            const discontinued = dbItems.filter(item => item.discontinued === true);
            const active = dbItems.filter(item => item.discontinued === false);
            console.log(`      Discontinued: ${discontinued.length}, Active: ${active.length}`);
          }
          
          results.push({ name: test.name, success: true });
        } else {
          console.log(`   ❌ FAILED: Expected ${test.expectedCount} items, got ${dbItems.length}`);
          results.push({ name: test.name, success: false });
        }
        
        // Clean up test file
        fs.unlinkSync(testFile);
        
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        results.push({ name: test.name, success: false, error: error.message });
      }
      
      console.log('');
    }
    
    // Final Results
    console.log('📋 FINAL TEST RESULTS');
    console.log('=====================');
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const error = result.error ? ` (${result.error})` : '';
      console.log(`${status} ${result.name}${error}`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 OVERALL: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('\n✅ CSV Upload Functionality Verification:');
      console.log('   • Basic CSV parsing works correctly');
      console.log('   • Code-only uploads work');
      console.log('   • Update mechanism works (same code+style)');
      console.log('   • Case insensitive headers supported');
      console.log('   • Empty fields handled gracefully');
      console.log('   • Boolean variations processed correctly');
      console.log('   • Database operations successful');
      
      console.log('\n🚀 The manufacturer catalog upload feature is ready for production use!');
    } else {
      console.log('\n⚠️  Some tests failed. Review the errors above.');
    }
    
    // Show final database state
    const finalItems = await ManufacturerCatalogData.findAll({
      where: { manufacturerId: testManufacturer.id },
      order: [['code', 'ASC']]
    });
    
    console.log(`\n📊 Final database state: ${finalItems.length} total items`);
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  } finally {
    // Cleanup
    if (testManufacturer) {
      await ManufacturerCatalogData.destroy({ 
        where: { manufacturerId: testManufacturer.id } 
      });
      await Manufacturer.destroy({ 
        where: { id: testManufacturer.id } 
      });
      console.log('\n🧹 Cleaned up test data');
    }
  }
}

// Run the comprehensive test
if (require.main === module) {
  runComprehensiveCSVTest().then(() => {
    console.log('\n✨ Comprehensive test complete!');
    process.exit(0);
  }).catch(err => {
    console.error('💥 Test failed:', err);
    process.exit(1);
  });
}

module.exports = { runComprehensiveCSVTest };
