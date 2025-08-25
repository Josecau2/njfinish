// Debug script to check logo storage
const Customization = require('./models/Customization');
const fs = require('fs');
const path = require('path');

async function debugLogoStorage() {
  try {
    console.log('🔍 Checking logo storage...\n');
    
    // Check database
    const customization = await Customization.findOne({ 
      order: [['updatedAt', 'DESC']] 
    });
    
    console.log('📊 Database customization record:');
    if (customization) {
      console.log(`- ID: ${customization.id}`);
      console.log(`- Logo Image Path: ${customization.logoImage || 'NULL'}`);
      console.log(`- Logo Text: ${customization.logoText || 'NULL'}`);
      console.log(`- Last Updated: ${customization.updatedAt}`);
    } else {
      console.log('- No customization record found');
    }
    
    console.log('\n📁 Checking file system:');
    
    // Check uploads directories
    const uploadPaths = [
      './uploads/images',
      './uploads/logos', 
      './uploads/manufacturer_catalogs'
    ];
    
    for (const dir of uploadPaths) {
      console.log(`\n📂 Directory: ${dir}`);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => 
          f.includes('logo') || f.includes('Logo') || f.includes('Image')
        );
        if (files.length > 0) {
          console.log(`  Found ${files.length} logo-related files:`);
          files.forEach(f => console.log(`  - ${f}`));
        } else {
          console.log('  No logo-related files found');
        }
      } else {
        console.log('  Directory does not exist');
      }
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (customization && customization.logoImage) {
      const logoPath = customization.logoImage;
      const fullPath = path.join('.', logoPath);
      
      if (fs.existsSync(fullPath)) {
        console.log('✅ Logo file exists and database path is correct');
      } else {
        console.log('❌ Logo file missing or path incorrect');
        console.log(`   Expected file at: ${fullPath}`);
        
        // Check if file exists in wrong location
        const filename = path.basename(logoPath);
        const wrongPaths = [
          `./uploads/logos/${filename}`,
          `./uploads/images/${filename}`,
          `./uploads/${filename}`
        ];
        
        for (const wrongPath of wrongPaths) {
          if (fs.existsSync(wrongPath)) {
            console.log(`   File found at: ${wrongPath}`);
          }
        }
      }
    } else {
      console.log('🔄 No logo configured in database - upload a logo first');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the debug
debugLogoStorage().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
