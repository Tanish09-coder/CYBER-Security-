// =============================================================================
// CyberRiskOS — Test Fixture Seed: API-based (Test / Verification Only)
// =============================================================================

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function seed() {
  console.log('[Test Fixtures] Starting API-based seed...');

  let res = await fetch(`${API_URL}/organizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'CyberCorp Global (Test Fixture)',
      industry: 'Finance',
      employee_count: 5000,
      annual_revenue: 1000000000,
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const org1 = await res.json();
  console.log('Org 1 created:', org1.id);

  // 2. Create Organization 2
  res = await fetch(`${API_URL}/organizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Acme Retail (Test Fixture)',
      industry: 'Retail',
      employee_count: 1000,
      annual_revenue: 50000000,
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const org2 = await res.json();
  console.log('Org 2 created:', org2.id);

  // 3. Create Assets for Org 1
  const assetsOrg1 = [];
  
  res = await fetch(`${API_URL}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: org1.id,
      name: 'Core Banking DB',
      asset_type: 'database_server',
      environment: 'Production',
      is_internet_facing: false,
      business_criticality: 5,
      data_classification: 'Restricted',
    })
  });
  if (!res.ok) throw new Error(await res.text());
  assetsOrg1.push(await res.json());

  res = await fetch(`${API_URL}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: org1.id,
      name: 'Public Marketing Site',
      asset_type: 'server',
      environment: 'Production',
      is_internet_facing: true,
      business_criticality: 2,
      data_classification: 'Public',
    })
  });
  if (!res.ok) throw new Error(await res.text());
  assetsOrg1.push(await res.json());

  res = await fetch(`${API_URL}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: org1.id,
      name: 'Employee Intranet',
      asset_type: 'server',
      environment: 'Development',
      is_internet_facing: false,
      business_criticality: 3,
      data_classification: 'Internal',
    })
  });
  if (!res.ok) throw new Error(await res.text());
  assetsOrg1.push(await res.json());

  console.log('Org 1 assets created.');

  // 4. Create Assets for Org 2
  const assetsOrg2 = [];
  res = await fetch(`${API_URL}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: org2.id,
      name: 'Retail POS Gateway',
      asset_type: 'server',
      environment: 'Production',
      is_internet_facing: true,
      business_criticality: 4,
      data_classification: 'Confidential',
    })
  });
  if (!res.ok) throw new Error(await res.text());
  assetsOrg2.push(await res.json());
  console.log('Org 2 assets created.');

  // 5. Assign Controls
  res = await fetch(`${API_URL}/controls`);
  if (!res.ok) throw new Error(await res.text());
  const controlsData = await res.json();
  const controls = controlsData.controls;

  const mfa = controls.find(c => c.code === 'MFA');
  const edr = controls.find(c => c.code === 'EDR');
  const backup = controls.find(c => c.code === 'BACKUP');
  const encryption = controls.find(c => c.code === 'ENCRYPTION');

  async function assignControl(assetId, controlId, status) {
    let r = await fetch(`${API_URL}/assets/${assetId}/controls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ control_id: controlId, status })
    });
    if (!r.ok) console.error('Failed to assign control:', await r.text());
  }

  if (mfa && edr && backup && encryption) {
    await assignControl(assetsOrg1[0].id, mfa.id, 'IMPLEMENTED');
    await assignControl(assetsOrg1[0].id, edr.id, 'IMPLEMENTED');
    await assignControl(assetsOrg1[0].id, backup.id, 'PARTIAL');
    await assignControl(assetsOrg1[0].id, encryption.id, 'IMPLEMENTED');

    await assignControl(assetsOrg1[1].id, mfa.id, 'NOT_IMPLEMENTED');
    await assignControl(assetsOrg1[1].id, edr.id, 'UNKNOWN');

    await assignControl(assetsOrg1[2].id, mfa.id, 'PARTIAL');
    await assignControl(assetsOrg1[2].id, edr.id, 'IMPLEMENTED');

    await assignControl(assetsOrg2[0].id, mfa.id, 'IMPLEMENTED');
    await assignControl(assetsOrg2[0].id, edr.id, 'IMPLEMENTED');
  }

  console.log('[Test Fixtures] Seed complete!');
}

if (typeof module !== 'undefined' && require.main === module) {
  seed().catch(console.error);
}

module.exports = { seed };
