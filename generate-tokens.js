// Generate fresh tokens for testing
const jwt = require('jsonwebtoken');

// Use the JWT secret from the app
const JWT_SECRET = 'dev-jwt-secret-change-in-production';

// Generate admin token (user_id: 1 - has group_id: 1 which is Admin)  
const adminToken = jwt.sign(
    { userId: 1, username: 'joseca' },
    JWT_SECRET,
    { expiresIn: '24h' }
);

// Generate contractor token (user_id: 46 - has role_id: 3 which is contractor)
const contractorToken = jwt.sign(
    { userId: 46, username: 'contractor' },
    JWT_SECRET,
    { expiresIn: '24h' }
);

console.log('🔑 Fresh tokens generated:');
console.log('\n👤 Contractor token (User ID 46):');
console.log(contractorToken);
console.log('\n👑 Admin token (User ID 1):');
console.log(adminToken);

// Test the tokens by decoding them
console.log('\n🔍 Token verification:');
try {
    const contractorDecoded = jwt.verify(contractorToken, JWT_SECRET);
    console.log('✅ Contractor token valid:', contractorDecoded);
} catch (error) {
    console.log('❌ Contractor token invalid:', error.message);
}

try {
    const adminDecoded = jwt.verify(adminToken, JWT_SECRET);
    console.log('✅ Admin token valid:', adminDecoded);
} catch (error) {
    console.log('❌ Admin token invalid:', error.message);
}
