/**
 * Test script to verify sub-type requirements functionality
 * This script tests the database structure, associations, and validation logic
 */

const { Sequelize } = require('sequelize');
const sequelize = require('./config/db');
const { ManufacturerSubType, CatalogSubTypeAssignment, ManufacturerCatalogData } = require('./models');
const { validateSubTypeRequirements } = require('./utils/subTypeValidation');

async function runTests() {
  console.log('\n========================================');
  console.log('Sub-Type Requirements Test Script');
  console.log('========================================\n');

  try {
    // Test 1: Check database connection
    console.log('Test 1: Database Connection');
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Test 2: Check for sub-types in database
    console.log('Test 2: Query Sub-Types');
    const subTypes = await ManufacturerSubType.findAll({
      limit: 5,
      attributes: ['id', 'manufacturer_id', 'name', 'requires_hinge_side', 'requires_exposed_side']
    });
    console.log(`Found ${subTypes.length} sub-types in database:`);
    subTypes.forEach(st => {
      console.log(`  - ID: ${st.id}, Name: "${st.name}", Manufacturer: ${st.manufacturer_id}`);
      console.log(`    Requires Hinge: ${st.requires_hinge_side}, Requires Exposed: ${st.requires_exposed_side}`);
    });
    console.log('');

    // Test 3: Check for catalog assignments
    console.log('Test 3: Query Catalog Assignments');
    const assignments = await CatalogSubTypeAssignment.findAll({
      limit: 5,
      attributes: ['id', 'catalog_data_id', 'sub_type_id']
    });
    console.log(`Found ${assignments.length} catalog assignments:`);
    assignments.forEach(a => {
      console.log(`  - Assignment ID: ${a.id}, Catalog ID: ${a.catalog_data_id}, SubType ID: ${a.sub_type_id}`);
    });
    console.log('');

    // Test 4: Test associations with include
    console.log('Test 4: Test Associations (CatalogSubTypeAssignment -> ManufacturerSubType)');
    const assignmentsWithSubType = await CatalogSubTypeAssignment.findAll({
      limit: 3,
      include: [{
        model: ManufacturerSubType,
        as: 'subType',
        attributes: ['id', 'name', 'manufacturer_id', 'requires_hinge_side', 'requires_exposed_side']
      }]
    });
    console.log(`Found ${assignmentsWithSubType.length} assignments with sub-type data:`);
    assignmentsWithSubType.forEach(a => {
      console.log(`  - Catalog ID: ${a.catalog_data_id}, SubType: ${a.subType?.name || 'NULL'}`);
      if (a.subType) {
        console.log(`    Manufacturer: ${a.subType.manufacturer_id}, Hinge: ${a.subType.requires_hinge_side}, Exposed: ${a.subType.requires_exposed_side}`);
      }
    });
    console.log('');

    // Test 5: Get a real catalog item that has an assignment
    console.log('Test 5: Find Catalog Items with Sub-Type Assignments');
    if (assignmentsWithSubType.length > 0) {
      const testAssignment = assignmentsWithSubType[0];
      const catalogId = testAssignment.catalog_data_id;
      const manufacturerId = testAssignment.subType?.manufacturer_id;

      console.log(`Testing with Catalog ID: ${catalogId}, Manufacturer ID: ${manufacturerId}`);

      const catalogItem = await ManufacturerCatalogData.findByPk(catalogId, {
        attributes: ['id', 'code', 'description', 'type', 'style', 'manufacturerId']
      });

      if (catalogItem) {
        console.log('Catalog Item Details:');
        console.log(`  Code: ${catalogItem.code}`);
        console.log(`  Description: ${catalogItem.description}`);
        console.log(`  Type: ${catalogItem.type}`);
        console.log(`  Manufacturer ID: ${catalogItem.manufacturerId}`);
        console.log('');

        // Test 6: Test the validation function
        console.log('Test 6: Test Validation Function');
        const testItems = [
          {
            id: catalogId,
            catalog_data_id: catalogId,
            code: catalogItem.code,
            description: catalogItem.description,
            // Test without hinge/exposed side first
          }
        ];

        console.log('Testing validation without hinge/exposed side selections...');
        const validationResult1 = await validateSubTypeRequirements(testItems, manufacturerId);
        console.log('Validation Result (no selections):');
        console.log(`  isValid: ${validationResult1.isValid}`);
        console.log(`  Missing Requirements: ${validationResult1.missingRequirements?.length || 0}`);
        console.log(`  All Requirements: ${validationResult1.allRequirements?.length || 0}`);

        if (validationResult1.allRequirements && validationResult1.allRequirements.length > 0) {
          console.log('\nAll Requirements:');
          validationResult1.allRequirements.forEach(req => {
            console.log(`  - Item: ${req.itemName}, Requirement: ${req.requirement}`);
          });
        }

        if (validationResult1.missingRequirements && validationResult1.missingRequirements.length > 0) {
          console.log('\nMissing Requirements:');
          validationResult1.missingRequirements.forEach(req => {
            console.log(`  - Item: ${req.itemName}, Missing: ${req.requirement}`);
          });
        }
        console.log('');

        // Test 7: Test with selections
        console.log('Test 7: Test Validation with Selections');
        const testItems2 = [
          {
            id: catalogId,
            catalog_data_id: catalogId,
            code: catalogItem.code,
            description: catalogItem.description,
            hingeSide: 'Left',
            exposedSide: 'Right'
          }
        ];

        console.log('Testing validation WITH hinge/exposed side selections...');
        const validationResult2 = await validateSubTypeRequirements(testItems2, manufacturerId);
        console.log('Validation Result (with selections):');
        console.log(`  isValid: ${validationResult2.isValid}`);
        console.log(`  Missing Requirements: ${validationResult2.missingRequirements?.length || 0}`);
        console.log(`  All Requirements: ${validationResult2.allRequirements?.length || 0}`);

        if (validationResult2.allRequirements && validationResult2.allRequirements.length > 0) {
          console.log('\nAll Requirements:');
          validationResult2.allRequirements.forEach(req => {
            console.log(`  - Item: ${req.itemName}, Requirement: ${req.requirement}`);
          });
        }
        console.log('');

      } else {
        console.log('✗ Could not find catalog item with ID:', catalogId);
      }
    } else {
      console.log('✗ No assignments found to test with');
    }

    // Test 8: Test direct query to simulate what the API endpoint does
    console.log('Test 8: Simulate API Endpoint Query');
    const testCatalogIds = assignmentsWithSubType.map(a => a.catalog_data_id);
    const testManufacturerId = assignmentsWithSubType[0]?.subType?.manufacturer_id;

    if (testCatalogIds.length > 0 && testManufacturerId) {
      console.log(`Testing with catalog IDs: [${testCatalogIds.join(', ')}]`);
      console.log(`Manufacturer ID: ${testManufacturerId}`);

      const directAssignments = await CatalogSubTypeAssignment.findAll({
        where: {
          catalog_data_id: testCatalogIds
        },
        include: [{
          model: ManufacturerSubType,
          as: 'subType',
          where: {
            manufacturer_id: testManufacturerId
          },
          required: true,
          attributes: ['id', 'name', 'requires_hinge_side', 'requires_exposed_side']
        }]
      });

      console.log(`Found ${directAssignments.length} assignments matching the query`);
      directAssignments.forEach(a => {
        console.log(`  - Catalog ID: ${a.catalog_data_id}`);
        console.log(`    SubType: ${a.subType.name}`);
        console.log(`    Requires Hinge: ${a.subType.requires_hinge_side}`);
        console.log(`    Requires Exposed: ${a.subType.requires_exposed_side}`);
      });
    }

    console.log('\n========================================');
    console.log('All Tests Completed Successfully! ✓');
    console.log('========================================\n');

    // Summary
    console.log('SUMMARY:');
    console.log(`- Sub-Types in DB: ${subTypes.length > 0 ? '✓ Found' : '✗ None'}`);
    console.log(`- Catalog Assignments in DB: ${assignments.length > 0 ? '✓ Found' : '✗ None'}`);
    console.log(`- Association Working: ${assignmentsWithSubType.length > 0 && assignmentsWithSubType[0].subType ? '✓ Yes' : '✗ No'}`);
    console.log('');

    if (subTypes.length === 0) {
      console.log('⚠️  ISSUE: No sub-types found in database');
      console.log('   FIX: Create sub-types via the manufacturer settings page');
    }

    if (assignments.length === 0) {
      console.log('⚠️  ISSUE: No catalog items are assigned to sub-types');
      console.log('   FIX: Assign catalog items to sub-types via the catalog mapping tab');
    }

    if (assignmentsWithSubType.length === 0 || !assignmentsWithSubType[0]?.subType) {
      console.log('⚠️  ISSUE: Association between CatalogSubTypeAssignment and ManufacturerSubType is broken');
      console.log('   FIX: Check models/index.js for proper association setup');
    }

  } catch (error) {
    console.error('\n✗ Test failed with error:', error);
    console.error('\nStack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { runTests };
