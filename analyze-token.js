// Script to decode and analyze the token found in the app

function decodeJWT(token) {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode header
    const header = JSON.parse(atob(parts[0]));

    // Decode payload
    const payload = JSON.parse(atob(parts[1]));

    // Convert timestamps to readable dates
    if (payload.iat) {
      payload.issuedAt = new Date(payload.iat * 1000).toISOString();
    }
    if (payload.exp) {
      payload.expiresAt = new Date(payload.exp * 1000).toISOString();
      payload.isExpired = payload.exp < Math.floor(Date.now() / 1000);
    }

    return {
      header,
      payload,
      signature: parts[2]
    };
  } catch (error) {
    return { error: error.message };
  }
}

// The token found in the app
const foundToken = 'eyJhbGciOiJIUzI1NiIs';

console.log('=== TOKEN ANALYSIS ===');
console.log('Token fragment found:', foundToken);
console.log('This appears to be the beginning of a JWT token.');
console.log('Searching for complete tokens in test scripts...\n');

// Check if this matches any of the test script tokens
const testTokens = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb3NlY2FAc3ltbWV0cmljYWx3b2xmLmNvbSIsIm5hbWUiOiJKb3NlIEZsZWl0YXMiLCJyb2xlIjoiQWRtaW4iLCJyb2xlX2lkIjoyLCJncm91cF9pZCI6MSwiaWF0IjoxNzU3MjExMDUwLCJleHAiOjE3NTcyMzk4NTB9.kSWkd_GfsrSPGdGnrj7wgvLmwTxj0oiJSbcZD1hZyFc',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBuamNhYmluZXRzLmNvbSIsIm5hbWUiOiJBZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczNDcxNDY4NywiZXhwIjoxNzM0ODAxMDg3fQ.pD1IuofJ7FKi1vOKRZyDrb_lWOl5BnWbJp0oJuDHKGg',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInVzZXJuYW1lIjoidGVzdGNvbnRyYWN0b3IiLCJpYXQiOjE3NTY0OTc3NjksImV4cCI6MTc1NjU4NDE2OX0.y3AV63vJkcwUpswRx8LiDTHo4yXhCtxbFKgT0j9ECHk',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NTY0OTc3NjksImV4cCI6MTc1NjU4NDE2OX0.nV885c5Fo5eqyMAh9StU0hFjKgviqeV70NzTBwPr9c4'
];

testTokens.forEach((token, index) => {
  if (token.startsWith(foundToken)) {
    console.log(`MATCH FOUND with test token #${index + 1}:`);
    const decoded = decodeJWT(token);
    console.log('Full token:', token);
    console.log('Decoded:', JSON.stringify(decoded, null, 2));
    console.log('---\n');
  }
});

// Also decode all test tokens to show what they contain
console.log('=== ALL TEST TOKENS ===');
testTokens.forEach((token, index) => {
  console.log(`Test Token #${index + 1}:`);
  const decoded = decodeJWT(token);
  console.log('Decoded:', JSON.stringify(decoded, null, 2));
  console.log('---\n');
});
