/**
 * Task 9: Comprehensive API Test Scripts
 * Tests all modification gallery endpoints and business logic
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';

// Test configuration
const testConfig = {
  timeout: 30000,
  maxRetries: 3,
  adminCredentials: {
    username: process.env.TEST_ADMIN_USERNAME || 'admin',
    password: process.env.TEST_ADMIN_PASSWORD || 'admin123'
  }
};

// Global test state
let testToken = null;
let testManufacturer = null;
let testCategory = null;
let testBlueprint = null;
let testManufacturerMod = null;

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString().substring(11, 19);
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Authentication
const authenticate = async () => {
  try {
    log('Authenticating test user...');
    const response = await axios.post(`${API_BASE}/../auth/login`, testConfig.adminCredentials);
    testToken = response.data.token;
    if (!testToken) throw new Error('No token received');
    log('Authentication successful', 'success');
    return testToken;
  } catch (error) {
    log(`Authentication failed: ${error.response?.data?.message || error.message}`, 'error');
    throw error;
  }
};

// Setup test data
const setupTestData = async () => {
  try {
    log('Setting up test data...');

    // Get or create a test manufacturer
    const manufsResponse = await axios.get(`${API_BASE}/manufacturers`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });

    const manufacturers = manufsResponse.data.manufacturers || [];
    testManufacturer = manufacturers.find(m => m.name.includes('Test')) || manufacturers[0];

    if (!testManufacturer) {
      throw new Error('No manufacturers found for testing');
    }

    log(`Using test manufacturer: ${testManufacturer.name} (ID: ${testManufacturer.id})`, 'success');

  } catch (error) {
    log(`Setup failed: ${error.response?.data?.message || error.message}`, 'error');
    throw error;
  }
};

// Test 1: Gallery Management
const testGalleryManagement = async () => {
  log('\n=== Test 1: Gallery Management ===');

  try {
    // Test GET /api/global-mods/gallery
    log('Testing gallery retrieval...');
    const galleryResponse = await axios.get(`${API_BASE}/global-mods/gallery`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });

    const gallery = galleryResponse.data.gallery || [];
    log(`Gallery contains ${gallery.length} categories`, 'success');

    // Verify gallery only contains blueprints
    let blueprintCount = 0;
    let nonBlueprintCount = 0;

    gallery.forEach(category => {
      (category.templates || []).forEach(template => {
        if (template.is_blueprint) {
          blueprintCount++;
        } else {
          nonBlueprintCount++;
          log(`LEAK: Non-blueprint in gallery: ${template.name} (Manufacturer: ${template.manufacturer_id})`, 'error');
        }
      });
    });

    if (nonBlueprintCount === 0) {
      log(`Gallery isolation verified: ${blueprintCount} blueprints, no manufacturer mods leaked`, 'success');
    } else {
      log(`Gallery isolation FAILED: ${nonBlueprintCount} non-blueprints found`, 'error');
    }

    return { passed: nonBlueprintCount === 0, details: { blueprintCount, nonBlueprintCount } };

  } catch (error) {
    log(`Gallery management test failed: ${error.response?.data?.message || error.message}`, 'error');
    return { passed: false, error: error.message };
  }
};

// Test 2: Category CRUD Operations
const testCategoryCrud = async () => {
  log('\n=== Test 2: Category CRUD Operations ===');

  try {
    // Test POST /api/global-mods/categories (gallery category)
    log('Testing category creation...');
    const categoryData = {
      name: `Test Gallery Category ${Date.now()}`,
      scope: 'gallery',
      orderIndex: 999
    };

    const createResponse = await axios.post(`${API_BASE}/global-mods/categories`, categoryData, {
      headers: { Authorization: `Bearer ${testToken}` }
    });

    testCategory = createResponse.data.category;
    log(`Created category: ${testCategory.name} (ID: ${testCategory.id})`, 'success');

    // Test PUT /api/global-mods/categories/:id
    log('Testing category update...');
    const updateData = {
      name: `${testCategory.name} (Updated)`,
      orderIndex: 1000
    };

    await axios.put(`${API_BASE}/global-mods/categories/${testCategory.id}`, updateData, {
      headers: { Authorization: `Bearer ${testToken}` }
    });

    log('Category updated successfully', 'success');

    // Test GET /api/global-mods/categories
    log('Testing category retrieval...');
    const getResponse = await axios.get(`${API_BASE}/global-mods/categories?scope=gallery`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });

    const categories = getResponse.data.categories || [];
    const foundCategory = categories.find(c => c.id === testCategory.id);

    if (foundCategory && foundCategory.name === updateData.name) {
      log('Category retrieval and update verification successful', 'success');
    } else {
      log('Category update verification failed', 'error');
      return { passed: false };
    }

    return { passed: true };

  } catch (error) {
    log(`Category CRUD test failed: ${error.response?.data?.message || error.message}`, 'error');
    return { passed: false, error: error.message };
  }
};

// Test 3: Template CRUD with Isolation
const testTemplateCrud = async () => {
  log('\n=== Test 3: Template CRUD with Isolation ===');

  try {
    // Test creating a blueprint
    log('Testing blueprint creation...');
    const blueprintData = {
      categoryId: testCategory.id,
      name: `Test Blueprint ${Date.now()}`,
      isReady: true,
      isBlueprint: true,
      fieldsConfig: {
        descriptions: {
          customer: 'Test blueprint for API testing',
          internal: 'Internal test blueprint'
        }
      }
    };

    const blueprintResponse = await axios.post(`${API_BASE}/global-mods/templates`, blueprintData, {
      headers: { Authorization: `Bearer ${testToken}` }
    });

    testBlueprint = blueprintResponse.data.template;
    log(`Created blueprint: ${testBlueprint.name} (ID: ${testBlueprint.id})`, 'success');

    // Verify blueprint properties
    if (!testBlueprint.is_blueprint) {
      log('Blueprint is_blueprint flag is incorrect', 'error');
      return { passed: false };
    }

    if (testBlueprint.manufacturer_id !== null) {
      log('Blueprint has manufacturer_id (should be null)', 'error');
      return { passed: false };
    }

    if (testBlueprint.price_cents !== null) {
      log('Blueprint has price_cents (should be null)', 'error');
      return { passed: false };
    }

    log('Blueprint properties verified', 'success');

    // Test creating a manufacturer modification
    log('Testing manufacturer modification creation...');
    const modData = {
      categoryId: testCategory.id,
      name: `Test Manufacturer Mod ${Date.now()}`,
      isReady: true,
      isBlueprint: false,
      manufacturerId: testManufacturer.id,
      defaultPrice: 25.99,
      fieldsConfig: {
        descriptions: {
          customer: 'Test manufacturer-specific modification',
          internal: 'Internal manufacturer test mod'
        }
      }
    };

    const modResponse = await axios.post(`${API_BASE}/global-mods/templates`, modData, {
      headers: { Authorization: `Bearer ${testToken}` }
    });

    testManufacturerMod = modResponse.data.template;
    log(`Created manufacturer mod: ${testManufacturerMod.name} (ID: ${testManufacturerMod.id})`, 'success');

    // Verify manufacturer mod properties
    if (testManufacturerMod.is_blueprint) {
      log('Manufacturer mod is_blueprint flag is incorrect', 'error');
      return { passed: false };
    }

    if (testManufacturerMod.manufacturer_id !== testManufacturer.id) {
      log('Manufacturer mod has incorrect manufacturer_id', 'error');
      return { passed: false };
    }

    if (testManufacturerMod.price_cents === null) {
      log('Manufacturer mod missing price_cents', 'error');
      return { passed: false };
    }

    log('Manufacturer modification properties verified', 'success');

    return { passed: true };

  } catch (error) {
    log(`Template CRUD test failed: ${error.response?.data?.message || error.message}`, 'error');
    return { passed: false, error: error.message };
  }
};

// Test 4: Invalid Combinations
const testInvalidCombinations = async () => {
  log('\n=== Test 4: Invalid Combinations ===');

  try {
    let testsPassedCount = 0;
    const totalTests = 3;

    // Test 1: Blueprint with manufacturerId (should fail)
    try {
      await axios.post(`${API_BASE}/global-mods/templates`, {
        name: 'Invalid Blueprint with Manufacturer',
        isBlueprint: true,
        manufacturerId: testManufacturer.id,
        categoryId: testCategory.id
      }, {
        headers: { Authorization: `Bearer ${testToken}` }
      });
      log('FAIL: Blueprint with manufacturerId was accepted (should be rejected)', 'error');
    } catch (error) {
      if (error.response?.status === 400) {
        log('✓ Correctly rejected blueprint with manufacturerId', 'success');
        testsPassedCount++;
      } else {
        log(`Unexpected error: ${error.message}`, 'error');
      }
    }

    // Test 2: Manufacturer mod without manufacturerId (should fail)
    try {
      await axios.post(`${API_BASE}/global-mods/templates`, {
        name: 'Invalid Manufacturer Mod without ID',
        isBlueprint: false,
        manufacturerId: null,
        defaultPrice: 10,
        categoryId: testCategory.id
      }, {
        headers: { Authorization: `Bearer ${testToken}` }
      });
      log('FAIL: Manufacturer mod without manufacturerId was accepted (should be rejected)', 'error');
    } catch (error) {
      if (error.response?.status === 400) {
        log('✓ Correctly rejected manufacturer mod without manufacturerId', 'success');
        testsPassedCount++;
      } else {
        log(`Unexpected error: ${error.message}`, 'error');
      }
    }

    // Test 3: Blueprint with price (should fail)
    try {
      await axios.post(`${API_BASE}/global-mods/templates`, {
        name: 'Invalid Blueprint with Price',
        isBlueprint: true,
        manufacturerId: null,
        priceCents: 1500,
        categoryId: testCategory.id
      }, {
        headers: { Authorization: `Bearer ${testToken}` }
      });
      log('FAIL: Blueprint with price was accepted (should be rejected)', 'error');
    } catch (error) {
      if (error.response?.status === 400) {
        log('✓ Correctly rejected blueprint with price', 'success');
        testsPassedCount++;
      } else {
        log(`Unexpected error: ${error.message}`, 'error');
      }
    }

    return { passed: testsPassedCount === totalTests, details: { passed: testsPassedCount, total: totalTests } };

  } catch (error) {
    log(`Invalid combinations test failed: ${error.message}`, 'error');
    return { passed: false, error: error.message };
  }
};

// Test 5: Manufacturer Isolation
const testManufacturerIsolation = async () => {
  log('\n=== Test 5: Manufacturer Isolation ===');

  try {
    // Test GET /api/global-mods/manufacturer/:id
    log('Testing manufacturer-specific modifications retrieval...');
    const manufacturerModsResponse = await axios.get(`${API_BASE}/global-mods/manufacturer/${testManufacturer.id}`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });

    const manufacturerCategories = manufacturerModsResponse.data.categories || [];
    log(`Manufacturer has ${manufacturerCategories.length} categories`);

    // Verify isolation
    let correctlyIsolated = true;
    manufacturerCategories.forEach(category => {
      (category.templates || []).forEach(template => {
        if (template.manufacturer_id !== testManufacturer.id && !template.is_blueprint) {
          log(`ISOLATION LEAK: Template ${template.name} (ID: ${template.id}) has manufacturer_id: ${template.manufacturer_id}`, 'error');
          correctlyIsolated = false;
        }
      });
    });

    if (correctlyIsolated) {
      log('Manufacturer isolation verified', 'success');
    } else {
      log('Manufacturer isolation FAILED', 'error');
    }

    // Test blueprint usage endpoint
    if (testBlueprint) {
      log('Testing blueprint usage endpoint...');
      const useResponse = await axios.post(`${API_BASE}/global-mods/gallery/${testBlueprint.id}/use-here`, {
        manufacturerId: testManufacturer.id
      }, {
        headers: { Authorization: `Bearer ${testToken}` }
      });

      const newTemplate = useResponse.data.template;
      if (newTemplate && newTemplate.manufacturer_id === testManufacturer.id && !newTemplate.is_blueprint) {
        log('Blueprint usage endpoint works correctly', 'success');
      } else {
        log('Blueprint usage endpoint failed', 'error');
        correctlyIsolated = false;
      }
    }

    return { passed: correctlyIsolated };

  } catch (error) {
    log(`Manufacturer isolation test failed: ${error.response?.data?.message || error.message}`, 'error');
    return { passed: false, error: error.message };
  }
};

// Test 6: Category Delete Operations
const testCategoryDelete = async () => {
  log('\n=== Test 6: Category Delete Operations ===');

  try {
    // Test delete with mode=move
    if (testCategory && testBlueprint) {
      log('Testing category delete with move operation...');

      // First, get another category to move to
      const galleryResponse = await axios.get(`${API_BASE}/global-mods/gallery`, {
        headers: { Authorization: `Bearer ${testToken}` }
      });

      const gallery = galleryResponse.data.gallery || [];
      const targetCategory = gallery.find(cat => cat.id !== testCategory.id);

      if (targetCategory) {
        const deleteResponse = await axios.delete(`${API_BASE}/global-mods/categories/${testCategory.id}?mode=move&moveToCategoryId=${targetCategory.id}`, {
          headers: { Authorization: `Bearer ${testToken}` }
        });

        if (deleteResponse.status === 200) {
          log('Category delete with move operation successful', 'success');

          // Verify the template was moved
          const updatedGalleryResponse = await axios.get(`${API_BASE}/global-mods/gallery`, {
            headers: { Authorization: `Bearer ${testToken}` }
          });

          const updatedGallery = updatedGalleryResponse.data.gallery || [];
          const updatedTargetCategory = updatedGallery.find(cat => cat.id === targetCategory.id);
          const movedTemplate = (updatedTargetCategory?.templates || []).find(t => t.id === testBlueprint.id);

          if (movedTemplate) {
            log('Template successfully moved to target category', 'success');
            return { passed: true };
          } else {
            log('Template was not found in target category', 'error');
            return { passed: false };
          }
        }
      } else {
        log('No target category available for move test', 'warning');
        return { passed: true, skipped: true };
      }
    }

    return { passed: true };

  } catch (error) {
    log(`Category delete test failed: ${error.response?.data?.message || error.message}`, 'error');
    return { passed: false, error: error.message };
  }
};

// Cleanup test data
const cleanup = async () => {
  log('\n=== Cleanup ===');

  try {
    // Delete test templates
    if (testManufacturerMod) {
      await axios.delete(`${API_BASE}/global-mods/templates/${testManufacturerMod.id}`, {
        headers: { Authorization: `Bearer ${testToken}` }
      });
      log(`Deleted test manufacturer mod: ${testManufacturerMod.name}`, 'success');
    }

    // Note: testBlueprint might have been moved/deleted in the delete test
    // Note: testCategory might have been deleted in the delete test

    log('Cleanup completed', 'success');

  } catch (error) {
    log(`Cleanup warning: ${error.response?.data?.message || error.message}`, 'warning');
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🧪 Starting Comprehensive API Test Suite for Modification Gallery System');
  console.log('═'.repeat(80));

  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: {}
  };

  try {
    // Setup
    await authenticate();
    await setupTestData();

    // Run tests
    const tests = [
      { name: 'Gallery Management', fn: testGalleryManagement },
      { name: 'Category CRUD Operations', fn: testCategoryCrud },
      { name: 'Template CRUD with Isolation', fn: testTemplateCrud },
      { name: 'Invalid Combinations', fn: testInvalidCombinations },
      { name: 'Manufacturer Isolation', fn: testManufacturerIsolation },
      { name: 'Category Delete Operations', fn: testCategoryDelete }
    ];

    for (const test of tests) {
      testResults.total++;
      const result = await test.fn();
      testResults.details[test.name] = result;

      if (result.passed) {
        testResults.passed++;
        log(`${test.name}: PASSED`, 'success');
      } else {
        testResults.failed++;
        log(`${test.name}: FAILED`, 'error');
        if (result.error) {
          log(`  Error: ${result.error}`, 'error');
        }
      }
    }

    // Cleanup
    await cleanup();

  } catch (error) {
    log(`Test suite setup failed: ${error.message}`, 'error');
    process.exit(1);
  }

  // Results summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! The modification gallery system is working correctly.');
  } else {
    console.log('\n💥 Some tests failed. Please review the errors above.');
  }

  console.log('═'.repeat(80));

  return testResults.failed === 0;
};

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`Test suite crashed: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runAllTests };
