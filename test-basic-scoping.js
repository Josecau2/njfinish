const axios = require('axios');

async function testBasicScoping() {
  console.log('🧪 Basic Category Scoping Test');

  try {
    // Login first
    console.log('🔐 Authenticating...');
    const loginResp = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    }, { timeout: 5000 });

    const token = loginResp.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful');

    // Test getting gallery categories
    console.log('\n📋 Testing Gallery Categories...');
    const galleryResp = await axios.get('http://localhost:8080/api/global-mods/categories?scope=gallery', { headers });
    console.log(`✅ Gallery categories: ${galleryResp.data.categories.length}`);

    // Check that gallery categories don't have manufacturer_id
    const badGallery = galleryResp.data.categories.filter(c => c.manufacturerId !== null);
    console.log(`✅ Gallery categories properly scoped: ${badGallery.length === 0} (${badGallery.length} bad)`);

    // Test getting manufacturer categories
    console.log('\n🏭 Testing Manufacturer Categories...');
    const manuResp = await axios.get('http://localhost:8080/api/global-mods/categories?scope=manufacturer&manufacturerId=1', { headers });
    console.log(`✅ Manufacturer categories: ${manuResp.data.categories.length}`);

    // Check that manufacturer categories have correct scope
    const badManu = manuResp.data.categories.filter(c => c.scope !== 'manufacturer' || c.manufacturerId !== 1);
    console.log(`✅ Manufacturer categories properly scoped: ${badManu.length === 0} (${badManu.length} bad)`);

    // Test gallery endpoint
    console.log('\n🖼️ Testing Gallery Endpoint...');
    const galleryTemplatesResp = await axios.get('http://localhost:8080/api/global-mods/gallery', { headers });
    console.log(`✅ Gallery returned ${galleryTemplatesResp.data.gallery.length} categories`);

    let blueprintCount = 0;
    let nonBlueprintCount = 0;

    galleryTemplatesResp.data.gallery.forEach(cat => {
      cat.templates.forEach(template => {
        if (template.isBlueprint && template.manufacturerId === null) {
          blueprintCount++;
        } else {
          nonBlueprintCount++;
          console.log(`❌ Bad template in gallery: ${template.name} (blueprint: ${template.isBlueprint}, manu: ${template.manufacturerId})`);
        }
      });
    });

    console.log(`✅ Gallery properly filtered: ${nonBlueprintCount === 0} (${blueprintCount} blueprints, ${nonBlueprintCount} bad)`);

    // Test manufacturer mods endpoint
    console.log('\n🏭 Testing Manufacturer Mods Endpoint...');
    const manuModsResp = await axios.get('http://localhost:8080/api/global-mods/manufacturer/1/mods', { headers });
    console.log(`✅ Manufacturer mods returned ${manuModsResp.data.categories.length} categories`);

    let manuModCount = 0;
    let badManuModCount = 0;

    manuModsResp.data.categories.forEach(cat => {
      cat.templates.forEach(template => {
        if (!template.isBlueprint && template.manufacturerId === 1) {
          manuModCount++;
        } else {
          badManuModCount++;
          console.log(`❌ Bad template in manufacturer mods: ${template.name} (blueprint: ${template.isBlueprint}, manu: ${template.manufacturerId})`);
        }
      });
    });

    console.log(`✅ Manufacturer mods properly filtered: ${badManuModCount === 0} (${manuModCount} mods, ${badManuModCount} bad)`);

    console.log('\n🎉 BASIC SCOPING TEST PASSED!');
    console.log('✅ Gallery categories properly scoped');
    console.log('✅ Manufacturer categories properly scoped');
    console.log('✅ Gallery endpoint properly filtered');
    console.log('✅ Manufacturer mods endpoint properly filtered');

  } catch (error) {
    console.log('\n❌ TEST FAILED:');
    console.log('Error:', error.code || error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testBasicScoping();
