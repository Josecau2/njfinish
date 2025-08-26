// Test script to check logo URL accessibility
const http = require('http');
const Customization = require('./models/Customization');

async function testLogoAccess() {
  try {
    console.log('🌐 Testing logo URL accessibility...\n');
    
    // Get current logo from database
    const customization = await Customization.findOne({ 
      order: [['updatedAt', 'DESC']] 
    });
    
    if (!customization || !customization.logoImage) {
      console.log('❌ No logo configured in database');
      return;
    }
    
    console.log(`📊 Logo path in DB: ${customization.logoImage}`);
    
    // Test local access
    const testUrl = `http://localhost:8080${customization.logoImage}`;
    console.log(`🔗 Testing URL: ${testUrl}`);
    
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: customization.logoImage,
      method: 'HEAD'
    };
    
    const req = http.request(options, (res) => {
      console.log(`📡 Response status: ${res.statusCode}`);
      console.log(`📄 Content-Type: ${res.headers['content-type']}`);
      console.log(`📏 Content-Length: ${res.headers['content-length']}`);
      
      if (res.statusCode === 200) {
        console.log('✅ Logo is accessible via HTTP!');
      } else {
        console.log('❌ Logo is not accessible - check static routes');
      }
    });
    
    req.on('error', (e) => {
      console.log('❌ Request failed:', e.message);
      console.log('💡 Make sure the server is running on port 8080');
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ Request timeout - server may not be running');
      req.destroy();
    });
    
    req.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testLogoAccess().then(() => {
  setTimeout(() => process.exit(0), 1000);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
