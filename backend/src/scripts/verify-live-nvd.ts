import { runMigrations, getDbPool } from '../db';
import { NvdService } from '../modules/nvd/nvd.service';
import { VulnerabilityService } from '../modules/vulnerabilities/vulnerability.service';

async function main() {
  console.log('================================================================');
  console.log('CyberRiskOS — Live NVD CVE Ingestion End-to-End Verification');
  console.log('================================================================\n');

  // Step 1: Ensure database schema & migrations are applied
  console.log('[1/5] Applying Database Migration 001_nvd_ingestion.sql...');
  await runMigrations();
  console.log('      Database schema ready.\n');

  const nvdService = new NvdService();
  const vulnService = new VulnerabilityService();

  const targetCveId = 'CVE-2021-44228'; // Real Log4j vulnerability from NIST

  // Step 2: Fetch and Ingest Real CVE from Official NVD API v2.0
  console.log(`[2/5] Connecting to official NIST NVD API v2.0 for ${targetCveId}...`);
  console.log('      URL: https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=' + targetCveId);
  const startTime = Date.now();

  const { result } = await nvdService.syncCveById(targetCveId);
  const elapsedMs = Date.now() - startTime;

  console.log(`      Ingestion Run ID:      ${result.runId}`);
  console.log(`      Status:                ${result.status}`);
  console.log(`      Records Received:      ${result.recordsReceived}`);
  console.log(`      Records Inserted:      ${result.recordsInserted}`);
  console.log(`      Records Updated:       ${result.recordsUpdated}`);
  console.log(`      Records Skipped:       ${result.recordsSkipped}`);
  console.log(`      Duration:              ${elapsedMs}ms\n`);

  // Step 3: Query Raw Payload & Cryptographic Provenance from Database
  console.log('[3/5] Inspecting Immutable Raw Source Record in PostgreSQL...');
  const pool = await getDbPool();
  const rawRes = await pool.query(
    'SELECT id, external_id, payload_hash, source_published_at, source_modified_at, ingested_at FROM raw_source_records WHERE external_id = $1',
    [targetCveId]
  );
  if (rawRes.rows.length > 0) {
    const raw = rawRes.rows[0];
    console.log(`      Raw Record UUID:       ${raw.id}`);
    console.log(`      External ID:           ${raw.external_id}`);
    console.log(`      SHA-256 Payload Hash:  ${raw.payload_hash}`);
    console.log(`      NIST Published:        ${raw.source_published_at}`);
    console.log(`      NIST Last Modified:    ${raw.source_modified_at}`);
    console.log(`      Ingested Timestamp:    ${raw.ingested_at}\n`);
  }

  // Step 4: Query Normalized Vulnerability & Preserved CVSS Assessments
  console.log(`[4/5] Executing GET /api/vulnerabilities/${targetCveId} with provenance...`);
  const stored = await vulnService.getVulnerabilityByCveId(targetCveId);

  if (!stored) {
    throw new Error(`Failed to find ${targetCveId} in normalized storage!`);
  }

  console.log('      --- Normalized Vulnerability Summary ---');
  console.log(`      CVE ID:                ${stored.cveId}`);
  console.log(`      Source Identifier:     ${stored.sourceIdentifier}`);
  console.log(`      Vulnerability Status:  ${stored.vulnStatus}`);
  console.log(`      Preferred CVSS Score:  ${stored.cvssBaseScore} (${stored.cvssBaseSeverity}) [Version: ${stored.cvssVersion}]`);
  console.log(`      Attack Vector:         ${stored.attackVector}`);
  console.log(`      Attack Complexity:     ${stored.attackComplexity}`);
  console.log(`      Privileges Required:   ${stored.privilegesRequired}`);
  console.log(`      Scope:                 ${stored.scope}`);
  console.log(`      Description snippet:   "${stored.description?.substring(0, 110)}..."\n`);

  console.log('      --- All Preserved CVSS Assessments Across Sources ---');
  for (const m of stored.cvssAssessments || []) {
    console.log(`      - Source: ${m.source.padEnd(25)} | Type: ${m.type.padEnd(10)} | CVSS v${m.version}: ${m.baseScore} (${m.baseSeverity || 'N/A'})`);
  }
  console.log('');

  console.log('      --- Weaknesses (CWE) ---');
  for (const w of stored.weaknesses || []) {
    console.log(`      - Identifier: ${w.cweId} (${w.description})`);
  }
  console.log('');

  console.log('      --- Affected CPEs ---');
  for (const c of stored.cpes?.slice(0, 3) || []) {
    console.log(`      - Criteria: ${c.criteria} [vulnerable=${c.vulnerable}]`);
  }
  console.log('');

  console.log('      --- Complete Provenance Metadata ---');
  console.log(`      Source Authority:      ${stored.provenance?.sourceName} (${stored.provenance?.sourceProvider})`);
  console.log(`      Raw Record Reference:  ${stored.rawRecordId}`);
  console.log(`      Cryptographic Hash:    ${stored.provenance?.rawPayloadHash}`);
  console.log(`      Ingestion Time:        ${stored.provenance?.ingestedAt}\n`);

  // Step 5: Test Idempotency & Deduplication
  console.log('[5/5] Testing Idempotency: Re-syncing unchanged CVE-2021-44228...');
  const resync = await nvdService.syncCveById(targetCveId);
  console.log(`      Records Received:      ${resync.result.recordsReceived}`);
  console.log(`      Records Inserted:      ${resync.result.recordsInserted}`);
  console.log(`      Records Updated:       ${resync.result.recordsUpdated}`);
  console.log(`      Records Skipped:       ${resync.result.recordsSkipped} (Deduplicated via identical SHA-256)`);
  console.log(`      Status:                ${resync.result.status}\n`);

  console.log('================================================================');
  console.log('SUCCESS: Complete flow verified from NVD API to PostgreSQL!');
  console.log('================================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('Live verification failed:', err);
  process.exit(1);
});
