// =============================================================================
// CyberRiskOS — Organizations & Business Units Test Suite
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import request from 'supertest';
import express from 'express';
import { createOrganizationRouter, createBusinessUnitRouter } from '../organizations.routes';
import { OrganizationController } from '../organizations.controller';
import { OrganizationService } from '../organizations.service';
import { OrganizationRepository } from '../organizations.repository';
import { initMemoryDb } from '../../../db';

let app: express.Application;

beforeAll(async () => {
  process.env.USE_MEMORY_DB = 'true';
  await initMemoryDb();

  app = express();
  app.use(express.json());
  app.use('/api/organizations', createOrganizationRouter());
  app.use('/api/business-units', createBusinessUnitRouter());
});

describe('Organizations API', () => {
  let createdOrgId: string;

  describe('POST /api/organizations', () => {
    it('should create an organization with required fields including ISO-4217 currency', async () => {
      const res = await request(app)
        .post('/api/organizations')
        .send({ name: 'Acme Corp', currency: 'USD' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Acme Corp');
      expect(res.body.currency).toBe('USD');
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('updatedAt');
      createdOrgId = res.body.id;
    });

    it('should reject organization creation when currency is missing (no silent fallback)', async () => {
      const res = await request(app)
        .post('/api/organizations')
        .send({ name: 'No Currency Corp' })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });

    it('should reject invalid ISO-4217 currency code', async () => {
      const res = await request(app)
        .post('/api/organizations')
        .send({ name: 'Invalid Currency Corp', currency: 'DOLLARS' })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });

    it('should create an organization with all fields', async () => {
      const res = await request(app)
        .post('/api/organizations')
        .send({
          name: 'Enterprise Holdings',
          industry: 'Finance',
          employee_count: 5000,
          annual_revenue: 250000000,
          currency: 'INR',
          metadata: { region: 'APAC' },
        })
        .expect(201);

      expect(res.body.name).toBe('Enterprise Holdings');
      expect(res.body.industry).toBe('Finance');
      expect(res.body.employeeCount).toBe(5000);
      expect(res.body.annualRevenue).toBe(250000000);
      expect(res.body.currency).toBe('INR');
      expect(res.body.metadata).toEqual({ region: 'APAC' });
    });

    it('should reject empty name', async () => {
      const res = await request(app)
        .post('/api/organizations')
        .send({ name: '' })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });

    it('should reject missing name', async () => {
      const res = await request(app)
        .post('/api/organizations')
        .send({ industry: 'Tech' })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });

    it('should reject negative employee_count', async () => {
      const res = await request(app)
        .post('/api/organizations')
        .send({ name: 'Bad Corp', employee_count: -5 })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/organizations/:id', () => {
    it('should retrieve a created organization', async () => {
      const res = await request(app)
        .get(`/api/organizations/${createdOrgId}`)
        .expect(200);

      expect(res.body.id).toBe(createdOrgId);
      expect(res.body.name).toBe('Acme Corp');
    });

    it('should return 404 for non-existent organization', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/organizations/${fakeId}`)
        .expect(404);

      expect(res.body.error).toBe('NotFound');
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await request(app)
        .get('/api/organizations/not-a-uuid')
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/organizations', () => {
    it('should list all organizations', async () => {
      const res = await request(app)
        .get('/api/organizations')
        .expect(200);

      expect(res.body).toHaveProperty('count');
      expect(res.body).toHaveProperty('data');
      expect(res.body.count).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PATCH /api/organizations/:id', () => {
    it('should update organization name', async () => {
      const res = await request(app)
        .patch(`/api/organizations/${createdOrgId}`)
        .send({ name: 'Acme Corp Updated' })
        .expect(200);

      expect(res.body.name).toBe('Acme Corp Updated');
      expect(res.body.id).toBe(createdOrgId);
    });

    it('should return 404 when updating non-existent org', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .patch(`/api/organizations/${fakeId}`)
        .send({ name: 'Ghost Corp' })
        .expect(404);

      expect(res.body.error).toBe('NotFound');
    });
  });

  describe('DELETE /api/organizations/:id', () => {
    it('should delete an organization', async () => {
      // Create a throwaway org for deletion
      const createRes = await request(app)
        .post('/api/organizations')
        .send({ name: 'Deletable Corp', currency: 'USD' })
        .expect(201);

      await request(app)
        .delete(`/api/organizations/${createRes.body.id}`)
        .expect(200);

      // Verify it's gone
      await request(app)
        .get(`/api/organizations/${createRes.body.id}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent org', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .delete(`/api/organizations/${fakeId}`)
        .expect(404);
    });
  });
});

describe('Business Units API', () => {
  let orgId: string;
  let buId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/organizations')
      .send({ name: 'BU Parent Org', currency: 'USD' })
      .expect(201);
    orgId = res.body.id;
  });

  describe('POST /api/business-units', () => {
    it('should create a business unit', async () => {
      const res = await request(app)
        .post('/api/business-units')
        .send({
          organization_id: orgId,
          name: 'Engineering',
          criticality_tier: 1,
          budget: 5000000,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.organizationId).toBe(orgId);
      expect(res.body.name).toBe('Engineering');
      expect(res.body.criticalityTier).toBe(1);
      expect(res.body.budget).toBe(5000000);
      buId = res.body.id;
    });

    it('should default criticality_tier to 3', async () => {
      const res = await request(app)
        .post('/api/business-units')
        .send({
          organization_id: orgId,
          name: 'Marketing',
        })
        .expect(201);

      expect(res.body.criticalityTier).toBe(3);
    });

    it('should reject invalid organization_id', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post('/api/business-units')
        .send({
          organization_id: fakeId,
          name: 'Orphan BU',
        })
        .expect(404);

      expect(res.body.error).toBe('NotFound');
    });

    it('should reject missing organization_id', async () => {
      const res = await request(app)
        .post('/api/business-units')
        .send({ name: 'No Parent' })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });

    it('should reject criticality_tier out of range', async () => {
      const res = await request(app)
        .post('/api/business-units')
        .send({
          organization_id: orgId,
          name: 'Bad Tier',
          criticality_tier: 10,
        })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/business-units', () => {
    it('should list all business units', async () => {
      const res = await request(app)
        .get('/api/business-units')
        .expect(200);

      expect(res.body).toHaveProperty('count');
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });

    it('should filter business units by organizationId', async () => {
      const res = await request(app)
        .get(`/api/business-units?organizationId=${orgId}`)
        .expect(200);

      expect(res.body.count).toBeGreaterThanOrEqual(1);
      res.body.data.forEach((bu: any) => {
        expect(bu.organizationId).toBe(orgId);
      });
    });
  });

  describe('GET /api/business-units/:id', () => {
    it('should retrieve a specific business unit', async () => {
      const res = await request(app)
        .get(`/api/business-units/${buId}`)
        .expect(200);

      expect(res.body.id).toBe(buId);
      expect(res.body.name).toBe('Engineering');
    });

    it('should return 404 for non-existent business unit', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/business-units/${fakeId}`)
        .expect(404);
    });
  });

  describe('PATCH /api/business-units/:id', () => {
    it('should update business unit name', async () => {
      const res = await request(app)
        .patch(`/api/business-units/${buId}`)
        .send({ name: 'Engineering (Renamed)' })
        .expect(200);

      expect(res.body.name).toBe('Engineering (Renamed)');
    });
  });

  describe('DELETE /api/business-units/:id', () => {
    it('should delete a business unit', async () => {
      const createRes = await request(app)
        .post('/api/business-units')
        .send({
          organization_id: orgId,
          name: 'Temp BU',
        })
        .expect(201);

      await request(app)
        .delete(`/api/business-units/${createRes.body.id}`)
        .expect(200);

      await request(app)
        .get(`/api/business-units/${createRes.body.id}`)
        .expect(404);
    });
  });
});
