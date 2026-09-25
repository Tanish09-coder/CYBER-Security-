// =============================================================================
// CyberRiskOS — Indian Enterprise API-based DEMO Workspace Bootstrapper
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
  console.log(`CyberRiskOS — Bootstrapping Indian Enterprise DEMO Workspace via API (${BASE_URL})`);
  console.log('=============================================================================');

  // 0. Sync Authoritative Cyber Threat Intelligence (NVD CVEs, CISA KEV, MITRE ATT&CK, VCDB)
  console.log('\n--- 0. Syncing Real Public Cyber Intelligence ---');
  const cvesToSync = [
    'CVE-2021-44228',
    'CVE-2023-38545',
    'CVE-2021-41773',
    'CVE-2023-22515',
    'CVE-2023-2454',
    'CVE-2022-3602',
    'CVE-2023-4863',
    'CVE-2023-34362',
    'CVE-2023-20198',
  ];

  for (const cveId of cvesToSync) {
    try {
      await api(`/api/integrations/nvd/cve/${cveId}`, { method: 'POST' });
      console.log(`   + Synced NVD CVE: ${cveId}`);
    } catch (e: any) {
      console.warn(`   ! NVD sync note for ${cveId}: ${e.message}`);
    }
  }

  try {
    const kevRes = await api('/api/integrations/cisa-kev/sync', { method: 'POST' });
    console.log('   + CISA KEV catalog sync complete:', kevRes.syncResult?.recordsInserted || 'OK');
  } catch (e: any) {
    console.warn(`   ! CISA KEV sync note: ${e.message}`);
  }

  // 1. Create Indian Enterprise Organization
  console.log('\n--- 1. Registering Indian Enterprise Organization ---');
  let demoOrg: any;
  const existingOrgs: any = await api('/api/organizations');
  const orgList = existingOrgs.data || existingOrgs || [];
  demoOrg = orgList.find((o: any) => o.name && (o.name.includes('(Demo)') || o.name.includes('Bharat') || o.name.includes('HDFC')));

  if (!demoOrg) {
    const created = await api('/api/organizations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Bharat Digital Financial Services (Demo)',
        industry: 'Banking & Financial Services (BFSI)',
        employee_count: 24500,
        annual_revenue: 18500000000, // ₹18,500 Crore INR
        currency: 'INR',
        metadata: { is_demo: true, demo_tag: 'Official Indian Enterprise Workspace (RBI & SEBI Mapped)' },
      }),
    });
    demoOrg = created.data || created;
    console.log(`✓ Created Organization: ${demoOrg.name} (${demoOrg.id})`);
  } else {
    await api(`/api/organizations/${demoOrg.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ currency: 'INR', name: 'Bharat Digital Financial Services (Demo)' }),
    });
    console.log(`✓ Updated Organization to INR: ${demoOrg.name} (${demoOrg.id})`);
  }

  // 2. Create Business Units
  console.log('\n--- 2. Registering Indian Enterprise Business Units ---');
  let existingBUs: any[] = [];
  try {
    const buRes = await api(`/api/business-units?organization_id=${demoOrg.id}`);
    existingBUs = buRes.data || buRes || [];
  } catch {}

  const getOrCreateBU = async (name: string, tier: number, desc: string, budget: number) => {
    const found = existingBUs.find((b: any) => b.name === name);
    if (found) return found;
    try {
      const res = await api('/api/business-units', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: demoOrg.id,
          name,
          criticality_tier: tier,
          budget,
          description: desc,
        }),
      });
      return res.data || res;
    } catch {
      const refetch = await api(`/api/business-units?organization_id=${demoOrg.id}`);
      const list = refetch.data || refetch || [];
      return list.find((b: any) => b.name === name) || {};
    }
  };

  const buUPI = await getOrCreateBU('UPI & IMPS Payment Switch (Demo)', 5, 'Real-time UPI transaction routing gateway and NPCI IMPS settlement engine.', 45000000);
  const buCoreBank = await getOrCreateBU('CBS Core Banking & Ledger (Demo)', 5, 'Primary customer account ledger, Fixed Deposit engine, and RTGS/NEFT database.', 65000000);
  const buPortal = await getOrCreateBU('NetBanking & Mobile App Gateway (Demo)', 4, 'Customer Internet Banking portal, Mobile Banking API gateway, and WAF proxies.', 30000000);
  const buCorporate = await getOrCreateBU('Corporate Operations & HR (Demo)', 3, 'Internal Active Directory, SAP ERP, employee collaboration, and Intranet.', 15000000);

  console.log('✓ Business Units created with INR budgets.');

  // 3. Register Assets with Indian Datacenter Hostnames
  console.log('\n--- 3. Registering Indian Datacenter Infrastructure Assets ---');
  const assetsInput = [
    {
      name: 'mumbai-upi-switch-01.bharatbank.internal (Demo)',
      asset_type: 'server',
      hostname: 'mumbai-upi-switch-01.bharatbank.internal',
      operating_system: 'Red Hat Enterprise Linux 8.8',
      environment: 'Production',
      is_internet_facing: true,
      business_criticality: 5,
      data_classification: 'Restricted',
      asset_value: 85000000,
      business_unit_id: buUPI.id,
      software: [
        { vendor: 'apache', product: 'http_server', version: '2.4.49' },
        { vendor: 'openssl', product: 'openssl', version: '3.0.6' },
      ],
      controls: [
        { control_code: 'ENCRYPTION', status: 'IMPLEMENTED', effectiveness_score: 1.0 },
        { control_code: 'EDR', status: 'IMPLEMENTED', effectiveness_score: 0.90 },
        { control_code: 'MFA', status: 'IMPLEMENTED', effectiveness_score: 0.95 },
        { control_code: 'SEGMENTATION', status: 'IMPLEMENTED', effectiveness_score: 0.85 },
        { control_code: 'BACKUP', status: 'IMPLEMENTED', effectiveness_score: 0.95 },
        { control_code: 'MONITORING', status: 'PARTIAL', effectiveness_score: 0.45 },
      ],
    },
    {
      name: 'bengaluru-cbs-db-cluster.bharatbank.internal (Demo)',
      asset_type: 'database',
      hostname: 'bengaluru-cbs-db-cluster.bharatbank.internal',
      operating_system: 'Ubuntu 22.04 LTS Server',
      environment: 'DR',
      is_internet_facing: false,
      business_criticality: 5,
      data_classification: 'Restricted',
      asset_value: 150000000,
      business_unit_id: buCoreBank.id,
      software: [
        { vendor: 'postgresql', product: 'postgresql', version: '15.2' },
        { vendor: 'apache', product: 'log4j', version: '2.14.1' },
      ],
      controls: [
        { control_code: 'ENCRYPTION', status: 'IMPLEMENTED', effectiveness_score: 1.0 },
        { control_code: 'EDR', status: 'IMPLEMENTED', effectiveness_score: 0.95 },
        { control_code: 'MFA', status: 'IMPLEMENTED', effectiveness_score: 1.0 },
        { control_code: 'SEGMENTATION', status: 'IMPLEMENTED', effectiveness_score: 0.90 },
        { control_code: 'BACKUP', status: 'IMPLEMENTED', effectiveness_score: 1.0 },
        { control_code: 'MONITORING', status: 'IMPLEMENTED', effectiveness_score: 0.90 },
      ],
    },
    {
      name: 'delhi-netbanking-proxy.bharatbank.internal (Demo)',
      asset_type: 'server',
      hostname: 'delhi-netbanking-proxy.bharatbank.internal',
      operating_system: 'Alpine Linux 3.18',
      environment: 'Production',
      is_internet_facing: true,
      business_criticality: 4,
      data_classification: 'Confidential',
      asset_value: 35000000,
      business_unit_id: buPortal.id,
      software: [
        { vendor: 'haxx', product: 'libcurl', version: '7.79.1' },
        { vendor: 'nginx', product: 'nginx', version: '1.24.0' },
      ],
      controls: [
        { control_code: 'ENCRYPTION', status: 'IMPLEMENTED', effectiveness_score: 1.0 },
        { control_code: 'EDR', status: 'PARTIAL', effectiveness_score: 0.50 },
        { control_code: 'MFA', status: 'IMPLEMENTED', effectiveness_score: 0.85 },
        { control_code: 'SEGMENTATION', status: 'PARTIAL', effectiveness_score: 0.50 },
        { control_code: 'BACKUP', status: 'NOT_IMPLEMENTED', effectiveness_score: 0.0 },
        { control_code: 'MONITORING', status: 'PARTIAL', effectiveness_score: 0.40 },
      ],
    },
    {
      name: 'hyderabad-hq-dc01.bharatbank.internal (Demo)',
      asset_type: 'server',
      hostname: 'hyderabad-hq-dc01.bharatbank.internal',
      operating_system: 'Microsoft Windows Server 2022 Datacenter',
      environment: 'Production',
      is_internet_facing: false,
      business_criticality: 4,
      data_classification: 'Internal',
      asset_value: 50000000,
      business_unit_id: buCorporate.id,
      software: [
        { vendor: 'microsoft', product: 'windows_server_2022', version: '10.0.20348.1' },
      ],
      controls: [
        { control_code: 'ENCRYPTION', status: 'IMPLEMENTED', effectiveness_score: 0.85 },
        { control_code: 'EDR', status: 'IMPLEMENTED', effectiveness_score: 0.95 },
        { control_code: 'MFA', status: 'IMPLEMENTED', effectiveness_score: 1.0 },
        { control_code: 'SEGMENTATION', status: 'IMPLEMENTED', effectiveness_score: 0.85 },
        { control_code: 'BACKUP', status: 'IMPLEMENTED', effectiveness_score: 0.90 },
        { control_code: 'MONITORING', status: 'IMPLEMENTED', effectiveness_score: 0.85 },
      ],
    },
    {
      name: 'chennai-internal-wiki.bharatbank.internal (Demo)',
      asset_type: 'server',
      hostname: 'chennai-internal-wiki.bharatbank.internal',
      operating_system: 'Ubuntu 20.04 LTS',
      environment: 'Staging',
      is_internet_facing: true,
      business_criticality: 3,
      data_classification: 'Internal',
      asset_value: 12000000,
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
          metadata: { is_demo: true, location: item.hostname },
        }),
      });
      asset = res.data || res;
      console.log(`   + Created Indian Asset: ${asset.name} (${asset.id})`);

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
        console.log(`     - Configured ${item.controls.length} security controls.`);
      }
    } else {
      console.log(`   + Found existing Asset: ${asset.name} (${asset.id})`);
    }
    createdAssets.push(asset);
  }

  // 4. Financial Parameters in INR (₹)
  console.log('\n--- 4. Registering Indian Financial Loss Parameters (₹ INR) ---');
  await api(`/api/organizations/${demoOrg.id}/financial-parameters`, {
    method: 'POST',
    body: JSON.stringify({
      hourly_downtime_cost: 1250000, // ₹12.5 Lakhs / hr
      pii_record_count: 5000000, // 50 Lakh Customer Records
      cost_per_record: 14000, // ₹14,000 / record
      regulatory_breach_penalty: 250000000, // ₹25 Crore Regulatory Penalty (RBI/SEBI)
      system_hardware_replacement_cost: 35000000, // ₹3.5 Crore Hardware Replacement
    }),
  });
  console.log('✓ Indian Financial parameters registered (₹12.5 Lakh/hr downtime, 50 Lakh records @ ₹14,000/record, ₹25 Cr penalty).');

  // 5. Remediation Actions Catalog in INR (₹)
  console.log('\n--- 5. Registering Candidate Remediation Actions (₹ INR) ---');
  const remediationActionsInput = [
    {
      organizationId: demoOrg.id,
      title: 'Upgrade EDR Sensor to Active Blocking Mode on Mumbai UPI Gateway',
      actionType: 'ENABLE_CONTROL',
      remediationCost: 1500000, // ₹15 Lakhs
      estimatedEffortHours: 40,
      targetControlCode: 'EDR',
      status: 'PLANNED',
    },
    {
      organizationId: demoOrg.id,
      title: 'Patch Critical Apache Log4j (CVE-2021-44228) on Bengaluru Core Banking DB',
      actionType: 'PATCH_CVE',
      remediationCost: 2500000, // ₹25 Lakhs
      estimatedEffortHours: 80,
      targetCveId: 'CVE-2021-44228',
      status: 'APPROVED',
    },
    {
      organizationId: demoOrg.id,
      title: 'Micro-segment Network Path between Delhi Edge Proxy and Hyderabad DC',
      actionType: 'SEGMENT_NETWORK',
      remediationCost: 3500000, // ₹35 Lakhs
      estimatedEffortHours: 120,
      targetControlCode: 'SEGMENTATION',
      status: 'PLANNED',
    },
  ];

  for (const act of remediationActionsInput) {
    try {
      await api('/api/remediation-actions', {
        method: 'POST',
        body: JSON.stringify(act),
      });
      console.log(`   + Registered Remediation Action: ${act.title}`);
    } catch (e: any) {
      console.warn(`   ! Remediation action note: ${e.message}`);
    }
  }

  // 6. Run CPE Matching & Correlations
  console.log('\n--- 6. Running CPE Matching Engine ---');
  const cpeRes = await api('/api/cpe-matching/evaluate', { method: 'POST' });
  console.log('✓ CPE Matching complete:', cpeRes);

  // 7. Run Risk Engine Evaluations
  console.log('\n--- 7. Computing Risk Engine Scores ---');
  for (const asset of createdAssets) {
    try {
      const riskRes = await api(`/api/risk/assets/${asset.id}/evaluate`, { method: 'POST' });
      console.log(`   + Evaluated Risk for ${asset.name}`);
    } catch (e: any) {
      console.warn(`   ! Risk evaluation note for ${asset.name}: ${e.message}`);
    }
  }

  // 8. Run Financial Exposure Engine (₹ INR)
  console.log('\n--- 8. Computing Financial Exposure Metrics in INR (₹) ---');
  for (const asset of createdAssets) {
    try {
      const finRes = await api(`/api/financial/assets/${asset.id}/evaluate`, {
        method: 'POST',
        body: JSON.stringify({ organizationId: demoOrg.id }),
      });
      console.log(`   + Evaluated Financial Exposure for ${asset.name}: OK`);
    } catch (e: any) {
      console.warn(`   ! Financial exposure note for ${asset.name}: ${e.message}`);
    }
  }

  console.log('\n=============================================================================');
  console.log('✓ INDIAN ENTERPRISE DEMO WORKSPACE SEEDED & OPERATIONAL (INR ₹)!');
  console.log('=============================================================================');
}

if (require.main === module) {
  runApiSeed().catch((err) => {
    console.error('Fatal API seed failure:', err);
    process.exit(1);
  });
}
