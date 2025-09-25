const fs = require('fs');

console.log('🔍 LOGO ISSUE DEBUGGING SCRIPT');
console.log('=====================================\n');

// 1. Check if inline.html exists and examine its content
console.log('1. Checking inline.html content...');
try {
  const inlineContent = fs.readFileSync('./public/brand/inline.html', 'utf8');

  // Look for logoDataURI in the content
  const logoMatch = inlineContent.match(/["']logoDataURI["']\s*:\s*["']([^"']*?)["']/);

  if (logoMatch) {
    const logoValue = logoMatch[1];
    console.log('✅ Found logoDataURI field');
    console.log('   Value:', logoValue.substring(0, 50) + (logoValue.length > 50 ? '...' : ''));
    console.log('   Length:', logoValue.length);
    console.log('   Is Data URI:', logoValue.startsWith('data:') ? 'Yes' : 'No');
    console.log('   Is Empty:', logoValue === '' ? 'Yes' : 'No');
  } else {
    console.log('❌ logoDataURI field not found in inline.html');

    // Show some context around where it should be
    const brandMatch = inlineContent.match(/window\.__BRAND__\s*=\s*({[\s\S]*?});/);
    if (brandMatch) {
      console.log('\n   Found window.__BRAND__ object:');
      const brandContent = brandMatch[1];
      const lines = brandContent.split('\n');
      lines.slice(0, 10).forEach((line, i) => {
        console.log(`   ${i+1}: ${line.trim()}`);
      });
    }
  }
} catch (error) {
  console.log('❌ Error reading inline.html:', error.message);
}

// 2. Check if the logo file exists
console.log('\n2. Checking logo file existence...');
const logoPath = './uploads/branding/login-logo.png';
try {
  const stats = fs.statSync(logoPath);
  console.log('✅ Logo file exists');
  console.log('   Size:', stats.size, 'bytes');
  console.log('   Modified:', stats.mtime);
} catch (error) {
  console.log('❌ Logo file does not exist:', logoPath);

  // Check if uploads directory structure exists
  console.log('\n   Checking directory structure...');

  const checkDir = (path) => {
    try {
      const stats = fs.statSync(path);
      console.log(`   ✅ ${path} exists (${stats.isDirectory() ? 'directory' : 'file'})`);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(path);
        console.log(`      Contents: ${files.join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ ${path} does not exist`);
    }
  };

  checkDir('./uploads');
  checkDir('./uploads/branding');
}

// 3. Check what's in the database
console.log('\n3. Checking database values...');
try {
  const LoginCustomization = require('./models/LoginCustomization');

  LoginCustomization.findByPk(1).then(customization => {
    if (customization) {
      console.log('✅ Found LoginCustomization record');
      console.log('   Logo field:', customization.logo);
      console.log('   Is file path:', customization.logo && customization.logo.startsWith('/uploads/') ? 'Yes' : 'No');
      console.log('   Is data URI:', customization.logo && customization.logo.startsWith('data:') ? 'Yes' : 'No');
    } else {
      console.log('❌ No LoginCustomization record found');
    }
  }).catch(error => {
    console.log('❌ Database error:', error.message);
  });
} catch (error) {
  console.log('❌ Model loading error:', error.message);
}

// 4. Summary and recommendations
console.log('\n4. RECOMMENDATIONS');
console.log('==================');
console.log('Based on the findings above:');
console.log('• If logo file is missing: Upload a new logo or create a test logo');
console.log('• If logoDataURI is empty: The branding system needs to regenerate');
console.log('• If database has file path but file missing: Need to fix file storage');
console.log('\nNext steps:');
console.log('1. Create a test logo file at ./uploads/branding/login-logo.png');
console.log('2. Restart the server to regenerate the brand snapshot');
console.log('3. Test the login page to verify logo displays');