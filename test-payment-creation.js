const http = require('http');

const data = JSON.stringify({
  orderId: 3,
  amount: 799.99,
  currency: 'USD',
  paymentMethod: 'credit_card'
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/payments',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb3NlY2FAc3ltbWV0cmljYWx3b2xmLmNvbSIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTc1NzI3OTExNSwiZXhwIjoxNzU3MjgyNzE1fQ.BO4OFfE6K3rHi2LbTQkUdKwKDgm0zwTDieVVANCybKA',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);

  let response = '';
  res.on('data', (chunk) => {
    response += chunk;
  });

  res.on('end', () => {
    console.log('Response:', response);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
