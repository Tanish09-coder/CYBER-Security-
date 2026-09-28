const http = require('http');

const req = http.request(
  {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/assets',
    method: 'GET',
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      const parsed = JSON.parse(body);
      console.log('ASSETS:', JSON.stringify(parsed.data?.slice(0, 5), null, 2));
    });
  }
);

req.on('error', (e) => {
  console.error('ERROR:', e.message);
});

req.end();
