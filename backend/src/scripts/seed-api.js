// using built-in fetch

const API_URL = 'http://localhost:5000/api';

async function seed() {
  console.log('Starting API-based seed...');

  let res = await fetch(`${API_URL}/organizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'CyberCorp Global',
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
      name: 'Acme Retail',
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
  const setControl = async (assetId, controlCode, status) => {
    await fetch(`${API_URL}/assets/${assetId}/controls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { control_code: controlCode, status }
      ])
    });
  };

  await setControl(assetsOrg1[0].id, 'MFA', 'IMPLEMENTED');
  await setControl(assetsOrg1[0].id, 'EDR', 'IMPLEMENTED');
  await setControl(assetsOrg1[0].id, 'BACKUP', 'PARTIAL');
  await setControl(assetsOrg1[0].id, 'ENCRYPTION', 'IMPLEMENTED');

  await setControl(assetsOrg1[1].id, 'MFA', 'NOT_IMPLEMENTED');
  await setControl(assetsOrg1[1].id, 'EDR', 'UNKNOWN');
  
  await setControl(assetsOrg1[2].id, 'MFA', 'PARTIAL');
  await setControl(assetsOrg1[2].id, 'EDR', 'IMPLEMENTED');

  await setControl(assetsOrg2[0].id, 'MFA', 'IMPLEMENTED');
  await setControl(assetsOrg2[0].id, 'EDR', 'IMPLEMENTED');

  console.log('Controls assigned.');
  console.log('Seed complete!');
}

seed().catch(console.error);
