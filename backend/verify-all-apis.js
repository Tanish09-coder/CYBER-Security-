const http = require('http');

const endpoints = [
  'http://localhost:5000/api/health',
  'http://localhost:5000/api/organizations',
  'http://localhost:5000/api/assets',
  'http://localhost:5000/api/controls',
  'http://localhost:5000/api/controls/summary',
  'http://localhost:5000/api/risk/scores',
  'http://localhost:5000/api/risk/financial-exposure',
  'http://localhost:5000/api/attack-paths/graph',
  'http://localhost:5000/api/executive/summary',
  'http://localhost:5000/api/integrations',
  'http://localhost:5000/api/vulnerabilities',
  'http://localhost:5000/api/threat-intel',
  'http://127.0.0.1:8000/health'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, length: data.length });
      });
    }).on('error', (err) => {
      resolve({ url, status: 'ERROR', error: err.message, ok: false });
    });
  });
}

async function run() {
  console.log("=== COMPREHENSIVE CYBERRISKOS API HEALTH AUDIT ===");
  let failed = 0;
  for (const url of endpoints) {
    const r = await checkUrl(url);
    if (r.ok) {
      console.log(`[PASS] ${r.status} - ${r.url} (${r.length} bytes)`);
    } else {
      console.log(`[FAIL] ${r.status} - ${r.url} : ${r.error || 'HTTP ' + r.status}`);
      failed++;
    }
  }
  console.log(`\nAudit Complete: ${endpoints.length - failed} Passed, ${failed} Failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
