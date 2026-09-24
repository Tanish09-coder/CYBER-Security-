// =============================================================================
// CyberRiskOS — Enterprise Asset Risk Inputs & Completeness Tests
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import request from 'supertest';
import app from '../../../server';
import { query } from '../../../db';

describe('Asset Risk Inputs & Completeness API (HARSH-P2-02)', () => {
  let orgId: string;
  let assetId: string;

  beforeAll(async () => {
    // Seed test organization
    const orgRes = await query<any>(
      `INSERT INTO organizations (name, industry, annual_revenue, currency)
       VALUES ('Risk Inputs Test Org', 'Technology', 10000000.00, 'USD')
       RETURNING id`
    );
    orgId = orgRes.rows[0].id;

    // Seed test asset
    const assetRes = await query<any>(
      `INSERT INTO assets (organization_id, name, asset_type, is_internet_facing, business_criticality, data_classification)
       VALUES ($1, 'Risk Inputs Server 01', 'server', true, 1, 'Restricted')
       RETURNING id`,
      [orgId]
    );
    assetId = assetRes.rows[0].id;

    // Seed asset control posture
    await query(
      `INSERT INTO asset_controls (asset_id, control_id, control_code, status, effectiveness_score, source)
       SELECT $1, id, code, 'IMPLEMENTED', 1.00, 'USER_CONFIG'
       FROM security_controls WHERE code = 'EDR'`,
      [assetId]
    );
  });

  afterAll(async () => {
    if (orgId) {
      await query(`DELETE FROM organizations WHERE id = $1`, [orgId]);
    }
  });

  it('GET /api/assets/:id/risk-inputs — should return asset risk inputs with provenance and completeness score', async () => {
    const res = await request(app).get(`/api/assets/${assetId}/risk-inputs`);

    expect(res.status).toBe(200);
    expect(res.body.assetId).toBe(assetId);
    expect(res.body.assetName).toBe('Risk Inputs Server 01');
    expect(res.body.criticalityTier).toBe(1);
    expect(res.body.isInternetFacing).toBe(true);
    expect(res.body.dataClassification).toBe('Restricted');
    expect(res.body.provenance).toBe('VERIFIED_ENTERPRISE_INPUT');
    expect(res.body.controls).toHaveLength(1);
    expect(res.body.controls[0].controlCode).toBe('EDR');
    expect(res.body.controls[0].status).toBe('IMPLEMENTED');
    expect(res.body.completenessScore).toBeGreaterThan(0.5);
  });

  it('GET /api/assets/:id/risk-inputs — should return 404 for non-existent asset ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app).get(`/api/assets/${nonExistentId}/risk-inputs`);
    expect(res.status).toBe(404);
  });

  it('GET /api/assets/risk-inputs/summary — should return risk inputs summary across assets', async () => {
    const res = await request(app).get(`/api/assets/risk-inputs/summary?organizationId=${orgId}`);

    expect(res.status).toBe(200);
    expect(res.body.totalAssets).toBeGreaterThanOrEqual(1);
    expect(res.body.internetFacingCount).toBeGreaterThanOrEqual(1);
    expect(res.body.criticalityDistribution).toBeDefined();
    expect(res.body.provenance).toBe('USER_CONFIG_AND_SCANNER_IMPORT');
  });
});
