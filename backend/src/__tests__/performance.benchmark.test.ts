// =============================================================================
// CyberRiskOS — Phase 9 Performance Benchmark Suite
// Measures actual median, p95, p99, and error rate across critical endpoints.
// =============================================================================

import request from 'supertest';
import { app } from '../server';
import { query, runMigrations } from '../db';

interface LatencyStats {
  requestCount: number;
  datasetSize: number;
  medianMs: number;
  p95Ms: number;
  p99Ms: number;
  errorRatePct: number;
}

function calculateStats(latencies: number[], errors: number, datasetSize: number): LatencyStats {
  latencies.sort((a, b) => a - b);
  const count = latencies.length;
  const p50Idx = Math.floor(count * 0.5);
  const p95Idx = Math.floor(count * 0.95);
  const p99Idx = Math.min(count - 1, Math.floor(count * 0.99));

  return {
    requestCount: count,
    datasetSize,
    medianMs: Math.round(latencies[p50Idx] * 10) / 10,
    p95Ms: Math.round(latencies[p95Idx] * 10) / 10,
    p99Ms: Math.round(latencies[p99Idx] * 10) / 10,
    errorRatePct: Math.round((errors / (count + errors)) * 1000) / 10,
  };
}

describe('Phase 9 Performance Benchmark Gate', () => {
  let orgId: string;
  let assetId: string;

  beforeAll(async () => {
    await runMigrations();

    // Setup benchmark organization
    const orgRes = await query(
      `INSERT INTO organizations (name, industry, employee_count, annual_revenue, currency)
       VALUES ('Perf Benchmark Org', 'Fintech', 1500, 150000000, 'INR')
       RETURNING id`
    );
    orgId = orgRes.rows[0].id;

    // Seed 25 benchmark assets
    for (let i = 1; i <= 25; i++) {
      const aRes = await query(
        `INSERT INTO assets (organization_id, name, asset_type, environment, business_criticality, is_internet_facing)
         VALUES ($1, $2, 'server', 'Production', $3, $4)
         RETURNING id`,
        [orgId, `Perf Asset ${i}`, (i % 5) + 1, i % 2 === 0]
      );
      if (i === 1) assetId = aRes.rows[0].id;
    }

    // Seed 20 vulnerabilities
    for (let i = 1; i <= 20; i++) {
      const cveId = `CVE-2024-${1000 + i}`;
      const vRes = await query(
        `INSERT INTO vulnerabilities (cve_id, description, cvss_base_score, cvss_base_severity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (cve_id) DO UPDATE SET cvss_base_score = EXCLUDED.cvss_base_score
         RETURNING id`,
        [cveId, `Benchmark vulnerability description ${i}`, 7.0 + (i % 3), 'HIGH']
      );
      const vulnId = vRes.rows[0].id;

      // Link to asset 1
      await query(
        `INSERT INTO asset_vulnerabilities (asset_id, vulnerability_id, cve_id, match_reason)
         VALUES ($1, $2, $3, 'CPE MATCH')
         ON CONFLICT DO NOTHING`,
        [assetId, vulnId, cveId]
      );
    }
  });

  it('Benchmark: GET /api/v1/risk/scores (Risk List)', async () => {
    const iterations = 50;
    const latencies: number[] = [];
    let errors = 0;

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      const res = await request(app).get(`/api/v1/risk/scores?organizationId=${orgId}&limit=20`);
      const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

      if (res.status === 200) {
        latencies.push(elapsed);
      } else {
        errors++;
      }
    }

    const stats = calculateStats(latencies, errors, 25);
    console.log('[PERF_BENCHMARK_RESULT] Risk List:', JSON.stringify(stats));
    expect(stats.errorRatePct).toBe(0);
    expect(stats.p95Ms).toBeLessThan(500);
  });

  it('Benchmark: GET /api/v1/financial/exposure (Financial Exposure List)', async () => {
    const iterations = 50;
    const latencies: number[] = [];
    let errors = 0;

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      const res = await request(app).get(`/api/v1/financial/exposure?organizationId=${orgId}&limit=20`);
      const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

      if (res.status === 200) {
        latencies.push(elapsed);
      } else {
        errors++;
      }
    }

    const stats = calculateStats(latencies, errors, 25);
    console.log('[PERF_BENCHMARK_RESULT] Financial Exposure List:', JSON.stringify(stats));
    expect(stats.errorRatePct).toBe(0);
    expect(stats.p95Ms).toBeLessThan(500);
  });

  it('Benchmark: GET /api/v1/executive/posture (Executive Posture Summary)', async () => {
    const iterations = 50;
    const latencies: number[] = [];
    let errors = 0;

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      const res = await request(app).get(`/api/v1/executive/posture?organizationId=${orgId}`);
      const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

      if (res.status === 200) {
        latencies.push(elapsed);
      } else {
        errors++;
      }
    }

    const stats = calculateStats(latencies, errors, 25);
    console.log('[PERF_BENCHMARK_RESULT] Executive Posture:', JSON.stringify(stats));
    expect(stats.errorRatePct).toBe(0);
    expect(stats.p95Ms).toBeLessThan(500);
  });

  it('Benchmark: GET /api/v1/compliance/frameworks (Compliance Coverage)', async () => {
    const iterations = 50;
    const latencies: number[] = [];
    let errors = 0;

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      const res = await request(app).get(`/api/v1/compliance/frameworks`);
      const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

      if (res.status === 200) {
        latencies.push(elapsed);
      } else {
        errors++;
      }
    }

    const stats = calculateStats(latencies, errors, 25);
    console.log('[PERF_BENCHMARK_RESULT] Compliance Frameworks:', JSON.stringify(stats));
    expect(stats.errorRatePct).toBe(0);
    expect(stats.p95Ms).toBeLessThan(500);
  });

  it('Benchmark: GET /api/v1/attack-paths (Attack Graph Query)', async () => {
    const iterations = 50;
    const latencies: number[] = [];
    let errors = 0;

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      const res = await request(app).get(`/api/v1/attack-paths?organizationId=${orgId}`);
      const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

      if (res.status === 200) {
        latencies.push(elapsed);
      } else {
        errors++;
      }
    }

    const stats = calculateStats(latencies, errors, 25);
    console.log('[PERF_BENCHMARK_RESULT] Attack Paths:', JSON.stringify(stats));
    expect(stats.errorRatePct).toBe(0);
    expect(stats.p95Ms).toBeLessThan(500);
  });
});
