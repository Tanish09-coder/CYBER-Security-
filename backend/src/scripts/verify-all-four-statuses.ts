import dotenv from 'dotenv';
dotenv.config();

import { runMigrations, closeDb } from '../db';
import { NvdService } from '../modules/nvd/nvd.service';
import { CisaKevService } from '../modules/cisa-kev/cisa-kev.service';
import { MitreAttackService } from '../modules/mitre-attack/mitre-attack.service';
import { VcdbService } from '../modules/vcdb/vcdb.service';

async function verifyAllStatuses() {
  console.log('=============================================================================');
  console.log('CyberRiskOS — Four External Intelligence Integrations Health & Status Audit');
  console.log('Owner: TANISH (Cyber Intelligence & External Data Integration Lead)');
  console.log('=============================================================================');

  await runMigrations();

  const nvdService = new NvdService();
  const cisaKevService = new CisaKevService();
  const mitreAttackService = new MitreAttackService();
  const vcdbService = new VcdbService();

  console.log('\n--- 1. NVD (National Vulnerability Database) ---');
  const nvdStatus = await nvdService.getSyncStatus();
  console.log(JSON.stringify(nvdStatus, null, 2));

  console.log('\n--- 2. CISA KEV (Known Exploited Vulnerabilities) ---');
  const cisaKevStatus = await cisaKevService.getStatus();
  console.log(JSON.stringify(cisaKevStatus, null, 2));

  console.log('\n--- 3. MITRE ATT&CK Enterprise STIX 2.1 ---');
  const mitreStatus = await mitreAttackService.getStatus();
  console.log(JSON.stringify(mitreStatus, null, 2));

  console.log('\n--- 4. VCDB / VERIS Cyber Incidents ---');
  const vcdbStatus = await vcdbService.getStatus();
  console.log(JSON.stringify(vcdbStatus, null, 2));

  console.log('\n=============================================================================');
  console.log('ALL FOUR INTEGRATION STATUS INVENTORIES RETRIEVED SUCCESSFULLY');
  console.log('=============================================================================');
}

verifyAllStatuses()
  .catch((err) => {
    console.error('Status check error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });
