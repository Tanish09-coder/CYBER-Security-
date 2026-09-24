import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { newDb, DataType } from 'pg-mem';

async function verifyMigrations() {
  console.log('Testing fresh migration application (001-004)...');
  const db = newDb({ noAstCoverageCheck: true });

  db.registerExtension('uuid-ossp', (schema: any) => {
    schema.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      impure: true,
      implementation: () => crypto.randomUUID(),
    });
  });

  db.public.registerFunction({
    name: 'uuid_generate_v4',
    returns: DataType.uuid,
    impure: true,
    implementation: () => crypto.randomUUID(),
  });

  const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  console.log('Found migrations:', files);

  const errors: { file: string; statement: string; error: string }[] = [];

  for (const file of files) {
    console.log(`Applying ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    
    // Split into individual SQL statements by semicolon, avoiding semicolons inside functions/triggers
    const statements = sql
      .replace(/--.*$/gm, '')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        db.public.none(stmt);
      } catch (err: any) {
        errors.push({
          file,
          statement: stmt.substring(0, 100),
          error: err.message,
        });
      }
    }
  }

  const expectedTables = [
    'data_sources',
    'data_ingestion_runs',
    'raw_source_records',
    'vulnerabilities',
    'cisa_kev_entries',
    'mitre_attack_releases',
    'mitre_attack_tactics',
    'mitre_attack_techniques',
    'mitre_attack_mitigations',
    'mitre_attack_groups',
    'mitre_attack_software',
    'mitre_attack_relationships',
    'mitre_attack_tactic_techniques',
    'vcdb_releases',
    'vcdb_incidents',
    'vcdb_incident_actors',
    'vcdb_incident_actions',
    'vcdb_incident_assets',
    'vcdb_incident_attributes',
    'vcdb_incident_timeline',
    'vcdb_incident_cves',
    'organizations',
    'business_units',
    'assets',
    'installed_software',
    'asset_vulnerabilities',
    'security_controls',
    'asset_controls',
    'organization_financial_parameters',
    'remediation_actions',
    'asset_dependencies',
    'compliance_frameworks',
    'compliance_controls',
    'control_compliance_mappings',
    'compliance_evidence',
    'risk_results',
    'financial_results',
  ];

  console.log('\nVerifying table existence in fresh schema...');
  const missingTables: string[] = [];
  for (const tbl of expectedTables) {
    try {
      const res = db.public.many(`SELECT * FROM ${tbl} LIMIT 1`);
      console.log(`✓ Table '${tbl}' verified.`);
    } catch (err: any) {
      missingTables.push(tbl);
      console.error(`✗ Table '${tbl}' missing:`, err.message);
    }
  }

  console.log('\n--- Migration Verification Summary ---');
  console.log('Total Migration Files Applied:', files.length);
  console.log('Total Statements Failed:', errors.length);
  if (errors.length > 0) {
    console.error('Errors encountered:', errors);
  }
  console.log('Missing Tables:', missingTables.length);

  if (errors.length > 0 || missingTables.length > 0) {
    throw new Error('Migration Verification Failed');
  }

  console.log('ALL MIGRATIONS 001-004 APPLY CLEANLY! ALL TABLES VERIFIED.');
}

verifyMigrations().catch(err => {
  console.error(err);
  process.exit(1);
});
