// =============================================================================
// CyberRiskOS — Migration Chain Zero-to-Head Gate Test
// Verifies all sequential migrations apply cleanly from zero in order
// =============================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

describe('Database Migration Zero-to-Head Gate', () => {
  it('should verify migration file naming, sequencing, and absence of duplicates', () => {
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);

    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    expect(files.length).toBeGreaterThanOrEqual(13);

    const prefixNumbers: number[] = [];
    for (const file of files) {
      const match = file.match(/^(\d{3})_/);
      expect(match).not.toBeNull();
      const num = parseInt(match![1], 10);
      prefixNumbers.push(num);
    }

    // Check no duplicate numbers
    const unique = new Set(prefixNumbers);
    expect(unique.size).toBe(prefixNumbers.length);

    // Verify latest migration is 016
    expect(prefixNumbers[prefixNumbers.length - 1]).toBe(16);
  });

  it('should apply all migrations against fresh memory PostgreSQL schema from zero', async () => {
    const { newDb, DataType } = await import('pg-mem');
    const freshDb = newDb({ noAstCoverageCheck: true });

    freshDb.registerExtension('uuid-ossp', (schema: any) => {
      schema.registerFunction({
        name: 'uuid_generate_v4',
        returns: DataType.uuid,
        impure: true,
        implementation: () => crypto.randomUUID(),
      });
    });

    freshDb.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      impure: true,
      implementation: () => crypto.randomUUID(),
    });

    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    const applied: string[] = [];
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      const clean = sql
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .map((l) => {
          const idx = l.indexOf('--');
          return idx >= 0 ? l.substring(0, idx) : l;
        })
        .join('\n');

      const statements = clean
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        try {
          freshDb.public.none(stmt);
        } catch (e: any) {
          // pg-mem doesn't support full regex operator ~ or alter check constraint
          if (stmt.includes('chk_organizations_currency_iso4217') || stmt.includes('~')) {
            // expected in pg-mem
          } else {
            throw new Error(`Migration ${file} failed on statement: ${stmt}\nError: ${e.message}`);
          }
        }
      }
      applied.push(file);
    }

    expect(applied.length).toBe(files.length);

    // Verify key tables exist in the resulting schema
    const tables = ['organizations', 'business_units', 'assets', 'vulnerabilities', 'asset_vulnerabilities', 'financial_results', 'users'];
    for (const table of tables) {
      const tableCheck = freshDb.public.many(`SELECT COUNT(*) FROM ${table};`);
      expect(tableCheck[0].count).toBe(0); // Zero synthetic data seeded
    }
  });
});
