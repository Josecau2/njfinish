const axios = require('axios');

async function testBlueprintCreation() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:8080/api/login', {
      email: 'joseca@symmetricalwolf.com',
      password: 'admin123'
    });

    const token = loginResponse.data?.token;
    if (!token) {
      throw new Error('No token received from login');
    }
    console.log('✓ Login successful, token length:', token.length);

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n📋 Getting gallery to find existing template...');
    const galleryResponse = await axios.get('http://localhost:8080/api/global-mods/gallery', { headers });
    const gallery = galleryResponse.data?.gallery || [];

    // Find first template to use as blueprint
    let sourceTemplate = null;
    for (const category of gallery) {
      if (category.templates && category.templates.length > 0) {
        sourceTemplate = category.templates[0];
        break;
      }
    }

    if (!sourceTemplate) {
      throw new Error('No existing templates found to use as blueprint');
    }

    console.log('✓ Found template to clone:', sourceTemplate.name);
    console.log('  - ID:', sourceTemplate.id);
    console.log('  - Category:', sourceTemplate.categoryId);
    console.log('  - Default Price:', sourceTemplate.defaultPrice);
    console.log('  - Has fieldsConfig:', !!sourceTemplate.fieldsConfig);
    console.log('  - Sample Image:', sourceTemplate.sampleImage || 'none');

    console.log('\n🎯 Creating blueprint copy (simulating frontend)...');

    // This is exactly what the frontend does in the "Use as Blueprint" button
    const blueprintPayload = {
      categoryId: sourceTemplate.categoryId || null,
      name: `${sourceTemplate.name} (Copy)`,
      defaultPrice: sourceTemplate.defaultPrice != null ? Number(sourceTemplate.defaultPrice) : 0,
      isReady: false,
      fieldsConfig: sourceTemplate.fieldsConfig || {},
      sampleImage: sourceTemplate.sampleImage || null,
    };

    console.log('Payload:', JSON.stringify(blueprintPayload, null, 2));

    const createResponse = await axios.post('http://localhost:8080/api/global-mods/templates', blueprintPayload, { headers });

    console.log('\n✅ SUCCESS! Blueprint template created:');
    console.log('  - New ID:', createResponse.data.template.id);
    console.log('  - Name:', createResponse.data.template.name);
    console.log('  - Status:', createResponse.data.template.is_ready ? 'Ready' : 'Draft');

    console.log('\n🔄 Verifying by fetching gallery again...');
    const updatedGallery = await axios.get('http://localhost:8080/api/global-mods/gallery', { headers });
    const allTemplates = [];
    updatedGallery.data.gallery.forEach(cat => {
      if (cat.templates) {
        allTemplates.push(...cat.templates);
      }
    });

    const newTemplate = allTemplates.find(t => t.id === createResponse.data.template.id);
    if (newTemplate) {
      console.log('✓ New template found in gallery:', newTemplate.name);
    } else {
      console.log('❌ New template not found in gallery');
    }

  } catch (error) {
    console.log('\n❌ ERROR:', error.response?.status || 'Unknown');
    console.log('Message:', error.response?.data?.message || error.message);

    if (error.response?.data?.stack) {
      console.log('\nStack trace:');
      console.log(error.response.data.stack);
    }

    if (error.response?.data) {
      console.log('\nFull error response:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testBlueprintCreation();
