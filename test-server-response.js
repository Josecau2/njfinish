const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('=== SERVER RESPONSE TEST ===');
    console.log('Status:', res.statusCode);
    console.log('Response length:', data.length);
    console.log('Contains window.__BRAND__:', data.includes('window.__BRAND__'));
    console.log('Contains #443131 (custom background):', data.includes('#443131'));
    console.log('Contains CONTRACTOR PORTAL:', data.includes('CONTRACTOR PORTAL'));

    if (data.includes('window.__BRAND__')) {
      console.log('✅ BRAND INJECTION IS WORKING!');
      const brandMatch = data.match(/window\.__BRAND__ = ({.+?});/s);
      if (brandMatch) {
        try {
          const brandData = JSON.parse(brandMatch[1]);
          console.log('Brand data keys:', Object.keys(brandData));
          console.log('Login background:', brandData.login?.backgroundColor);
          console.log('Login title:', brandData.login?.title);
          console.log('Has logo data URI:', !!brandData.logoDataURI);
        } catch (e) {
          console.log('Brand data parse error:', e.message);
        }
      }
    } else {
      console.log('❌ BRAND INJECTION FAILED');
      console.log('Response preview (first 500 chars):');
      console.log(data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.log('❌ Request error:', e.message);
});

req.end();