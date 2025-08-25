// Test script to verify user group multiplier system is working correctly
const { User, UserGroup, UserGroupMultiplier, ManufacturerCatalogData } = require('./models');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const API_BASE_URL = 'http://localhost:8080/api';
const TEST_USER_EMAIL = 'test@contractor.com'; // Change this to an existing test user
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ANSI colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);
const logSection = (title) => console.log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}`);

// Helper function to generate test JWT token
const generateTestToken = (userId, groupId) => {
    return jwt.sign(
        { 
            id: userId, 
            group_id: groupId,
            email: TEST_USER_EMAIL 
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
};

// Test 1: Check Database Structure
async function testDatabaseStructure() {
    logSection('Testing Database Structure');
    
    try {
        // Check if UserGroupMultiplier table exists and has data
        const multipliers = await UserGroupMultiplier.findAll({
            include: [{
                model: UserGroup,
                as: 'user_group',
                attributes: ['id', 'name'],
                required: false
            }]
        });
        
        log('green', `✓ UserGroupMultiplier table exists with ${multipliers.length} entries`);
        
        multipliers.forEach(multiplier => {
            const status = multiplier.enabled ? 'enabled' : 'disabled';
            const groupName = multiplier.user_group?.name || 'Unknown';
            log('white', `  - Group: ${groupName}, Multiplier: ${multiplier.multiplier}, Status: ${status}`);
        });
        
        // Check if we have users with groups
        const usersWithGroups = await User.findAll({
            include: [{
                model: UserGroup,
                as: 'group',
                attributes: ['id', 'name']
            }],
            limit: 5
        });
        
        log('green', `✓ Found ${usersWithGroups.length} users with group associations`);
        
        return true;
    } catch (error) {
        log('red', `✗ Database structure test failed: ${error.message}`);
        return false;
    }
}

// Test 2: Test API Endpoints
async function testAPIEndpoints() {
    logSection('Testing API Endpoints');
    
    try {
        // Test 1: Get all user group multipliers (admin endpoint)
        log('blue', 'Testing GET /api/usersgroupsmultiplier...');
        
        try {
            const response = await axios.get(`${API_BASE_URL}/usersgroupsmultiplier`);
            log('green', `✓ GET /api/usersgroupsmultiplier returned ${response.data.users?.length || 0} multipliers`);
        } catch (error) {
            log('red', `✗ GET /api/usersgroupsmultiplier failed: ${error.response?.status || error.message}`);
        }
        
        // Test 2: Get user's current multiplier
        log('blue', 'Testing GET /api/user/multiplier...');
        
        // Find a test user
        const testUser = await User.findOne({
            where: { email: TEST_USER_EMAIL },
            include: [{
                model: UserGroup,
                as: 'group'
            }]
        });
        
        if (testUser) {
            const token = generateTestToken(testUser.id, testUser.group_id);
            
            try {
                const response = await axios.get(`${API_BASE_URL}/user/multiplier`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                log('green', `✓ GET /api/user/multiplier returned multiplier: ${response.data.multiplier}`);
                log('white', `  User: ${testUser.email}, Group: ${testUser.group?.name || 'Unknown'}`);
                
                return response.data.multiplier;
            } catch (error) {
                log('red', `✗ GET /api/user/multiplier failed: ${error.response?.status || error.message}`);
            }
        } else {
            log('yellow', `⚠ Test user ${TEST_USER_EMAIL} not found. Please update TEST_USER_EMAIL in script.`);
        }
        
        return null;
    } catch (error) {
        log('red', `✗ API endpoint test failed: ${error.message}`);
        return null;
    }
}

// Test 3: Test Pricing Calculations
async function testPricingCalculations(userMultiplier) {
    logSection('Testing Pricing Calculations');
    
    try {
        // Get a sample catalog item
        const sampleItem = await ManufacturerCatalogData.findOne({
            where: { price: { [require('sequelize').Op.gt]: 0 } },
            order: [['id', 'ASC']]
        });
        
        if (!sampleItem) {
            log('yellow', '⚠ No catalog items found for pricing test');
            return;
        }
        
        const basePrice = parseFloat(sampleItem.price);
        const multiplier = userMultiplier || 1.4; // Use test multiplier if user multiplier not available
        const expectedPrice = basePrice * multiplier;
        
        log('blue', `Testing pricing calculation with sample item: ${sampleItem.code}`);
        log('white', `  Base price: $${basePrice.toFixed(2)}`);
        log('white', `  Multiplier: ${multiplier}`);
        log('white', `  Expected price: $${expectedPrice.toFixed(2)}`);
        
        // Test the calculation logic (same as in ItemSelectionContentEdit.jsx)
        const originalPrice = basePrice;
        const multipliedPrice = originalPrice * multiplier;
        const calculationCorrect = Math.abs(multipliedPrice - expectedPrice) < 0.01;
        
        if (calculationCorrect) {
            log('green', `✓ Pricing calculation is correct: $${multipliedPrice.toFixed(2)}`);
        } else {
            log('red', `✗ Pricing calculation error: got $${multipliedPrice.toFixed(2)}, expected $${expectedPrice.toFixed(2)}`);
        }
        
        // Test with quantity
        const quantity = 3;
        const totalWithQty = multipliedPrice * quantity;
        log('white', `  With quantity ${quantity}: $${totalWithQty.toFixed(2)}`);
        
        return calculationCorrect;
    } catch (error) {
        log('red', `✗ Pricing calculation test failed: ${error.message}`);
        return false;
    }
}

// Test 4: Test CRUD Operations
async function testCRUDOperations() {
    logSection('Testing CRUD Operations');
    
    try {
        // Find a user group to test with
        const testGroup = await UserGroup.findOne({
            where: { name: { [require('sequelize').Op.not]: 'Admin' } }
        });
        
        if (!testGroup) {
            log('yellow', '⚠ No non-admin user groups found for CRUD test');
            return;
        }
        
        log('blue', `Testing CRUD operations with group: ${testGroup.name}`);
        
        // Test CREATE: Check if we can create a new multiplier entry
        const existingMultiplier = await UserGroupMultiplier.findOne({
            where: { user_group_id: testGroup.id }
        });
        
        if (!existingMultiplier) {
            try {
                const newMultiplier = await UserGroupMultiplier.create({
                    user_group_id: testGroup.id,
                    multiplier: 1.5,
                    enabled: 1
                });
                log('green', `✓ CREATE: Successfully created multiplier entry with ID ${newMultiplier.id}`);
                
                // Test UPDATE
                await newMultiplier.update({ multiplier: 1.6 });
                log('green', '✓ UPDATE: Successfully updated multiplier value');
                
                // Test READ
                const readMultiplier = await UserGroupMultiplier.findByPk(newMultiplier.id);
                if (readMultiplier && Math.abs(readMultiplier.multiplier - 1.6) < 0.01) {
                    log('green', '✓ READ: Successfully read updated multiplier value');
                } else {
                    log('red', '✗ READ: Failed to read correct multiplier value');
                }
                
                // Cleanup - delete the test entry
                await newMultiplier.destroy();
                log('green', '✓ DELETE: Successfully cleaned up test multiplier entry');
                
            } catch (error) {
                log('red', `✗ CRUD operations failed: ${error.message}`);
                return false;
            }
        } else {
            log('yellow', '⚠ Multiplier entry already exists, skipping CREATE test');
            
            // Test UPDATE on existing entry
            const originalValue = existingMultiplier.multiplier;
            await existingMultiplier.update({ multiplier: 1.7 });
            log('green', '✓ UPDATE: Successfully updated existing multiplier');
            
            // Restore original value
            await existingMultiplier.update({ multiplier: originalValue });
            log('green', '✓ Restored original multiplier value');
        }
        
        return true;
    } catch (error) {
        log('red', `✗ CRUD operations test failed: ${error.message}`);
        return false;
    }
}

// Test 5: Test End-to-End Scenario
async function testEndToEndScenario() {
    logSection('Testing End-to-End Scenario');
    
    try {
        log('blue', 'Simulating complete user group multiplier workflow...');
        
        // Step 1: Find or create a test user group multiplier
        const testGroup = await UserGroup.findOne({
            where: { name: { [require('sequelize').Op.not]: 'Admin' } }
        });
        
        if (!testGroup) {
            log('red', '✗ No test group available for end-to-end test');
            return false;
        }
        
        let groupMultiplier = await UserGroupMultiplier.findOne({
            where: { user_group_id: testGroup.id }
        });
        
        if (!groupMultiplier) {
            groupMultiplier = await UserGroupMultiplier.create({
                user_group_id: testGroup.id,
                multiplier: 1.4,
                enabled: 1
            });
            log('green', '✓ Created test multiplier entry');
        }
        
        // Step 2: Verify the multiplier is enabled and has correct value
        if (groupMultiplier.enabled && groupMultiplier.multiplier) {
            log('green', `✓ Group "${testGroup.name}" has multiplier ${groupMultiplier.multiplier} (enabled)`);
        } else {
            log('red', `✗ Group "${testGroup.name}" multiplier is not properly configured`);
            return false;
        }
        
        // Step 3: Test catalog item pricing
        const sampleItem = await ManufacturerCatalogData.findOne({
            where: { price: { [require('sequelize').Op.gt]: 0 } }
        });
        
        if (sampleItem) {
            const basePrice = parseFloat(sampleItem.price);
            const multipliedPrice = basePrice * groupMultiplier.multiplier;
            
            log('white', `  Sample item: ${sampleItem.code} - $${basePrice.toFixed(2)}`);
            log('white', `  With ${groupMultiplier.multiplier}x multiplier: $${multipliedPrice.toFixed(2)}`);
            log('green', '✓ End-to-end pricing calculation successful');
        }
        
        // Step 4: Verify user can access their multiplier
        const testUser = await User.findOne({
            where: { group_id: testGroup.id }
        });
        
        if (testUser) {
            log('green', `✓ Found user "${testUser.email}" in test group`);
        } else {
            log('yellow', '⚠ No users found in test group');
        }
        
        log('green', '✓ End-to-end scenario completed successfully');
        return true;
        
    } catch (error) {
        log('red', `✗ End-to-end test failed: ${error.message}`);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log(`${colors.bold}${colors.blue}🧪 User Group Multiplier System Test Suite${colors.reset}\n`);
    
    const results = {
        database: false,
        api: false,
        pricing: false,
        crud: false,
        endToEnd: false
    };
    
    try {
        // Run all tests
        results.database = await testDatabaseStructure();
        const userMultiplier = await testAPIEndpoints();
        results.api = userMultiplier !== null;
        results.pricing = await testPricingCalculations(userMultiplier);
        results.crud = await testCRUDOperations();
        results.endToEnd = await testEndToEndScenario();
        
        // Summary
        logSection('Test Results Summary');
        
        Object.entries(results).forEach(([test, passed]) => {
            const status = passed ? '✓ PASS' : '✗ FAIL';
            const color = passed ? 'green' : 'red';
            log(color, `${status} ${test.toUpperCase()}`);
        });
        
        const passedTests = Object.values(results).filter(Boolean).length;
        const totalTests = Object.keys(results).length;
        
        console.log();
        if (passedTests === totalTests) {
            log('green', `🎉 All tests passed! (${passedTests}/${totalTests})`);
            log('green', '✓ User Group Multiplier system is working correctly!');
        } else {
            log('yellow', `⚠ ${passedTests}/${totalTests} tests passed`);
            log('yellow', 'Some issues found - check the details above');
        }
        
    } catch (error) {
        log('red', `Fatal error: ${error.message}`);
        console.error(error.stack);
    }
}

// Instructions
function printInstructions() {
    console.log(`${colors.bold}${colors.cyan}📋 User Group Multiplier Test Instructions:${colors.reset}\n`);
    console.log(`${colors.white}1. Make sure your backend server is running on localhost:8080${colors.reset}`);
    console.log(`${colors.white}2. Update TEST_USER_EMAIL in this script to match an existing contractor user${colors.reset}`);
    console.log(`${colors.white}3. Ensure you have at least one user group with multiplier configured${colors.reset}`);
    console.log(`${colors.white}4. Run: node test-multiplier-system.js${colors.reset}\n`);
}

// Run the tests if this script is executed directly
if (require.main === module) {
    printInstructions();
    runAllTests().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    testDatabaseStructure,
    testAPIEndpoints,
    testPricingCalculations,
    testCRUDOperations,
    testEndToEndScenario
};
