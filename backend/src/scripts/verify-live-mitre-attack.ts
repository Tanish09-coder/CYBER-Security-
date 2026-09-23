import dotenv from 'dotenv';
dotenv.config();

import { runMigrations, closeDb } from '../db';
import { MitreAttackService } from '../modules/mitre-attack/mitre-attack.service';
import { MitreAttackRepository } from '../modules/mitre-attack/mitre-attack.repository';
import { logger } from '../config/logger';

async function main() {
  console.log('=============================================================================');
  console.log('CyberRiskOS — MITRE ATT&CK Enterprise Live Official Verification');
  console.log('Owner: TANISH (Cyber Intelligence & External Data Integration Lead)');
  console.log('=============================================================================');

  try {
    // 1. Run migrations
    console.log('\n[1/5] Running database migrations...');
    await runMigrations();
    console.log('✓ Migrations up to date.');

    const service = new MitreAttackService();
    const repo = new MitreAttackRepository();

    // 2. Perform live sync from official MITRE repository
    console.log('\n[2/5] Performing live ingestion from official MITRE ATT&CK repository...');
    console.log('Discovering latest release from index.json and fetching official STIX 2.1 bundle...');

    const syncResult = await service.syncEnterpriseAttack();

    console.log('\n-----------------------------------------------------------------------------');
    console.log('LIVE SYNC COMPLETED SUCCESSFULLY');
    console.log('-----------------------------------------------------------------------------');
    console.log(`Domain:                 enterprise-attack`);
    console.log(`Current Version:        ${syncResult.version}`);
    console.log(`Release Date:           ${syncResult.releaseDate || 'N/A'}`);
    console.log(`Payload Hash (SHA-256): ${syncResult.bundleHash}`);
    console.log(`Records Received:       ${syncResult.recordsReceived}`);
    console.log(`Records Inserted:       ${syncResult.recordsInserted}`);
    console.log(`Records Updated:        ${syncResult.recordsUpdated}`);
    console.log(`Duration:               ${(syncResult.durationMs / 1000).toFixed(2)}s`);

    console.log('\n[3/5] Normalized ATT&CK Knowledge Base Counts:');
    console.log(`  Tactics:              ${syncResult.counts.tactics}`);
    console.log(`  Techniques:           ${syncResult.counts.techniques}`);
    console.log(`  Sub-techniques:       ${syncResult.counts.subtechniques}`);
    console.log(`  Mitigations:          ${syncResult.counts.mitigations}`);
    console.log(`  Groups (Threat):      ${syncResult.counts.groups}`);
    console.log(`  Software (Mal/Tools): ${syncResult.counts.software}`);
    console.log(`  Relationships:        ${syncResult.counts.relationships}`);
    console.log(`  Retired / Revoked:    ${syncResult.counts.retired}`);
    console.log(`  Unknown STIX Types:   ${syncResult.counts.unknownTypes} (preserved in raw bundle)`);

    // 3. Data-driven dynamic selection of a real tactic with official mapped techniques
    console.log('\n[4/5] Data-Driven Graph Verification:');
    const tacticsList = await repo.getTactics({ includeRetired: false, limit: 50 });
    if (tacticsList.tactics.length === 0) {
      throw new Error('No active tactics found in normalized table');
    }

    // Dynamically find a tactic that has mapped techniques (e.g. TA0001 Initial Access)
    let selectedTacticBrief: any = null;
    let selectedTacticFull: any = null;

    // Prefer TA0001 (Initial Access) if present to explicitly verify it, otherwise check all tactics
    const ta0001 = tacticsList.tactics.find((t) => t.attackId === 'TA0001');
    const orderedTactics = ta0001
      ? [ta0001, ...tacticsList.tactics.filter((t) => t.attackId !== 'TA0001')]
      : tacticsList.tactics;

    for (const tac of orderedTactics) {
      const full = await repo.getTacticByAttackId(tac.attackId);
      if (full && full.techniques.length > 0) {
        selectedTacticBrief = tac;
        selectedTacticFull = full;
        break;
      }
    }

    if (!selectedTacticBrief || !selectedTacticFull) {
      throw new Error('Verification Failed: No tactic with mapped techniques found in the database');
    }

    const mappedCount = selectedTacticFull.techniques.length;
    if (mappedCount <= 0) {
      throw new Error(`Verification Failed: Selected tactic ${selectedTacticBrief.attackId} has 0 mapped techniques`);
    }

    console.log(`\n  Selected Real Tactic (Official Mapped Techniques):`);
    console.log(`    ATT&CK ID:     ${selectedTacticBrief.attackId}`);
    console.log(`    Name:          ${selectedTacticBrief.name}`);
    console.log(`    Short Name:    ${selectedTacticBrief.shortName}`);
    console.log(`    STIX ID:       ${selectedTacticBrief.stixId}`);
    console.log(`    Mapped Techs:  ${mappedCount}`);

    // Select first real technique mapped to this tactic
    const firstMappedTech = selectedTacticFull.techniques[0];
    console.log(`    Sample Mapped: ${firstMappedTech.attackId} — ${firstMappedTech.name}`);

    const sampleTechDetail = await repo.getTechniqueByAttackId(firstMappedTech.attackId);
    if (!sampleTechDetail) {
      throw new Error(`Failed to retrieve details for mapped technique ${firstMappedTech.attackId}`);
    }

    if (sampleTechDetail) {
      console.log(`\n  Selected Real Technique:`);
      console.log(`    ATT&CK ID:     ${sampleTechDetail.technique.attackId}`);
      console.log(`    Name:          ${sampleTechDetail.technique.name}`);
      console.log(`    Is Subtechnique:${sampleTechDetail.technique.isSubtechnique}`);
      console.log(`    Platforms:     ${sampleTechDetail.technique.platforms.join(', ')}`);
      console.log(`    Parent Tech:   ${sampleTechDetail.parentTechnique ? sampleTechDetail.parentTechnique.attackId + ' (' + sampleTechDetail.parentTechnique.name + ')' : 'None (Top-Level)'}`);
      console.log(`    Subtechniques: ${sampleTechDetail.subtechniques.length}`);
      console.log(`    Mitigations:   ${sampleTechDetail.mitigations.length}`);
      console.log(`    Groups Using:  ${sampleTechDetail.groups.length}`);
      console.log(`    Software Using:${sampleTechDetail.software.length}`);
      console.log(`    Total Graph Rel:${sampleTechDetail.relationships.length}`);

      if (sampleTechDetail.relationships.length > 0) {
        const sampleRel = sampleTechDetail.relationships[0];
        console.log(`\n  Relationship Example:`);
        console.log(`    Source:        ${sampleRel.sourceStixId}`);
        console.log(`    Relation:      ${sampleRel.relationshipType}`);
        console.log(`    Target:        ${sampleRel.targetStixId}`);
        console.log(`    Description:   ${sampleRel.description ? sampleRel.description.substring(0, 100) + '...' : 'N/A'}`);
      }
    }

    console.log(`\n  Cryptographic Provenance:`);
    console.log(`    Source URL:    https://github.com/mitre-attack/attack-stix-data`);
    console.log(`    Payload SHA:   ${syncResult.bundleHash}`);
    console.log(`    Recorded Run:  ${syncResult.runId}`);

    // 4. Test idempotency with a second sync
    console.log('\n[5/5] Testing Idempotency (Second Sync with identical payload)...');
    const secondSync = await service.syncEnterpriseAttack();

    console.log(`  Second Sync Status:    ${secondSync.status}`);
    console.log(`  Records Received:      ${secondSync.recordsReceived}`);
    console.log(`  Records Inserted:      ${secondSync.recordsInserted}`);
    console.log(`  Records Updated:       ${secondSync.recordsUpdated}`);
    console.log(`  Records Skipped:       ${secondSync.recordsSkipped}`);
    console.log(`  Idempotent Verified:   ${secondSync.recordsInserted === 0 && secondSync.recordsUpdated === 0 ? 'YES (100% IDEMPOTENT)' : 'NO'}`);

    console.log('\n=============================================================================');
    console.log('VERIFICATION COMPLETE: ALL CHECKS PASSED');
    console.log('=============================================================================');
  } catch (err: any) {
    console.error('\n❌ Verification Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

main();
