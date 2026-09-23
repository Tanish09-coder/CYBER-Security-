// =============================================================================
// CyberRiskOS — Security Controls Test Suite
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import request from 'supertest';
import express from 'express';
import { createOrganizationRouter } from '../../organizations/organizations.routes';
import { createAssetRouter } from '../../assets/assets.routes';
import { createControlsRouter } from '../controls.routes';
import { initMemoryDb } from '../../../db';

let app: express.Application;
let testOrgId: string;
let testAssetId: string;

beforeAll(async () => {
  process.env.USE_MEMORY_DB = 'true';
  await initMemoryDb();

  app = express();
  app.use(express.json());
  app.use('/api/organizations', createOrganizationRouter());
  app.use('/api/assets', createAssetRouter());
  app.use('/api/controls', createControlsRouter());

  // Setup parent org and asset
  const orgRes = await request(app)
    .post('/api/organizations')
    .send({ name: 'Controls Test Organization' });
  testOrgId = orgRes.body.id;

  const assetRes = await request(app)
    .post('/api/assets')
    .send({
      organization_id: testOrgId,
      name: 'Critical Domain Controller',
      hostname: 'dc-01.corp',
    });
  testAssetId = assetRes.body.id;
});

describe('Security Controls Catalog API', () => {
  it('should list all 7 seeded defensive controls in catalog', async () => {
    const res = await request(app)
      .get('/api/controls')
      .expect(200);

    expect(res.body).toHaveProperty('count', 7);
    expect(Array.isArray(res.body.data)).toBe(true);
    const codes = res.body.data.map((c: any) => c.code);
    expect(codes).toContain('MFA');
    expect(codes).toContain('EDR');
    expect(codes).toContain('BACKUP');
    expect(codes).toContain('SEGMENTATION');
    expect(codes).toContain('PAM');
    expect(codes).toContain('ENCRYPTION');
    expect(codes).toContain('MONITORING');
  });

  it('should retrieve a specific control by code', async () => {
    const res = await request(app)
      .get('/api/controls/MFA')
      .expect(200);

    expect(res.body.code).toBe('MFA');
    expect(res.body.name).toBe('Multi-Factor Authentication');
    expect(res.body.category).toBe('Identity & Access');
    expect(res.body.defaultMitigationWeight).toBe(0.85);
  });

  it('should return 404 for unknown control code', async () => {
    const res = await request(app)
      .get('/api/controls/NONEXISTENT')
      .expect(404);

    expect(res.body.error).toBe('NotFound');
  });
});

describe('Asset Control Posture API', () => {
  describe('POST /api/assets/:assetId/controls', () => {
    it('should assign a single control posture to an asset', async () => {
      const res = await request(app)
        .post(`/api/assets/${testAssetId}/controls`)
        .send({
          control_code: 'MFA',
          status: 'IMPLEMENTED',
          effectiveness_score: 0.95,
          source: 'USER_CONFIG',
          notes: 'FIDO2 hardware security keys enforced for all domain admins',
        })
        .expect(200);

      expect(res.body.count).toBe(1);
      expect(res.body.data[0].controlCode).toBe('MFA');
      expect(res.body.data[0].status).toBe('IMPLEMENTED');
      expect(res.body.data[0].effectivenessScore).toBe(0.95);
      expect(res.body.data[0].controlName).toBe('Multi-Factor Authentication');
    });

    it('should batch assign multiple controls with default mitigation weight calculation', async () => {
      const res = await request(app)
        .post(`/api/assets/${testAssetId}/controls`)
        .send({
          controls: [
            {
              control_code: 'EDR',
              status: 'IMPLEMENTED', // effectiveness defaults to 0.80
            },
            {
              control_code: 'BACKUP',
              status: 'PARTIAL', // effectiveness defaults to 0.75 * 0.5 = 0.375 -> rounded/handled
            },
            {
              control_code: 'SEGMENTATION',
              status: 'NOT_IMPLEMENTED', // effectiveness defaults to 0.00
            },
          ],
        })
        .expect(200);

      expect(res.body.count).toBe(3);
    });

    it('should return 404 when assigning non-existent control code', async () => {
      const res = await request(app)
        .post(`/api/assets/${testAssetId}/controls`)
        .send({
          control_code: 'UNKNOWN_CODE',
          status: 'IMPLEMENTED',
        })
        .expect(404);

      expect(res.body.error).toBe('NotFound');
    });

    it('should return 404 when assigning control on non-existent asset ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post(`/api/assets/${fakeId}/controls`)
        .send({
          control_code: 'MFA',
          status: 'IMPLEMENTED',
        })
        .expect(404);

      expect(res.body.error).toBe('NotFound');
    });
  });

  describe('GET /api/assets/:assetId/controls', () => {
    it('should list all controls assigned to an asset', async () => {
      const res = await request(app)
        .get(`/api/assets/${testAssetId}/controls`)
        .expect(200);

      expect(res.body.count).toBe(4); // MFA, EDR, BACKUP, SEGMENTATION
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 404 for non-existent asset ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/assets/${fakeId}/controls`)
        .expect(404);

      expect(res.body.error).toBe('NotFound');
    });
  });

  describe('PATCH /api/assets/:assetId/controls/:controlCode', () => {
    it('should update control implementation status and score on an asset', async () => {
      const res = await request(app)
        .patch(`/api/assets/${testAssetId}/controls/SEGMENTATION`)
        .send({
          status: 'IMPLEMENTED',
          effectiveness_score: 0.85,
          notes: 'VLAN micro-segmentation deployed',
        })
        .expect(200);

      expect(res.body.controlCode).toBe('SEGMENTATION');
      expect(res.body.status).toBe('IMPLEMENTED');
      expect(res.body.effectivenessScore).toBe(0.85);
      expect(res.body.notes).toBe('VLAN micro-segmentation deployed');
    });

    it('should return 404 when updating non-assigned control on asset', async () => {
      const res = await request(app)
        .patch(`/api/assets/${testAssetId}/controls/MONITORING`)
        .send({ status: 'IMPLEMENTED' })
        .expect(404);

      expect(res.body.error).toBe('NotFound');
    });
  });

  describe('DELETE /api/assets/:assetId/controls/:controlCode', () => {
    it('should remove a control assignment from an asset', async () => {
      await request(app)
        .delete(`/api/assets/${testAssetId}/controls/BACKUP`)
        .expect(200);

      const listRes = await request(app)
        .get(`/api/assets/${testAssetId}/controls`)
        .expect(200);

      const codes = listRes.body.data.map((c: any) => c.controlCode);
      expect(codes).not.toContain('BACKUP');
    });
  });

  describe('GET /api/controls?summary=true', () => {
    it('should return aggregated defensive coverage metrics', async () => {
      const res = await request(app)
        .get('/api/controls?summary=true')
        .expect(200);

      expect(res.body).toHaveProperty('totalCatalogControls', 7);
      expect(Array.isArray(res.body.controls)).toBe(true);

      const mfaSummary = res.body.controls.find((c: any) => c.code === 'MFA');
      expect(mfaSummary).toBeDefined();
      expect(mfaSummary.implementedCount).toBeGreaterThanOrEqual(1);
    });
  });
});
