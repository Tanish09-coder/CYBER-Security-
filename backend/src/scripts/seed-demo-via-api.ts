// =============================================================================
// CyberRiskOS — API-based DEMO Workspace Bootstrapper
// Targets the running server on http://localhost:5000
// =============================================================================

declare const fetch: typeof globalThis.fetch;

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function api(path: string, options: any = {}): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status} ${path}: ${text}`);
  }
  return res.json();
}

export async function runApiSeed() {
  console.log('=============================================================================');
  console.log(`CyberRiskOS — Bootstrapping DEMO Workspace via API (${BASE_URL})`);
  console.log('=============================================================================');

  // 1. Create Organization
  console.log('\n--- 1. Registering DEMO Organization ---');
  let demoOrg: any;
  const existingOrgs: any = await api('/api/organizations');
  const orgList = existingOrgs.data || existingOrgs || [];
  demoOrg = orgList.find((o: any) => o.name && o.name.includes('(Demo)'));

  if (!demoOrg) {
    const created = await api('/api/organizations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Apex Financial Enterprises (Demo)',
        industry: 'Financial Services',
        employee_count: 12500,
        annual_revenue: 2500000000,
        currency: 'USD',
        metadata: { is_demo: true, demo_tag: 'Official Judge Demonstration Workspace' },
      }),
    });
    demoOrg = created.data || created;
    console.log(`✓ Created Organization: ${demoOrg.name} (${demoOrg.id})`);
  } else {
    console.log(`✓ Using existing Organization: ${demoOrg.name} (${demoOrg.id})`);
  }

  // 2. Create Business Units
  console.log('\n--- 2. Registering Business Units ---');
  let existingBUs: any[] = [];
  try {
    const buRes = await api(`/api/business-units?organization_id=${demoOrg.id}`);
    existingBUs = buRes.data || buRes || [];
  } catch {}

  const getOrCreateBU = async (name: string, tier: number, desc: string) => {
    const found = existingBUs.find((b: any) => b.name === name);
    if (found) return found;
    try {
      const res = await api('/api/business-units', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: demoOrg.id,
          name,
          criticality_tier: tier,
          description: desc,
        }),
      });
      return res.data || res;
    } catch {
      // Re-fetch if created in race
      const refetch = await api(`/api/business-units?organization_id=${demoOrg.id}`);
      const list = refetch.data || refetch || [];
      return list.find((b: any) => b.name === name) || {};
    }
  };

  const buPayment = await getOrCreateBU('Payment Processing Systems (Demo)', 5, 'High-volume transaction gateway and credit settlement processing pipeline.');
  const buCoreBank = await getOrCreateBU('Core Banking & Ledger (Demo)', 5, 'Primary customer balance ledger and double-entry transaction database.');
  const buWebGateway = await getOrCreateBU('Customer Web & Mobile Gateway (Demo)', 4, 'Public internet customer portal, mobile API gateway, and edge proxies.');
  const buCorporate = await getOrCreateBU('Corporate IT & Operations (Demo)', 3, 'Internal Active Directory, employee collaboration tools, and intranet.');

  console.log('✓ Business Units created.');

  // 3. Register Assets
  console.log('\n--- 3. Registering Enterprise Assets ---');
  const assetsInput = [
    {
      name: 'prod-pay-gw-01.apex.internal (Demo)',
      asset_type: 'server',
      hostname: 'prod-pay-gw-01.apex.internal',
      operating_system: 'Red Hat Enterprise Linux 8.6',
      environment: 'Production',
      is_internet_facing: true,
      business_criticality: 5,
      data_classification: 'Restricted',
      asset_value: 12500000,
      business_unit_id: buPayment.id,
      software: [
        { vendor: 'apache', product: 'http_server', version: '2.4.49' },
        { vendor: 'openssl', product: 'openssl', version: '3.0.6' },
      ],
      controls: [
        { control_code: 'ENCRYPTION', status: 'IMPLEMENTED', effectiveness_score: 1.0 },
        { control_code: 'EDR', status: 'IMPLEMENTED', effectiveness_score: 0.85 },
        { control_code: 'MFA', status: 'IMPLEMENTED', effectiveness_score: 0.90 },
        { control_code: 'SEGMENTATION', status: 'IMPLEMENTED', effectiveness_score: 0.80 },
        { control_code: 'BACKUP', status: 'IMPLEMENTED', effectiveness_score: 0.95 },
        { control_code: 'MONITORING', status: 'PARTIAL', effectiveness_score: 0.40 },
      ],
    },
    {
      name: 'core-db-cluster-01.apex.internal (Demo)',
      asset_type: 'database',
      hostname: 'core-db-cluster-01.apex.internal',
      operating_system: 'Ubuntu 22.04 LTS',
      environment: 'Production',
      is_internet_facing: false,
      business_criticality: 5,
      data_classification: 'Restricted',
      asset_value: 25000000,
      business_unit_id: buCoreBank.id,
      software: [
        { vendor: 'postgresql', product: 'postgresql', version: '15.2' },
        { vendor: 'apache', product: 'log4j', version: '2.14.1' },
      ],
      controls: [
        { control_code: 'ENCRYPTION', status: 'IMPLEMENTED', effectiveness_score: 1.0 },
        { control_code: 'EDR', status: 'IMPLEMENTED', effectiveness_score: 0.90 },
        { control_code: 'MFA', status: 'IMPLEMENTED', effectiveness_score: 0.95 },
        { control_code: 'SEGMENTATION', status: 'IMPLEMENTED', effectiveness_score: 0.90 },
        { control_code: 'BACKUP', status: 'IMPLEMENTED', effectiveness_score: 1.0 },
        { control_code: 'MONITORING', status: 'IMPLEMENTED', effectiveness_score: 0.85 },
      ],
    },
    {
      name: 'edge-nginx-proxy.apex.internal (Demo)',
      asset_type: 'server',
      hostname: 'edge-nginx-proxy.apex.internal',
      operating_system: 'Alpine Linux 3.18',
      environment: 'Production',
      is_internet_facing: true,
      business_criticality: 4,
      data_classification: 'Confidential',
      asset_value: 5000000,
      business_unit_id: buWebGateway.id,
      software: [
        { vendor: 'haxx', product: 'libcurl', version: '7.79.1' },
        { vendor: 'nginx', product: 'nginx', version: '1.24.0' },
      ],
      controls: [
        { control_code: 'ENCRYPTION', status: 'IMPLEMENTED', effectiveness_score: 1.0 },
        { control_code: 'EDR', status: 'PARTIAL', effectiveness_score: 0.50 },
        { control_code: 'MFA', status: 'IMPLEMENTED', effectiveness_score: 0.80 },
        { control_code: 'SEGMENTATION', status: 'PARTIAL', effectiveness_score: 0.50 },
        { control_code: 'BACKUP', status: 'NOT_IMPLEMENTED', effectiveness_score: 0.0 },
        { control_code: 'MONITORING', status: 'PARTIAL', effectiveness_score: 0.35 },
      ],
    },
    {
      name: 'corp-hq-dc01.apex.internal (Demo)',
      asset_type: 'server',
      hostname: 'corp-hq-dc01.apex.internal',
      operating_system: 'Microsoft Windows Server 2022',
      environment: 'Production',
      is_internet_facing: false,
      business_criticality: 4,
      data_classification: 'Internal',
      asset_value: 8000000,
      business_unit_id: buCorporate.id,
      software: [
        { vendor: 'microsoft', product: 'windows_server_2022', version: '10.0.20348.1' },
      ],
      controls: [
        { control_code: 'ENCRYPTION', status: 'IMPLEMENTED', effectiveness_score: 0.80 },
        { control_code: 'EDR', status: 'IMPLEMENTED', effectiveness_score: 0.95 },
        { control_code: 'MFA', status: 'IMPLEMENTED', effectiveness_score: 1.0 },
        { control_code: 'SEGMENTATION', status: 'IMPLEMENTED', effectiveness_score: 0.85 },
        { control_code: 'BACKUP', status: 'IMPLEMENTED', effectiveness_score: 0.90 },
        { control_code: 'MONITORING', status: 'IMPLEMENTED', effectiveness_score: 0.80 },
      ],
    },
    {
      name: 'confluence-wiki-01.apex.internal (Demo)',
      asset_type: 'server',
      hostname: 'confluence-wiki-01.apex.internal',
      operating_system: 'Ubuntu 20.04 LTS',
      environment: 'Staging',
      is_internet_facing: true,
      business_criticality: 3,
      data_classification: 'Internal',
      asset_value: 2000000,
      business_unit_id: buCorporate.id,
      software: [
        { vendor: 'atlassian', product: 'confluence_data_center', version: '8.5.0' },
      ],
      controls: [
        { control_code: 'ENCRYPTION', status: 'IMPLEMENTED', effectiveness_score: 0.70 },
        { control_code: 'EDR', status: 'UNKNOWN' },
        { control_code: 'MFA', status: 'PARTIAL', effectiveness_score: 0.40 },
        { control_code: 'SEGMENTATION', status: 'UNKNOWN' },
        { control_code: 'BACKUP', status: 'PARTIAL', effectiveness_score: 0.50 },
        { control_code: 'MONITORING', status: 'NOT_IMPLEMENTED', effectiveness_score: 0.0 },
      ],
    },
  ];

  const existingAssetsRes = await api('/api/assets');
  const existingAssetsList = existingAssetsRes.data || existingAssetsRes || [];

  const createdAssets: any[] = [];
  for (const item of assetsInput) {
    let asset = existingAssetsList.find((a: any) => a.name === item.name);
    if (!asset) {
      const res = await api('/api/assets', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: demoOrg.id,
          business_unit_id: item.business_unit_id,
          name: item.name,
          asset_type: item.asset_type,
          hostname: item.hostname,
          operating_system: item.operating_system,
          environment: item.environment,
          is_internet_facing: item.is_internet_facing,
          business_criticality: item.business_criticality,
          data_classification: item.data_classification,
          asset_value: item.asset_value,
          metadata: { is_demo: true },
        }),
      });
      asset = res.data || res;
      console.log(`   + Created Asset: ${asset.name} (${asset.id})`);

      // Software
      for (const sw of item.software) {
        await api(`/api/assets/${asset.id}/software`, {
          method: 'POST',
          body: JSON.stringify(sw),
        });
        console.log(`     - Added software: ${sw.vendor}/${sw.product} v${sw.version}`);
      }

      // Controls
      if (item.controls && item.controls.length > 0) {
        await api(`/api/assets/${asset.id}/controls`, {
          method: 'POST',
          body: JSON.stringify({ controls: item.controls }),
        });
        console.log(`     - Configured ${item.controls.length} controls.`);
      }
    } else {
      console.log(`   + Found existing Asset: ${asset.name} (${asset.id})`);
    }
    createdAssets.push(asset);
  }

  // 4. Financial Parameters
  console.log('\n--- 4. Registering Financial Parameters ---');
  await api(`/api/organizations/${demoOrg.id}/financial-parameters`, {
    method: 'POST',
    body: JSON.stringify({
      hourly_downtime_cost: 150000,
      pii_record_count: 2500000,
      cost_per_record: 165,
      system_hardware_replacement_cost: 5000000,
    }),
  });
  console.log('✓ Financial parameters registered ($150k/hr downtime, 2.5M records @ $165).');

  // 5. Register Private Security Lab & AJLAPTOP
  console.log('\n--- 5. Registering Private Security Lab (Development Workspace) ---');
  let labOrg = orgList.find((o: any) => o.name === 'CyberRiskOS Security Lab');
  if (!labOrg) {
    const createdLab = await api('/api/organizations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'CyberRiskOS Security Lab',
        industry: 'Cybersecurity Research',
        employee_count: 1,
        currency: 'INR',
        metadata: { workspace_type: 'DEVELOPMENT', is_demo: false },
      }),
    });
    labOrg = createdLab.data || createdLab;
    console.log(`✓ Created Lab Org: ${labOrg.name} (${labOrg.id})`);
  }

  const allAssetsRes = await api('/api/assets');
  const allAssetsList = allAssetsRes.data || allAssetsRes || [];
  let ajlaptop = allAssetsList.find((a: any) => a.name === 'AJLAPTOP');

  if (!ajlaptop) {
    const createdAj = await api('/api/assets', {
      method: 'POST',
      body: JSON.stringify({
        organization_id: labOrg.id,
        name: 'AJLAPTOP',
        asset_type: 'workstation',
        hostname: 'AJLAPTOP',
        operating_system: 'Microsoft Windows 11 Home Single Language',
        environment: 'Development',
        is_internet_facing: false,
        business_criticality: 3,
        data_classification: 'Internal',
        metadata: { is_demo: false },
      }),
    });
    ajlaptop = createdAj.data || createdAj;
    console.log(`✓ Created Private Asset: AJLAPTOP (${ajlaptop.id})`);

    // Add software for AJLAPTOP
    await api(`/api/assets/${ajlaptop.id}/software`, { method: 'POST', body: JSON.stringify({ vendor: 'haxx', product: 'libcurl', version: '7.79.1' }) });
    await api(`/api/assets/${ajlaptop.id}/software`, { method: 'POST', body: JSON.stringify({ vendor: 'git', product: 'git', version: '2.55.0' }) });
    await api(`/api/assets/${ajlaptop.id}/software`, { method: 'POST', body: JSON.stringify({ vendor: 'nodejs', product: 'node', version: '24.18.1' }) });
  }

  // 6. Run CPE Matching & Correlations
  console.log('\n--- 6. Running CPE Matching Engine ---');
  const cpeRes = await api('/api/cpe-matching/evaluate', { method: 'POST' });
  console.log('✓ CPE Matching complete:', cpeRes);

  // 7. Run Risk Engine Evaluations
  console.log('\n--- 7. Computing Risk Engine Scores ---');
  for (const asset of [...createdAssets, ajlaptop]) {
    try {
      const riskRes = await api(`/api/risk/assets/${asset.id}/evaluate`, { method: 'POST' });
      console.log(`   + Evaluated Risk for ${asset.name}:`, (riskRes.data || riskRes.items || riskRes || []).length, 'scores computed');
    } catch (e: any) {
      console.warn(`   ! Risk evaluation note for ${asset.name}: ${e.message}`);
    }
  }

  // 8. Run Financial Exposure Engine
  console.log('\n--- 8. Computing Financial Exposure Metrics ---');
  for (const asset of createdAssets) {
    try {
      const finRes = await api(`/api/financial/assets/${asset.id}/evaluate`, {
        method: 'POST',
        body: JSON.stringify({ organizationId: demoOrg.id }),
      });
      console.log(`   + Evaluated Financial Exposure for ${asset.name}:`, finRes.data ? `EAL=$${Math.round(finRes.data.financialMetrics?.ale || 0).toLocaleString()}` : 'OK');
    } catch (e: any) {
      console.warn(`   ! Financial exposure note for ${asset.name}: ${e.message}`);
    }
  }

  console.log('\n=============================================================================');
  console.log('✓ DEMO Workspace Seeded & Operational via API!');
  console.log('=============================================================================');
}

if (require.main === module) {
  runApiSeed().catch((err) => {
    console.error('Fatal API seed failure:', err);
    process.exit(1);
  });
}
