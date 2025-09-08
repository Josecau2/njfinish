// Script to find and clean old tokens from browser storage

console.log('=== BROWSER STORAGE TOKEN CLEANUP ===');

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp) {
      payload.expiresAt = new Date(payload.exp * 1000).toISOString();
      payload.isExpired = payload.exp < Math.floor(Date.now() / 1000);
    }
    return payload;
  } catch {
    return null;
  }
}

function checkStorageForTokens() {
  console.log('Checking localStorage...');

  // Check localStorage
  try {
    const lsToken = localStorage.getItem('token');
    if (lsToken) {
      console.log('Found token in localStorage:', lsToken.substring(0, 20) + '...');
      const decoded = decodeJWT(lsToken);
      if (decoded) {
        console.log('Token info:', {
          email: decoded.email || decoded.username || 'unknown',
          role: decoded.role,
          expiresAt: decoded.expiresAt,
          isExpired: decoded.isExpired
        });
      }
    } else {
      console.log('No token in localStorage');
    }
  } catch (e) {
    console.log('Error checking localStorage:', e.message);
  }

  // Check sessionStorage
  console.log('\nChecking sessionStorage...');
  try {
    const ssToken = sessionStorage.getItem('token');
    if (ssToken) {
      console.log('Found token in sessionStorage:', ssToken.substring(0, 20) + '...');
      const decoded = decodeJWT(ssToken);
      if (decoded) {
        console.log('Token info:', {
          email: decoded.email || decoded.username || 'unknown',
          role: decoded.role,
          expiresAt: decoded.expiresAt,
          isExpired: decoded.isExpired
        });
      }
    } else {
      console.log('No token in sessionStorage');
    }
  } catch (e) {
    console.log('Error checking sessionStorage:', e.message);
  }

  // Check all localStorage keys for any persist or auth related data
  console.log('\nChecking for persist/auth keys...');
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('persist') || key.includes('auth') || key.includes('token') || key.includes('user'))) {
        console.log(`Found auth-related key: ${key}`);
        const value = localStorage.getItem(key);
        if (value && value.length > 100) {
          console.log(`  Value (truncated): ${value.substring(0, 50)}...`);
        } else {
          console.log(`  Value: ${value}`);
        }
      }
    }
  } catch (e) {
    console.log('Error checking localStorage keys:', e.message);
  }
}

function cleanAllAuthData() {
  console.log('\n=== CLEANING ALL AUTH DATA ===');

  try {
    // Clear specific auth items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    console.log('Cleared token and user from both storages');

    // Clear all persist keys (Redux persist)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('persist:')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed persist key: ${key}`);
    });

    // Clear cookies
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    console.log('Cleared all cookies');

    console.log('✅ All auth data cleaned!');

  } catch (e) {
    console.log('Error cleaning auth data:', e.message);
  }
}

// Run the checks
checkStorageForTokens();

// Automatically clean if we're in a browser environment
if (typeof window !== 'undefined') {
  cleanAllAuthData();
  console.log('\n=== VERIFICATION AFTER CLEANUP ===');
  checkStorageForTokens();
}

console.log('\n=== RECOMMENDATIONS ===');
console.log('1. Clear your browser cache completely (Ctrl+Shift+Del)');
console.log('2. Close all browser tabs for this site');
console.log('3. Restart your browser');
console.log('4. Login fresh with: joseca@symmetricalwolf.com / admin123');
console.log('5. Check browser console and backend logs for consistent token timestamps');
