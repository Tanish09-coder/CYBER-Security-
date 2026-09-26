const http = require('http');

const data = JSON.stringify({
  serverId: 'mumbai-upi-switch-01',
  serverName: 'Mumbai Primary UPI Transaction Switch',
  ipAddress: '10.200.4.15',
  osEnvironment: 'Linux (Ubuntu 22.04 LTS)',
  incidentType: 'REVERSE_SHELL_ACTIVE',
  threatSeverity: 'CRITICAL',
  detectedAnomalies: [
    'Unusual outbound socket connection to 194.26.29.11:4444',
    'Root privilege escalation attempt via CVE-2024-3094'
  ],
  affectedServices: ['UPI Payment Gateway', 'Core Banking Proxy']
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/assistant/contain-breach',
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
