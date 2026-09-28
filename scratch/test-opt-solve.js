const http = require('http');

const data = JSON.stringify({
  budgetLimit: 5000000,
  currency: 'INR',
  objective: 'MAX_ROSI',
  organizationId: 'd5d9b870-d451-4e19-803d-23358a5a8171',
  candidateActions: [
    {
      actionId: 'act-edr-mumbai-upi-01',
      title: 'Upgrade EDR Sensor to Active Blocking Mode on Mumbai UPI Gateway',
      actionType: 'IMPLEMENT_CONTROL',
      targetAssetId: 'mumbai-upi-switch-01.bharatbank.internal',
      controlCode: 'EDR_ACTIVE',
      cost: 1500000,
      estimatedRiskReduction: 38.5,
      estimatedEalReduction: 1250000,
    }
  ]
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/optimization/solve',
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
      console.log('RESPONSE:', body);
    });
  }
);

req.on('error', (e) => {
  console.error('ERROR:', e.message);
});

req.write(data);
req.end();
