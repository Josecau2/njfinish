#!/usr/bin/env node

/**
 * Comprehensive Category Management Test
 * Tests all scoping, CRUD, merge, reassign, and delete operations
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api/global-mods';

// Mock auth headers (adjust as needed for your setup)
const AUTH_HEADERS = {
  'Authorization': 'Bearer test-token',
  'X-Tenant-Id': '1',
  'Content-Type': 'application/json'
};

let testResults = {
  passed: 0,
  failed: 0,
  details: []
};

function log(message) {
  console.log(`[TEST] ${message}`);
  testResults.details.push(message);
}

function assert(condition, message) {
  if (condition) {
    testResults.passed++;
    log(`✅ PASS: ${message}`);
  } else {
    testResults.failed++;
    log(`❌ FAIL: ${message}`);
  }
}

async function apiCall(method, url, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: AUTH_HEADERS,
      data
    };
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

async function runTests() {
  console.log('🚀 Starting Category Management Tests...\n');

  // Test 1: Create Gallery Category
  log('Test 1: Creating gallery category');
  const galleryCategory = await apiCall('POST', '/categories', {
    name: 'Test Gallery Category',
    scope: 'gallery',
    description: 'Test gallery category for blueprints'
  });
  assert(galleryCategory.success, 'Gallery category creation');
  const galleryCategoryId = galleryCategory.success ? galleryCategory.data.category?.id : null;

  // Test 2: Create Manufacturer Category
  log('Test 2: Creating manufacturer category');
  const manufacturerCategory = await apiCall('POST', '/categories', {
    name: 'Test Manufacturer Category',
    scope: 'manufacturer',
    manufacturerId: 1,
    description: 'Test manufacturer category'
  });
  assert(manufacturerCategory.success, 'Manufacturer category creation');
  const manufacturerCategoryId = manufacturerCategory.success ? manufacturerCategory.data.category?.id : null;

  // Test 3: Test duplicate name handling
  log('Test 3: Testing duplicate name handling');
  const duplicateCategory = await apiCall('POST', '/categories', {
    name: 'Test Gallery Category', // Same name as Test 1
    scope: 'gallery'
  });
  assert(!duplicateCategory.success && duplicateCategory.status === 409, 'Duplicate name returns 409 error');
  assert(duplicateCategory.error?.message?.includes('already exists'), 'Duplicate error message mentions "already exists"');

  // Test 4: Get Gallery Categories
  log('Test 4: Getting gallery categories');
  const galleryCategories = await apiCall('GET', '/categories?scope=gallery');
  assert(galleryCategories.success, 'Gallery categories retrieval');
  assert(galleryCategories.data?.categories?.some(c => c.id === galleryCategoryId), 'Gallery category appears in gallery list');

  // Test 5: Get Manufacturer Categories
  log('Test 5: Getting manufacturer categories');
  const manufacturerCategories = await apiCall('GET', '/categories?scope=manufacturer&manufacturerId=1');
  assert(manufacturerCategories.success, 'Manufacturer categories retrieval');
  assert(manufacturerCategories.data?.categories?.some(c => c.id === manufacturerCategoryId), 'Manufacturer category appears in manufacturer list');

  // Test 6: Scope Isolation (gallery categories shouldn't appear in manufacturer list)
  log('Test 6: Testing scope isolation');
  const manufacturerList = manufacturerCategories.data?.categories || [];
  const galleryList = galleryCategories.data?.categories || [];
  assert(!manufacturerList.some(c => c.id === galleryCategoryId), 'Gallery category does not appear in manufacturer list');
  assert(!galleryList.some(c => c.id === manufacturerCategoryId), 'Manufacturer category does not appear in gallery list');

  // Test 7: Update Category
  log('Test 7: Updating category');
  const updateCategory = await apiCall('PUT', `/categories/${galleryCategoryId}`, {
    name: 'Updated Gallery Category',
    description: 'Updated description'
  });
  assert(updateCategory.success, 'Category update');

  // Test 8: Create Second Gallery Category for Merge Test
  log('Test 8: Creating second gallery category for merge test');
  const galleryCategory2 = await apiCall('POST', '/categories', {
    name: 'Test Gallery Category 2',
    scope: 'gallery',
    description: 'Second gallery category for merge test'
  });
  assert(galleryCategory2.success, 'Second gallery category creation');
  const galleryCategoryId2 = galleryCategory2.success ? galleryCategory2.data.category?.id : null;

  // Test 9: Create a Template in the First Category
  log('Test 9: Creating template in first category');
  const template = await apiCall('POST', '/templates', {
    name: 'Test Blueprint',
    category_id: galleryCategoryId,
    is_blueprint: 1,
    manufacturer_id: null,
    price_cents: null,
    fields_config: { test: 'data' }
  });
  assert(template.success, 'Template creation');
  const templateId = template.success ? template.data.template?.id : null;

  // Test 10: Reassign Template to Second Category
  log('Test 10: Reassigning template to second category');
  const reassign = await apiCall('PATCH', `/templates/${templateId}/reassign-category`, {
    category_id: galleryCategoryId2
  });
  assert(reassign.success, 'Template reassignment');

  // Test 11: Merge Categories
  log('Test 11: Merging categories');
  const merge = await apiCall('POST', `/categories/${galleryCategoryId2}/merge-into/${galleryCategoryId}`);
  assert(merge.success, 'Category merge');

  // Test 12: Verify Merge Results
  log('Test 12: Verifying merge results');
  const categoriesAfterMerge = await apiCall('GET', '/categories?scope=gallery');
  assert(categoriesAfterMerge.success, 'Categories retrieval after merge');
  const remainingCategories = categoriesAfterMerge.data?.categories || [];
  assert(!remainingCategories.some(c => c.id === galleryCategoryId2), 'Source category deleted after merge');
  assert(remainingCategories.some(c => c.id === galleryCategoryId), 'Target category still exists after merge');

  // Test 13: Delete Category (Only Mode - Should Fail if Not Empty)
  log('Test 13: Testing delete category "only" mode');
  const deleteOnly = await apiCall('DELETE', `/categories/${galleryCategoryId}?mode=only`);
  assert(!deleteOnly.success && deleteOnly.status === 400, 'Delete "only" mode fails when category is not empty');

  // Test 14: Delete Category with Mods
  log('Test 14: Deleting category with mods');
  const deleteWithMods = await apiCall('DELETE', `/categories/${galleryCategoryId}?mode=withMods`);
  assert(deleteWithMods.success, 'Delete category with mods');

  // Test 15: Cleanup - Delete Manufacturer Category
  log('Test 15: Cleaning up manufacturer category');
  const cleanupManufacturer = await apiCall('DELETE', `/categories/${manufacturerCategoryId}?mode=only`);
  assert(cleanupManufacturer.success, 'Cleanup manufacturer category');

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📝 Total: ${testResults.passed + testResults.failed}`);

  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Category management system is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the implementation.');
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
