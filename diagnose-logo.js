// Production logo diagnosis script
const Customization = require('./models/Customization');
const fs = require('fs');
const path = require('path');

async function diagnoseLogoIssue() {
  console.log('🔍 LOGO DIAGNOSIS REPORT');
  console.log('========================\n');
  
  try {
    // 1. Check database
    console.log('1️⃣ DATABASE CHECK');
    const customization = await Customization.findOne({ 
      order: [['updatedAt', 'DESC']] 
    });
    
    if (customization) {
      console.log(`✅ Customization record found`);
      console.log(`   - ID: ${customization.id}`);
      console.log(`   - Logo Image: ${customization.logoImage || 'NULL'}`);
      console.log(`   - Logo Text: ${customization.logoText || 'NULL'}`);
      console.log(`   - Updated: ${customization.updatedAt}`);
    } else {
      console.log(`❌ No customization record found`);
    }
    
    // 2. Check file system
    console.log('\n2️⃣ FILE SYSTEM CHECK');
    
    if (customization && customization.logoImage) {
      const logoPath = customization.logoImage;
      const fullPath = path.join('.', logoPath);
      
      console.log(`📁 Expected file: ${fullPath}`);
      
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`✅ File exists`);
        console.log(`   - Size: ${stats.size} bytes`);
        console.log(`   - Modified: ${stats.mtime}`);
      } else {
        console.log(`❌ File not found at expected location`);
        
        // Check alternative locations
        const filename = path.basename(logoPath);
        const alternatives = [
          `./uploads/${filename}`,
          `./uploads/images/${filename}`,
          `./uploads/logos/${filename}`,
          `./uploads/manufacturer_catalogs/${filename}`
        ];
        
        console.log(`🔍 Checking alternative locations for ${filename}:`);
        let found = false;
        for (const alt of alternatives) {
          if (fs.existsSync(alt)) {
            console.log(`   ✅ Found at: ${alt}`);
            found = true;
          } else {
            console.log(`   ❌ Not at: ${alt}`);
          }
        }
        
        if (!found) {
          console.log(`   ❌ File not found anywhere`);
        }
      }
    }
    
    // 3. Check upload directories
    console.log('\n3️⃣ UPLOAD DIRECTORIES CHECK');
    const uploadDirs = ['./uploads', './uploads/images', './uploads/logos', './uploads/manufacturer_catalogs'];
    
    uploadDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const logoFiles = files.filter(f => f.toLowerCase().includes('logo'));
        console.log(`📁 ${dir}: ${files.length} files total, ${logoFiles.length} logo files`);
        logoFiles.forEach(f => console.log(`   - ${f}`));
      } else {
        console.log(`❌ ${dir}: Directory not found`);
      }
    });
    
    // 4. Generate recommendations
    console.log('\n4️⃣ RECOMMENDATIONS');
    
    if (!customization) {
      console.log('🔧 Upload a logo through the customization page');
    } else if (!customization.logoImage) {
      console.log('🔧 No logo configured - upload one through Settings > Customization');
    } else {
      const logoPath = customization.logoImage;
      const fullPath = path.join('.', logoPath);
      
      if (fs.existsSync(fullPath)) {
        console.log('✅ Logo setup appears correct');
        console.log('💡 If logo not showing on other devices, check:');
        console.log('   - Network connectivity to server');
        console.log('   - Browser cache (try hard refresh)');
        console.log('   - Server static file serving configuration');
        console.log(`   - Test URL: http://YOUR_SERVER_IP:8080${logoPath}`);
      } else {
        console.log('🔧 Logo file missing - try one of these solutions:');
        console.log('   1. Re-upload the logo through Settings > Customization');
        console.log('   2. Move the logo file to the correct location');
        console.log('   3. Update the database path to match the actual file location');
      }
    }
    
    // 5. Test instructions
    console.log('\n5️⃣ TESTING INSTRUCTIONS');
    console.log('To test logo visibility from another device:');
    console.log('1. Ensure the server is running');
    console.log('2. Find your server\'s IP address');
    console.log('3. From another device, navigate to: http://SERVER_IP:8080');
    console.log('4. Check if logo appears in the sidebar');
    
    if (customization && customization.logoImage) {
      console.log(`5. Directly test logo URL: http://SERVER_IP:8080${customization.logoImage}`);
    }
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
  }
}

// Run diagnosis
diagnoseLogoIssue().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
