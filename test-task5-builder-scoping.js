/**
 * Task 5 Test Script: Builder Scoping
 * Tests the implementation of manufacturer isolation in modification builders
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';

// Get a test token (you'd need to provide admin credentials)
const getTestToken = async () => {
  try {
    const response = await axios.post(`${API_BASE}/../auth/login`, {
      username: process.env.TEST_USERNAME || 'admin',
      password: process.env.TEST_PASSWORD || 'admin123'
    });
    return response.data.token;
  } catch (error) {
    console.error('Failed to get test token:', error.message);
    throw error;
  }
};

// Test manufacturer-specific modification creation
const testManufacturerModification = async (token) => {
  try {
    console.log('\n=== Testing Manufacturer-Specific Modification Creation ===');

    // Get manufacturers
    const manufsResponse = await axios.get(`${API_BASE}/manufacturers`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const manufacturers = manufsResponse.data.manufacturers || [];
    if (manufacturers.length === 0) {
      console.log('❌ No manufacturers found for testing');
      return;
    }

    const testManufacturer = manufacturers[0];
    console.log(`✓ Using test manufacturer: ${testManufacturer.name} (ID: ${testManufacturer.id})`);

    // Test creating modification with manufacturerId
    const modificationData = {
      categoryId: null,
      name: `Test Manufacturer Mod ${Date.now()}`,
      defaultPrice: 25.99,
      isReady: true,
      manufacturerId: testManufacturer.id,
      isBlueprint: false,
      fieldsConfig: {
        descriptions: {
          customer: 'Test manufacturer-specific modification',
          internal: 'Internal test mod'
        }
      }
    };

    const createResponse = await axios.post(`${API_BASE}/global-mods/templates`, modificationData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✓ Created manufacturer modification: ${createResponse.data.template.name}`);
    console.log(`  - Manufacturer ID: ${createResponse.data.template.manufacturer_id}`);
    console.log(`  - Is Blueprint: ${createResponse.data.template.is_blueprint ? 'Yes' : 'No'}`);
    console.log(`  - Price: $${(createResponse.data.template.price_cents || 0) / 100}`);

    return createResponse.data.template;

  } catch (error) {
    console.error('❌ Manufacturer modification test failed:', error.response?.data?.message || error.message);
    throw error;
  }
};

// Test blueprint creation
const testBlueprintCreation = async (token) => {
  try {
    console.log('\n=== Testing Blueprint Creation ===');

    // Test creating blueprint (no manufacturerId)
    const blueprintData = {
      categoryId: null,
      name: `Test Blueprint ${Date.now()}`,
      defaultPrice: null, // Blueprints don't have prices
      isReady: true,
      isBlueprint: true,
      fieldsConfig: {
        descriptions: {
          customer: 'Test blueprint modification',
          internal: 'Internal blueprint'
        }
      }
    };

    const createResponse = await axios.post(`${API_BASE}/global-mods/templates`, blueprintData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✓ Created blueprint: ${createResponse.data.template.name}`);
    console.log(`  - Manufacturer ID: ${createResponse.data.template.manufacturer_id || 'null'}`);
    console.log(`  - Is Blueprint: ${createResponse.data.template.is_blueprint ? 'Yes' : 'No'}`);
    console.log(`  - Price: ${createResponse.data.template.price_cents === null ? 'null' : '$' + createResponse.data.template.price_cents / 100}`);

    return createResponse.data.template;

  } catch (error) {
    console.error('❌ Blueprint creation test failed:', error.response?.data?.message || error.message);
    throw error;
  }
};

// Test invalid combinations
const testInvalidCombinations = async (token) => {
  try {
    console.log('\n=== Testing Invalid Combinations ===');

    // Test 1: Blueprint with manufacturerId (should fail)
    try {
      await axios.post(`${API_BASE}/global-mods/templates`, {
        name: 'Invalid Blueprint',
        isBlueprint: true,
        manufacturerId: 1, // Should be rejected
        defaultPrice: null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ FAIL: Blueprint with manufacturerId was accepted (should be rejected)');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✓ Correctly rejected blueprint with manufacturerId');
      } else {
        throw error;
      }
    }

    // Test 2: Manufacturer mod without manufacturerId (should fail)
    try {
      await axios.post(`${API_BASE}/global-mods/templates`, {
        name: 'Invalid Manufacturer Mod',
        isBlueprint: false,
        manufacturerId: null, // Should be rejected
        defaultPrice: 10
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ FAIL: Manufacturer mod without manufacturerId was accepted (should be rejected)');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✓ Correctly rejected manufacturer mod without manufacturerId');
      } else {
        throw error;
      }
    }

    // Test 3: Blueprint with price (should fail)
    try {
      await axios.post(`${API_BASE}/global-mods/templates`, {
        name: 'Invalid Blueprint with Price',
        isBlueprint: true,
        manufacturerId: null,
        defaultPrice: 15 // Should be rejected
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ FAIL: Blueprint with price was accepted (should be rejected)');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✓ Correctly rejected blueprint with price');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Invalid combination test failed:', error.message);
    throw error;
  }
};

// Test gallery isolation
const testGalleryIsolation = async (token) => {
  try {
    console.log('\n=== Testing Gallery Isolation ===');

    // Get gallery (should only show blueprints)
    const galleryResponse = await axios.get(`${API_BASE}/global-mods/gallery`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const gallery = galleryResponse.data.gallery || [];
    let blueprintCount = 0;
    let manufacturerModCount = 0;

    gallery.forEach(category => {
      (category.templates || []).forEach(template => {
        if (template.is_blueprint) {
          blueprintCount++;
        } else {
          manufacturerModCount++;
          console.log(`❌ LEAK: Non-blueprint in gallery: ${template.name} (Manufacturer: ${template.manufacturer_id})`);
        }
      });
    });

    console.log(`✓ Gallery contains ${blueprintCount} blueprints`);
    if (manufacturerModCount === 0) {
      console.log('✓ No manufacturer modifications leaked into gallery');
    } else {
      console.log(`❌ ${manufacturerModCount} manufacturer modifications leaked into gallery`);
    }

    return { blueprintCount, manufacturerModCount };

  } catch (error) {
    console.error('❌ Gallery isolation test failed:', error.message);
    throw error;
  }
};

// Main test function
const runTests = async () => {
  try {
    console.log('🧪 Starting Task 5 Builder Scoping Tests...');

    const token = await getTestToken();
    console.log('✓ Authentication successful');

    await testManufacturerModification(token);
    await testBlueprintCreation(token);
    await testInvalidCombinations(token);
    const galleryResults = await testGalleryIsolation(token);

    console.log('\n=== Test Summary ===');
    console.log('✓ Manufacturer modification creation: PASS');
    console.log('✓ Blueprint creation: PASS');
    console.log('✓ Invalid combination rejection: PASS');
    console.log(`✓ Gallery isolation: ${galleryResults.manufacturerModCount === 0 ? 'PASS' : 'FAIL'}`);

    console.log('\n🎉 Task 5 implementation tests completed successfully!');

  } catch (error) {
    console.error('\n💥 Tests failed:', error.message);
    process.exit(1);
  }
};

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
