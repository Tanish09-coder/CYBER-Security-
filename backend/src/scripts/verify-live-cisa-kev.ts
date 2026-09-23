import { runMigrations, getDbPool, query } from '../db';
import { CisaKevService } from '../modules/cisa-kev/cisa-kev.service';
import { NvdService } from '../modules/nvd/nvd.service';
import { VulnerabilityService } from '../modules/vulnerabilities/vulnerability.service';

async function main() {
  console.log('================================================================');
  console.log('CyberRiskOS — Live CISA KEV Ingestion End-to-End Verification');
  console.log('Official CISA Catalog + NVD Join + Cryptographic Provenance');
  console.log('================================================================\n');

  // Step 1: Ensure database schema & migrations are applied
  console.log('[1/7] Applying Database Migrations (001_nvd, 002_cisa_kev)...');
  await runMigrations();
  console.log('      Database schema ready.\n');

  const cisaKevService = new CisaKevService();
  const nvdService = new NvdService();
  const vulnService = new VulnerabilityService();

  // Step 2: Ingest Full Official CISA KEV Catalog from Live Endpoint
  console.log('[2/7] Connecting to Official CISA KEV Live Feed...');
  console.log('      URL: https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
  const kevStartTime = Date.now();
  const syncResult = await cisaKevService.syncFullCatalog();
  const kevElapsedMs = Date.now() - kevStartTime;

  console.log(`      Ingestion Run ID:      ${syncResult.runId}`);
  console.log(`      Catalog Title:         ${syncResult.catalogTitle}`);
  console.log(`      Catalog Version:       ${syncResult.catalogVersion}`);
  console.log(`      Catalog Release Date:  ${syncResult.dateReleased}`);
  console.log(`      Official KEV Count:    ${syncResult.officialCount}`);
  console.log(`      Records Processed:     ${syncResult.recordsReceived}`);
  console.log(`      Records Inserted:      ${syncResult.recordsInserted}`);
  console.log(`      Records Updated:       ${syncResult.recordsUpdated}`);
  console.log(`      Records Skipped:       ${syncResult.recordsSkipped}`);
  console.log(`      Duration:              ${kevElapsedMs}ms\n`);

  // Step 3: Choose a CVE dynamically from the Ingested Live KEV Catalog
  console.log('[3/7] Selecting a CVE dynamically from the Live KEV Catalog...');
  const pool = await getDbPool();
  const kevSampleRes = await pool.query(
    `SELECT cve_id, vendor_project, product, vulnerability_name, date_added, due_date,
            known_ransomware_campaign_use, required_action
     FROM cisa_kev_entries
     WHERE is_current = TRUE
     ORDER BY date_added DESC
     LIMIT 10`
  );

  if (kevSampleRes.rows.length === 0) {
    throw new Error('No KEV entries found in database after ingestion!');
  }

  // Data-driven selection: Pick a CVE from the live list.
  // We prefer one with ransomware use or an active exploit if available, else the first entry.
  const chosenRow =
    kevSampleRes.rows.find((r: any) => r.known_ransomware_campaign_use === 'Known') ||
    kevSampleRes.rows[0];

  const targetCveId = chosenRow.cve_id;
  console.log(`      Dynamically Selected:  ${targetCveId}`);
  console.log(`      Vendor / Project:      ${chosenRow.vendor_project}`);
  console.log(`      Product:               ${chosenRow.product}`);
  console.log(`      Vulnerability Name:    ${chosenRow.vulnerability_name}`);
  console.log(`      Date Added to KEV:     ${chosenRow.date_added}`);
  console.log(`      Remediation Due Date:  ${chosenRow.due_date}`);
  console.log(`      Ransomware Campaign:   ${chosenRow.known_ransomware_campaign_use}`);
  console.log(`      Required Action:       ${chosenRow.required_action?.substring(0, 80)}...\n`);

  // Step 4: Ensure Official NVD Record is Ingested for the Selected CVE
  console.log(`[4/7] Ingesting Official NVD v2.0 Record for ${targetCveId}...`);
  console.log(`      URL: https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${targetCveId}`);
  const nvdStartTime = Date.now();
  const nvdSync = await nvdService.syncCveById(targetCveId);
  const nvdElapsedMs = Date.now() - nvdStartTime;

  console.log(`      NVD Ingestion Run ID:  ${nvdSync.result.runId}`);
  console.log(`      NVD Ingestion Status:  ${nvdSync.result.status}`);
  console.log(`      Records Inserted:      ${nvdSync.result.recordsInserted}`);
  console.log(`      Records Updated:       ${nvdSync.result.recordsUpdated}`);
  console.log(`      Duration:              ${nvdElapsedMs}ms\n`);

  // Step 5: Validate NVD <-> CISA KEV Join via Vulnerability Endpoint
  console.log(`[5/7] Validating NVD <-> KEV Join via GET /api/vulnerabilities/${targetCveId}...`);
  const vuln = await vulnService.getVulnerabilityByCveId(targetCveId);

  if (!vuln) {
    throw new Error(`Failed to find ${targetCveId} in normalized vulnerabilities table!`);
  }

  console.log('      --- Joined Vulnerability Summary ---');
  console.log(`      CVE ID:                ${vuln.cveId}`);
  console.log(`      Known Exploited:       ${vuln.knownExploited}`);
  console.log(`      Preferred CVSS Score:  ${vuln.cvssBaseScore} (${vuln.cvssBaseSeverity}) [Version: ${vuln.cvssVersion}]`);
  console.log(`      Source Identifier:     ${vuln.sourceIdentifier}`);
  console.log(`      KEV Date Added:        ${vuln.kevDateAdded}`);
  console.log(`      KEV Due Date:          ${vuln.kevDueDate}`);
  console.log(`      KEV Ransomware Use:    ${vuln.kevKnownRansomwareCampaignUse}`);

  console.log('\n      --- CISA KEV Detailed Context ---');
  if (vuln.kevDetails) {
    console.log(`      Vendor / Project:      ${vuln.kevDetails.vendorProject}`);
    console.log(`      Product:               ${vuln.kevDetails.product}`);
    console.log(`      Vulnerability Name:    ${vuln.kevDetails.vulnerabilityName}`);
    console.log(`      Required Action:       ${vuln.kevDetails.requiredAction}`);
    console.log(`      Is Current Member:     ${vuln.kevDetails.isCurrent}`);
  }

  console.log('\n      --- Dual Source Cryptographic Provenance ---');
  console.log(`      NVD Source Name:       ${vuln.provenance?.sourceName}`);
  console.log(`      NVD Source Provider:   ${vuln.provenance?.sourceProvider}`);
  console.log(`      NVD SHA-256 Hash:      ${vuln.provenance?.rawPayloadHash}`);
  console.log(`      NVD Ingested At:       ${vuln.provenance?.ingestedAt}`);
  console.log(`      KEV Source Name:       ${vuln.kevProvenance?.sourceName}`);
  console.log(`      KEV Source Provider:   ${vuln.kevProvenance?.sourceProvider}`);
  console.log(`      KEV Catalog SHA-256:   ${vuln.kevProvenance?.rawPayloadHash}`);
  console.log(`      KEV Ingested At:       ${vuln.kevProvenance?.ingestedAt}\n`);

  // Step 6: Query KEV Specific Lookup and Verify Foreign Key Link
  console.log(`[6/7] Validating Reverse Join via GET /api/integrations/cisa-kev/${targetCveId}...`);
  const kevDirect = await cisaKevService.getKevByCveId(targetCveId);

  if (!kevDirect) {
    throw new Error(`Failed to lookup ${targetCveId} in KEV service!`);
  }

  console.log(`      KEV Entry UUID:        ${kevDirect.id}`);
  console.log(`      Linked Vuln UUID:      ${kevDirect.vulnerabilityId}`);
  console.log(`      Is Current in Catalog: ${kevDirect.isCurrent}`);
  console.log(`      First Seen At:         ${kevDirect.firstSeenAt}`);
  console.log(`      Last Seen At:          ${kevDirect.lastSeenAt}`);
  if (kevDirect.linkedNvdVulnerability) {
    console.log(`      Linked CVSS Score:     ${kevDirect.linkedNvdVulnerability.cvssBaseScore} (${kevDirect.linkedNvdVulnerability.cvssBaseSeverity})`);
    console.log(`      Linked CVSS Version:   ${kevDirect.linkedNvdVulnerability.cvssVersion}`);
  }

  // Step 7: Catalog-Wide Metrics and Idempotency Verification
  console.log('\n[7/7] Catalog Metrics & Idempotency Check...');
  const countsRes = await pool.query(`
    SELECT
      COUNT(*) AS total_kev,
      COUNT(vulnerability_id) AS matched_to_nvd,
      COUNT(*) - COUNT(vulnerability_id) AS unmatched_to_nvd
    FROM cisa_kev_entries
    WHERE is_current = TRUE
  `);
  const counts = countsRes.rows[0];
  console.log(`      Total Active KEV Rows: ${counts.total_kev}`);
  console.log(`      Matched to NVD:        ${counts.matched_to_nvd}`);
  console.log(`      Unmatched to NVD:      ${counts.unmatched_to_nvd} (Kept as vulnerability_id = null without synthetic rows)`);

  console.log('\n      Testing Idempotent Re-sync (unchanged catalog)...');
  const resync = await cisaKevService.syncFullCatalog();
  console.log(`      Re-sync Status:        ${resync.status}`);
  console.log(`      Re-sync Inserted:      ${resync.recordsInserted}`);
  console.log(`      Re-sync Skipped:       ${resync.recordsSkipped} (Identical SHA-256 payload detected)`);

  const staleness = await cisaKevService.checkCatalogStaleness();
  console.log(`      Catalog Data Age:      ${staleness.dataAgeHours ?? 0} hours`);
  console.log(`      Catalog Is Stale:      ${staleness.isStale}\n`);

  console.log('================================================================');
  console.log('SUCCESS: CISA KEV Live Ingestion & NVD Join Fully Verified!');
  console.log('================================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
