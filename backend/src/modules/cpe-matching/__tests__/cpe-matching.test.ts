// =============================================================================
// CyberRiskOS — CPE Matching & Version Evaluation Test Suite
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import request from 'supertest';
import express from 'express';
import { createOrganizationRouter } from '../../organizations/organizations.routes';
import { createAssetRouter } from '../../assets/assets.routes';
import { createCpeMatchingRouter } from '../cpe-matching.routes';
import { compareVersions, parseCpe23, evaluateCpeMatch } from '../cpe-matching.evaluator';
import { initMemoryDb, query } from '../../../db';

let app: express.Application;
let testOrgId: string;
let testAssetId: string;
let log4jVulnId: string;

beforeAll(async () => {
  process.env.USE_MEMORY_DB = 'true';
  await initMemoryDb();

  app = express();
  app.use(express.json());
  app.use('/api/organizations', createOrganizationRouter());
  app.use('/api/assets', createAssetRouter());
  app.use('/api/cpe-matching', createCpeMatchingRouter());

  // Setup parent org and asset
  const orgRes = await request(app)
    .post('/api/organizations')
    .send({ name: 'CPE Test Organization', currency: 'USD' });
  testOrgId = orgRes.body.id;

  const assetRes = await request(app)
    .post('/api/assets')
    .send({
      organization_id: testOrgId,
      name: 'Vulnerable Log4j Web App',
      hostname: 'log4j-app.corp',
    });
  testAssetId = assetRes.body.id;

  // Register installed software
  await request(app)
    .post(`/api/assets/${testAssetId}/software`)
    .send({
      packages: [
        {
          vendor: 'Apache',
          product: 'Log4j',
          version: '2.14.1',
        },
        {
          vendor: 'OpenSSL',
          product: 'OpenSSL',
          version: '3.0.2',
        },
      ],
    });

  // Seed real vulnerability and CPE criteria into DB
  const vulnRes = await query(
    `INSERT INTO vulnerabilities (
      cve_id, description, cvss_base_score, cvss_base_severity, attack_vector, known_exploited, kev_known_ransomware_campaign_use
    ) VALUES (
      'CVE-2021-44228', 'Apache Log4j2 JNDI features do not protect against attacker controlled LDAP',
      10.0, 'CRITICAL', 'NETWORK', TRUE, 'KNOWN'
    ) RETURNING id`
  );
  log4jVulnId = vulnRes.rows[0].id;

  await query(
    `INSERT INTO vulnerability_cpes (
      vulnerability_id, criteria, vulnerable, version_start_including, version_end_excluding
    ) VALUES (
      $1, 'cpe:2.3:a:apache:log4j:*:*:*:*:*:*:*:*', TRUE, '2.0.0', '2.15.0'
    )`,
    [log4jVulnId]
  );
});

describe('Version Comparison Unit Tests', () => {
  it('should correctly compare numerical versions', () => {
    expect(compareVersions('2.14.1', '2.15.0')).toBe(-1);
    expect(compareVersions('2.15.0', '2.14.1')).toBe(1);
    expect(compareVersions('2.14.1', '2.14.1')).toBe(0);
    expect(compareVersions('3.0', '3.0.0')).toBe(0);
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
  });

  it('should handle version prefixes and wildcards', () => {
    expect(compareVersions('v2.14.1', '2.14.1')).toBe(0);
    expect(compareVersions('*', '2.14.1')).toBe(0);
  });
});

describe('CPE 2.3 Parser Unit Tests', () => {
  it('should parse valid CPE 2.3 formatted string', () => {
    const parsed = parseCpe23('cpe:2.3:a:apache:log4j:2.14.1:*:*:*:*:*:*:*');
    expect(parsed).not.toBeNull();
    expect(parsed?.part).toBe('a');
    expect(parsed?.vendor).toBe('apache');
    expect(parsed?.product).toBe('log4j');
    expect(parsed?.version).toBe('2.14.1');
  });

  it('should return null for malformed CPE string', () => {
    expect(parseCpe23('invalid-cpe-string')).toBeNull();
  });
});

describe('CPE Criteria Evaluator Unit Tests', () => {
  it('should match software within vulnerable version bounds', () => {
    const cpeRecord = {
      id: 'cpe-1',
      vulnerability_id: 'vuln-1',
      cve_id: 'CVE-2021-44228',
      criteria: 'cpe:2.3:a:apache:log4j:*:*:*:*:*:*:*:*',
      vulnerable: true,
      version_start_including: '2.0.0',
      version_start_excluding: null,
      version_end_including: null,
      version_end_excluding: '2.15.0',
    };

    const res = evaluateCpeMatch('Apache', 'Log4j', '2.14.1', cpeRecord, 'TestServer');
    expect(res.isMatch).toBe(true);
    expect(res.confidence).toBe(0.95);
    expect(res.matchType).toBe('CPE_VERSION_BOUND');
    expect(res.reason).toContain('Potential vulnerability match');
    expect(res.reason).not.toContain('compromised');
  });

  it('should not match software when patched version is above vulnerable bound', () => {
    const cpeRecord = {
      id: 'cpe-1',
      vulnerability_id: 'vuln-1',
      cve_id: 'CVE-2021-44228',
      criteria: 'cpe:2.3:a:apache:log4j:*:*:*:*:*:*:*:*',
      vulnerable: true,
      version_start_including: '2.0.0',
      version_start_excluding: null,
      version_end_including: null,
      version_end_excluding: '2.15.0',
    };

    const res = evaluateCpeMatch('Apache', 'Log4j', '2.17.1', cpeRecord, 'TestServer');
    expect(res.isMatch).toBe(false);
  });
});

describe('CPE Matching API Integration', () => {
  describe('POST /api/cpe-matching/evaluate', () => {
    it('should trigger evaluation and correlate vulnerable Log4j on asset', async () => {
      const res = await request(app)
        .post('/api/cpe-matching/evaluate')
        .send({ asset_id: testAssetId })
        .expect(200);

      expect(res.body.evaluatedAssets).toBe(1);
      expect(res.body.evaluatedPackages).toBe(2); // Log4j, OpenSSL
      expect(res.body.matchedVulnerabilities).toBe(1); // Only Log4j matches
    });

    it('should return 404 when evaluating non-existent asset ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post('/api/cpe-matching/evaluate')
        .send({ asset_id: fakeId })
        .expect(404);

      expect(res.body.error).toBe('NotFound');
    });
  });

  describe('GET /api/assets/:assetId/vulnerabilities', () => {
    it('should retrieve correlated vulnerabilities with enriched threat intelligence', async () => {
      const res = await request(app)
        .get(`/api/assets/${testAssetId}/vulnerabilities`)
        .expect(200);

      expect(res.body).toHaveProperty('count', 1);
      expect(Array.isArray(res.body.data)).toBe(true);

      const vuln = res.body.data[0];
      expect(vuln.cveId).toBe('CVE-2021-44228');
      expect(vuln.cvssScore).toBe(10.0);
      expect(vuln.cvssSeverity).toBe('CRITICAL');
      expect(vuln.isKev).toBe(true);
      expect(vuln.ransomwareCampaignUse).toBe('KNOWN');
      expect(vuln.matchConfidence).toBe(0.95);
      expect(vuln.matchType).toBe('CPE_VERSION_BOUND');
      expect(vuln.status).toBe('POTENTIAL_VULNERABILITY_MATCH');
      expect(vuln.matchReason).toContain('Potential vulnerability match');
      expect(vuln.softwareVendor).toBe('apache');
      expect(vuln.softwareProduct).toBe('log4j');
      expect(vuln.softwareVersion).toBe('2.14.1');
    });

    it('should return 404 for non-existent asset ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/assets/${fakeId}/vulnerabilities`)
        .expect(404);

      expect(res.body.error).toBe('NotFound');
    });
  });
});
