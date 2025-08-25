const { Sequelize, Op } = require('sequelize');
const sequelize = require('./config/db');
const Proposals = require('./models/Proposals');
const Customer = require('./models/Customer');
const User = require('./models/User');

// Test the validation logic directly
function testStatusValidation() {
    console.log('🧪 Testing Status Validation Logic\n');

    // Copy the validation function from the controller
    const validateStatusTransition = (currentStatus, newStatus, action) => {
        const validTransitions = {
            'draft': ['sent', 'rejected'],
            'sent': ['accepted', 'rejected', 'expired'],
            'accepted': [], // Cannot change from accepted
            'rejected': ['draft'], // Can restart from rejected
            'expired': ['draft'] // Can restart from expired
        };

        // Legacy status support
        const normalizeStatus = (status) => {
            if (!status || status === 'Draft') return 'draft';
            if (status === 'Proposal rejected') return 'rejected';
            if (status === 'Proposal accepted') return 'accepted';
            return status.toLowerCase();
        };

        const normalizedCurrent = normalizeStatus(currentStatus);
        const normalizedNew = normalizeStatus(newStatus);

        console.log(`   Current: "${currentStatus}" → "${normalizedCurrent}"`);
        console.log(`   New: "${newStatus}" → "${normalizedNew}"`);
        
        const isValid = validTransitions[normalizedCurrent]?.includes(normalizedNew) || normalizedCurrent === normalizedNew;
        console.log(`   Valid: ${isValid}\n`);
        
        return isValid;
    };

    // Test common scenarios
    const testCases = [
        { current: 'draft', new: 'draft', action: 'update', expected: true },
        { current: 'draft', new: 'sent', action: 'send', expected: true },
        { current: 'draft', new: 'accepted', action: 'accept', expected: false },
        { current: 'sent', new: 'accepted', action: 'accept', expected: true },
        { current: 'accepted', new: 'draft', action: 'update', expected: false },
        { current: 'Proposal done', new: 'Proposal done', action: 'update', expected: true },
        { current: null, new: 'draft', action: 'update', expected: true },
        { current: '', new: 'draft', action: 'update', expected: true },
    ];

    console.log('Testing validation scenarios:');
    for (const testCase of testCases) {
        console.log(`🔍 Test: ${testCase.current || 'null'} → ${testCase.new} (${testCase.action})`);
        const result = validateStatusTransition(testCase.current, testCase.new, testCase.action);
        const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';
        console.log(`   ${status} (expected: ${testCase.expected}, got: ${result})`);
    }
}

// Test what's actually in the database
async function testDatabaseProposals() {
    try {
        console.log('\n🗄️  Testing Database Proposals\n');

        // Get some proposals from group 14
        const proposals = await Proposals.findAll({
            where: { 
                owner_group_id: 14,
                isDeleted: false 
            },
            attributes: ['id', 'status', 'type', 'owner_group_id'],
            limit: 5
        });

        console.log('Found proposals in group 14:');
        proposals.forEach(p => {
            console.log(`   ID: ${p.id}, Status: "${p.status}", Type: "${p.type}"`);
        });

        if (proposals.length > 0) {
            const testProposal = proposals[0];
            console.log(`\n🧪 Testing validation for proposal ${testProposal.id}:`);
            
            // Test keeping the same status (common update scenario)
            console.log('Scenario: Update proposal keeping same status');
            const validateStatusTransition = (currentStatus, newStatus, action) => {
                const validTransitions = {
                    'draft': ['sent', 'rejected'],
                    'sent': ['accepted', 'rejected', 'expired'],
                    'accepted': [], // Cannot change from accepted
                    'rejected': ['draft'], // Can restart from rejected
                    'expired': ['draft'] // Can restart from expired
                };

                const normalizeStatus = (status) => {
                    if (!status || status === 'Draft') return 'draft';
                    if (status === 'Proposal rejected') return 'rejected';
                    if (status === 'Proposal accepted') return 'accepted';
                    return status.toLowerCase();
                };

                const normalizedCurrent = normalizeStatus(currentStatus);
                const normalizedNew = normalizeStatus(newStatus);

                console.log(`   Current: "${currentStatus}" → "${normalizedCurrent}"`);
                console.log(`   New: "${newStatus}" → "${normalizedNew}"`);
                
                const isValid = validTransitions[normalizedCurrent]?.includes(normalizedNew) || normalizedCurrent === normalizedNew;
                console.log(`   Valid: ${isValid}`);
                
                return isValid;
            };

            validateStatusTransition(testProposal.status, testProposal.status, 'update');
        }

    } catch (error) {
        console.error('❌ Database test failed:', error.message);
    }
}

// Simulate the exact updateProposal validation
async function simulateUpdateProposal() {
    try {
        console.log('\n🎯 Simulating updateProposal Validation\n');

        // Get a test proposal
        const testProposal = await Proposals.findOne({
            where: { 
                owner_group_id: 14,
                isDeleted: false 
            }
        });

        if (!testProposal) {
            console.log('❌ No test proposal found');
            return;
        }

        console.log(`Testing with proposal ${testProposal.id}:`);
        console.log(`   Current status: "${testProposal.status}"`);
        console.log(`   Current type: "${testProposal.type}"`);

        // Simulate common update scenarios
        const scenarios = [
            {
                name: 'Update description only (no status in formData)',
                formData: { id: testProposal.id, description: 'Updated' }
            },
            {
                name: 'Update with same status',
                formData: { id: testProposal.id, status: testProposal.status, description: 'Updated' }
            },
            {
                name: 'Update with empty status',
                formData: { id: testProposal.id, status: '', description: 'Updated' }
            },
            {
                name: 'Update with undefined status',
                formData: { id: testProposal.id, status: undefined, description: 'Updated' }
            }
        ];

        for (const scenario of scenarios) {
            console.log(`\n🧪 ${scenario.name}:`);
            const formData = scenario.formData;
            
            // This is the exact validation logic from the controller
            if (formData.status && formData.status !== testProposal.status) {
                console.log('   Status validation would be triggered');
                console.log(`   Comparing: "${formData.status}" !== "${testProposal.status}"`);
            } else {
                console.log('   Status validation would be SKIPPED');
                console.log(`   Reason: ${!formData.status ? 'No status in formData' : 'Status unchanged'}`);
            }
        }

    } catch (error) {
        console.error('❌ Simulation failed:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Validation Tests\n');
    
    testStatusValidation();
    await testDatabaseProposals();
    await simulateUpdateProposal();
    
    console.log('\n✨ All tests completed!');
    process.exit(0);
}

runAllTests().catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
});
