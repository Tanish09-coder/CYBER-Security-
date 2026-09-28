const http = require('http');

const data = JSON.stringify({
  assetId: 'chennai-internal-wiki',
  cveId: 'CVE-2023-22515',
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/assistant/explain-risk',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      console.log('RESPONSE:', JSON.stringify(JSON.parse(body), null, 2));
    });
  }
);

req.on('error', (e) => {
  console.error('ERROR:', e.message);
});

req.write(data);
req.end();
