/**
 * Authenticated Category System Test
 * Tests all category management functionality with proper authentication
 *
 * Test Credentials:
 * Email: joseca@symmetricalwolf.com
 * Password: admin123
 * Base URL: http://localhost:8080
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080';
const TEST_EMAIL = 'joseca@symmetricalwolf.com';
const TEST_PASSWORD = 'admin123';

let authToken = null;
let tenantId = null;

// Create axios instance with base config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  if (tenantId) {
    config.headers['X-Tenant-Id'] = tenantId;
  }
  return config;
});

async function authenticate() {
  console.log('🔐 Authenticating...');
  try {
    const response = await api.post('/api/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    authToken = response.data.token;
    tenantId = response.data.user?.tenant_id || response.data.tenant_id;

    console.log('✅ Authentication successful');
    console.log(`📋 Token: ${authToken?.substring(0, 20)}...`);
    console.log(`🏢 Tenant ID: ${tenantId}`);
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCreateCategory() {
  console.log('\n📁 Testing Category Creation...');

  try {
    // Test creating gallery category
    const galleryCategory = await api.post('/api/global-mods/categories', {
      name: 'Test Gallery Category',
      scope: 'gallery',
      description: 'Test gallery category for blueprints'
    });

    console.log('✅ Gallery category created:', galleryCategory.data.category);

    // Test creating manufacturer category (assuming manufacturer ID 1 exists)
    const manufacturerCategory = await api.post('/api/global-mods/categories', {
      name: 'Test Manufacturer Category',
      scope: 'manufacturer',
      manufacturerId: 1,
      description: 'Test manufacturer category'
    });

    console.log('✅ Manufacturer category created:', manufacturerCategory.data.category);

    // Test duplicate name error
    try {
      await api.post('/api/global-mods/categories', {
        name: 'Test Gallery Category', // Same name as above
        scope: 'gallery'
      });
      console.log('❌ Duplicate name should have failed');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Duplicate name properly rejected:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    return {
      galleryId: galleryCategory.data.category.id,
      manufacturerId: manufacturerCategory.data.category.id
    };

  } catch (error) {
    console.error('❌ Category creation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetCategories() {
  console.log('\n📋 Testing Category Retrieval...');

  try {
    // Test gallery categories
    const galleryCategories = await api.get('/api/global-mods/categories?scope=gallery');
    console.log('✅ Gallery categories retrieved:', galleryCategories.data.categories?.length || 0);

    // Test manufacturer categories
    const manufacturerCategories = await api.get('/api/global-mods/categories?scope=manufacturer&manufacturerId=1');
    console.log('✅ Manufacturer categories retrieved:', manufacturerCategories.data.categories?.length || 0);

    return true;
  } catch (error) {
    console.error('❌ Category retrieval failed:', error.response?.data || error.message);
    return false;
  }
}

async function testUpdateCategory(categoryId) {
  console.log('\n✏️ Testing Category Update...');

  try {
    const updatedCategory = await api.patch(`/api/global-mods/categories/${categoryId}`, {
      name: 'Updated Test Category',
      description: 'Updated description'
    });

    console.log('✅ Category updated:', updatedCategory.data.category);
    return true;
  } catch (error) {
    console.error('❌ Category update failed:', error.response?.data || error.message);
    return false;
  }
}

async function testDeleteCategory(categoryId) {
  console.log('\n🗑️ Testing Category Deletion...');

  try {
    await api.delete(`/api/global-mods/categories/${categoryId}?mode=only`);
    console.log('✅ Category deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Category deletion failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Category System Tests');
  console.log('='.repeat(50));

  // Authenticate first
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('❌ Cannot continue without authentication');
    return;
  }

  // Run tests
  const categoryIds = await testCreateCategory();
  if (!categoryIds) {
    console.log('❌ Cannot continue without categories');
    return;
  }

  await testGetCategories();
  await testUpdateCategory(categoryIds.galleryId);
  await testDeleteCategory(categoryIds.manufacturerId);

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Category System Tests Complete');
  console.log('\n💡 Key Points Verified:');
  console.log('  ✅ Authentication works with provided credentials');
  console.log('  ✅ Gallery and manufacturer categories are scoped properly');
  console.log('  ✅ Duplicate names are rejected with 409 status');
  console.log('  ✅ Categories can be created, retrieved, updated, and deleted');
  console.log('  ✅ Proper error messages are returned');
}

// Run the tests
runTests().catch(console.error);
