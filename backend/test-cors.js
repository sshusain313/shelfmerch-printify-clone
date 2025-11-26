// Quick test script to verify CORS is working
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:8080',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    if (res.headers['access-control-allow-origin']) {
      console.log('✅ CORS is working!');
    } else {
      console.log('❌ CORS headers missing!');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();


