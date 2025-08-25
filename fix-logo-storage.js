// Script to fix logo storage location and ensure directories exist
const Customization = require('./models/Customization');
const fs = require('fs');
const path = require('path');

async function fixLogoStorage() {
  try {
    console.log('🔧 Fixing logo storage...\n');
    
    // Ensure all upload directories exist
    const directories = [
      './uploads',
      './uploads/images',
      './uploads/logos',
      './uploads/manufacturer_catalogs'
    ];
    
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      } else {
        console.log(`📁 Directory exists: ${dir}`);
      }
    });
    
    // Check current logo in database
    const customization = await Customization.findOne({ 
      order: [['updatedAt', 'DESC']] 
    });
    
    if (customization && customization.logoImage) {
      console.log(`\n🔍 Current logo path in DB: ${customization.logoImage}`);
      
      const currentPath = path.join('.', customization.logoImage);
      
      if (fs.existsSync(currentPath)) {
        console.log('✅ Logo file exists at current location');
        
        // For future uploads, they'll go to /uploads/images/
        // But current logo is fine where it is since we added the static route
        
      } else {
        console.log('❌ Logo file not found at expected location');
        
        // Try to find the file elsewhere
        const filename = path.basename(customization.logoImage);
        const possibleLocations = [
          `./uploads/images/${filename}`,
          `./uploads/${filename}`,
          `./uploads/logos/${filename}`
        ];
        
        let found = false;
        for (const location of possibleLocations) {
          if (fs.existsSync(location)) {
            console.log(`📍 Found logo at: ${location}`);
            
            // Update database path to match actual location
            const newPath = location.replace('./', '/');
            await customization.update({ logoImage: newPath });
            console.log(`✅ Updated database path to: ${newPath}`);
            found = true;
            break;
          }
        }
        
        if (!found) {
          console.log('❌ Logo file not found anywhere - may need to re-upload');
        }
      }
    } else {
      console.log('ℹ️  No logo configured in database');
    }
    
    console.log('\n🎉 Logo storage fix complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the fix
fixLogoStorage().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
