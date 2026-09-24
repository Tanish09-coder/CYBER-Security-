// =============================================================================
// CyberRiskOS — Enterprise Financial Context & Risk Inputs Tests
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import request from 'supertest';
import app from '../../../server';
import { query } from '../../../db';

describe('Enterprise Financial Context & Risk Inputs API', () => {
  let orgId: string;
  let assetId1: string;
  let assetId2: string;
  let complianceControlId: string;

  beforeAll(async () => {
    // Seed test organization
    const orgRes = await query<any>(
      `INSERT INTO organizations (name, industry, annual_revenue, currency)
       VALUES ('Acme Cyber Financial Corp', 'Banking', 50000000.00, 'USD')
       RETURNING id`
    );
    orgId = orgRes.rows[0].id;

    // Seed test assets
    const assetRes1 = await query<any>(
      `INSERT INTO assets (organization_id, name, asset_type, is_internet_facing, business_criticality, data_classification)
       VALUES ($1, 'Core Payment Gateway', 'server', true, 1, 'Financial')
       RETURNING id`,
      [orgId]
    );
    assetId1 = assetRes1.rows[0].id;

    const assetRes2 = await query<any>(
      `INSERT INTO assets (organization_id, name, asset_type, is_internet_facing, business_criticality, data_classification)
       VALUES ($1, 'Customer IAM Database', 'database', false, 2, 'PII')
       RETURNING id`,
      [orgId]
    );
    assetId2 = assetRes2.rows[0].id;

    // Seed a compliance control
    const compRes = await query<any>(
      `INSERT INTO compliance_controls (framework_id, requirement_code, title, description)
       SELECT id, 'PR.AC-1', 'Identities and Credentials Management', 'Access control policy enforcement'
       FROM compliance_frameworks WHERE code = 'NIST_CSF'
       LIMIT 1
       RETURNING id`
    );
    complianceControlId = compRes.rows[0]?.id;
  });

  afterAll(async () => {
    if (orgId) {
      await query(`DELETE FROM organizations WHERE id = $1`, [orgId]);
    }
  });

  // ---------------------------------------------------------------------------
  // Financial Parameters
  // ---------------------------------------------------------------------------
  describe('Financial Parameters API', () => {
    it('GET /api/organizations/:orgId/financial-parameters — should return unconfigured defaults when not set', async () => {
      const res = await request(app).get(`/api/organizations/${orgId}/financial-parameters`);
      expect(res.status).toBe(200);
      expect(res.body.isConfigured).toBe(false);
      expect(res.body.hourlyDowntimeCost).toBeNull();
      expect(res.body.hourlyRecoveryRate).toBeNull();
    });

    it('POST /api/organizations/:orgId/financial-parameters — should set financial parameters', async () => {
      const payload = {
        hourlyDowntimeCost: 15000.00,
        hourlyRecoveryRate: 200.00,
        costPerSensitiveRecord: 180.00,
        regulatoryBreachPenalty: 1000000.00,
        dailyTransactionVolume: 500000.00,
      };

      const res = await request(app)
        .post(`/api/organizations/${orgId}/financial-parameters`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.hourlyDowntimeCost).toBe(15000.00);
      expect(res.body.regulatoryBreachPenalty).toBe(1000000.00);
    });

    it('POST /api/organizations/:orgId/financial-parameters — should reject negative values', async () => {
      const res = await request(app)
        .post(`/api/organizations/${orgId}/financial-parameters`)
        .send({ hourlyDowntimeCost: -500 });

      expect(res.status).toBe(500); // Validation error handled by middleware
    });
  });

  // ---------------------------------------------------------------------------
  // Remediation Action Catalog
  // ---------------------------------------------------------------------------
  describe('Remediation Action Catalog API', () => {
    let actionId: string;

    it('POST /api/remediation-actions — should create a remediation action initiative', async () => {
      const payload = {
        organizationId: orgId,
        title: 'Enforce MFA on Admin Portals',
        actionType: 'ENABLE_CONTROL',
        remediationCost: 12000.00,
        estimatedEffortHours: 40,
        targetControlCode: 'MFA',
        affectedAssetIds: [assetId1],
      };

      const res = await request(app).post('/api/remediation-actions').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Enforce MFA on Admin Portals');
      expect(res.body.remediationCost).toBe(12000.00);
      expect(res.body.status).toBe('PLANNED');
      actionId = res.body.id;
    });

    it('GET /api/remediation-actions — should list remediation actions by organizationId', async () => {
      const res = await request(app).get(`/api/remediation-actions?organizationId=${orgId}`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.remediationActions[0].id).toBe(actionId);
    });
  });

  // ---------------------------------------------------------------------------
  // Asset Dependencies
  // ---------------------------------------------------------------------------
  describe('Asset Dependencies API', () => {
    it('POST /api/assets/:assetId/dependencies — should register asset dependency', async () => {
      const payload = {
        targetAssetId: assetId1,
        dependencyType: 'IDENTITY',
        propagationWeight: 0.35,
        notes: 'Payment gateway requires customer IAM database authentication',
      };

      const res = await request(app)
        .post(`/api/assets/${assetId2}/dependencies`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.sourceAssetId).toBe(assetId2);
      expect(res.body.targetAssetId).toBe(assetId1);
      expect(res.body.propagationWeight).toBe(0.35);
    });

    it('GET /api/assets/:assetId/dependencies — should fetch dependencies for an asset', async () => {
      const res = await request(app).get(`/api/assets/${assetId1}/dependencies`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Compliance Frameworks & Evidence
  // ---------------------------------------------------------------------------
  describe('Compliance Frameworks & Evidence API', () => {
    it('GET /api/compliance/frameworks — should list baseline compliance frameworks', async () => {
      const res = await request(app).get('/api/compliance/frameworks');
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(5);
      const codes = res.body.frameworks.map((f: any) => f.code);
      expect(codes).toContain('NIST_CSF');
      expect(codes).toContain('ISO_27001');
      expect(codes).toContain('CIS_V8');
      expect(codes).toContain('RBI_CSF');
      expect(codes).toContain('SEBI_CS');
    });

    it('POST /api/compliance/evidence — should record compliance evidence', async () => {
      if (!complianceControlId) return;

      const payload = {
        organizationId: orgId,
        complianceControlId,
        assetId: assetId1,
        evidenceUri: 's3://audit-vault/2026/mfa-policy.pdf',
        evidenceType: 'POLICY_DOCUMENT',
        status: 'VERIFIED',
      };

      const res = await request(app).post('/api/compliance/evidence').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('VERIFIED');
    });
  });

  // ---------------------------------------------------------------------------
  // Aggregated Enterprise Risk Inputs Bundle
  // ---------------------------------------------------------------------------
  describe('Aggregated Enterprise Risk Inputs Bundle API', () => {
    it('GET /api/enterprise-context/risk-inputs/:orgId — should bundle all authoritative risk inputs for Tanish Risk Engine', async () => {
      const res = await request(app).get(`/api/enterprise-context/risk-inputs/${orgId}`);
      expect(res.status).toBe(200);
      expect(res.body.organizationId).toBe(orgId);
      expect(res.body.currency).toBe('USD');
      expect(res.body.financialParameters.hourlyDowntimeCost).toBe(15000.00);
      expect(res.body.assets).toHaveLength(2);
      expect(res.body.remediationActions).toHaveLength(1);
    });
  });
});
