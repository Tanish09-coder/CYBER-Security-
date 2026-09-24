// =============================================================================
// CyberRiskOS — Enterprise Assets Test Suite
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import request from 'supertest';
import express from 'express';
import { createOrganizationRouter } from '../../organizations/organizations.routes';
import { createAssetRouter } from '../assets.routes';
import { initMemoryDb } from '../../../db';

let app: express.Application;
let testOrgId: string;

beforeAll(async () => {
  process.env.USE_MEMORY_DB = 'true';
  await initMemoryDb();

  app = express();
  app.use(express.json());
  app.use('/api/organizations', createOrganizationRouter());
  app.use('/api/assets', createAssetRouter());

  // Setup parent organization for tests
  const orgRes = await request(app)
    .post('/api/organizations')
    .send({ name: 'Asset Test Org', industry: 'Technology', currency: 'USD' });
  testOrgId = orgRes.body.id;
});

describe('Assets API', () => {
  let createdAssetId: string;

  describe('POST /api/assets', () => {
    it('should create an asset with minimum required fields', async () => {
      const res = await request(app)
        .post('/api/assets')
        .send({
          organization_id: testOrgId,
          name: 'Core Payment Gateway',
        })
        .expect(201);

      createdAssetId = res.body.id;
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Core Payment Gateway');
      expect(res.body.organizationId).toBe(testOrgId);
      expect(res.body.assetType).toBe('server');
      expect(res.body.environment).toBe('Production');
      expect(res.body.businessCriticality).toBeNull();
      expect(res.body.isInternetFacing).toBeNull();
      expect(res.body.dataClassification).toBe('Internal');
    });

    it('should create an asset with complete specifications', async () => {
      const res = await request(app)
        .post('/api/assets')
        .send({
          organization_id: testOrgId,
          name: 'Public Web Proxy',
          hostname: 'proxy-01.corp.local',
          ip_address: '192.168.10.50',
          mac_address: '00:1A:2B:3C:4D:5E',
          asset_type: 'network_appliance',
          operating_system: 'Ubuntu 22.04 LTS',
          environment: 'Production',
          owner: 'NetOps Team',
          is_internet_facing: true,
          business_criticality: 1,
          data_classification: 'Restricted',
          revenue_dependency_pct: 85.5,
          operational_importance: 92.0,
          metadata: { rack: 'A12', datacenter: 'US-East' },
        })
        .expect(201);

      expect(res.body.name).toBe('Public Web Proxy');
      expect(res.body.hostname).toBe('proxy-01.corp.local');
      expect(res.body.ipAddress).toBe('192.168.10.50');
      expect(res.body.macAddress).toBe('00:1A:2B:3C:4D:5E');
      expect(res.body.isInternetFacing).toBe(true);
      expect(res.body.businessCriticality).toBe(1);
      expect(res.body.revenueDependencyPct).toBe(85.5);
      expect(res.body.metadata).toEqual({ rack: 'A12', datacenter: 'US-East' });
    });

    it('should reject duplicate asset hostname in the same organization', async () => {
      const res = await request(app)
        .post('/api/assets')
        .send({
          organization_id: testOrgId,
          name: 'Duplicate Hostname Server',
          hostname: 'proxy-01.corp.local',
        })
        .expect(409);

      expect(res.body.error).toBe('Conflict');
      expect(res.body.message).toContain('Asset already exists');
    });

    it('should reject invalid MAC address format', async () => {
      const res = await request(app)
        .post('/api/assets')
        .send({
          organization_id: testOrgId,
          name: 'Invalid MAC Asset',
          mac_address: 'invalid-mac-address',
        })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });

    it('should reject non-existent organization', async () => {
      const fakeOrgId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post('/api/assets')
        .send({
          organization_id: fakeOrgId,
          name: 'Orphan Asset',
        })
        .expect(404);

      expect(res.body.error).toBe('NotFound');
    });
  });

  describe('GET /api/assets/:id', () => {
    it('should retrieve asset by ID', async () => {
      const res = await request(app)
        .get(`/api/assets/${createdAssetId}`)
        .expect(200);

      expect(res.body.id).toBe(createdAssetId);
      expect(res.body.name).toBe('Core Payment Gateway');
    });

    it('should return 404 for non-existent asset ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/assets/${fakeId}`)
        .expect(404);

      expect(res.body.error).toBe('NotFound');
    });
  });

  describe('GET /api/assets', () => {
    it('should list assets with pagination and metadata', async () => {
      const res = await request(app)
        .get('/api/assets?limit=10&page=1')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('limit', 10);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(2);
    });

    it('should filter assets by isInternetFacing', async () => {
      const res = await request(app)
        .get('/api/assets?isInternetFacing=true')
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      res.body.data.forEach((a: any) => {
        expect(a.isInternetFacing).toBe(true);
      });
    });

    it('should filter assets by search term matching hostname or name', async () => {
      const res = await request(app)
        .get('/api/assets?search=proxy-01')
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Public Web Proxy');
    });
  });

  describe('PATCH /api/assets/:id', () => {
    it('should partially update asset attributes', async () => {
      const res = await request(app)
        .patch(`/api/assets/${createdAssetId}`)
        .send({
          name: 'Core Payment Gateway v2',
          business_criticality: 1,
          is_internet_facing: true,
        })
        .expect(200);

      expect(res.body.name).toBe('Core Payment Gateway v2');
      expect(res.body.businessCriticality).toBe(1);
      expect(res.body.isInternetFacing).toBe(true);
    });

    it('should reject update if it causes identifier conflict', async () => {
      const res = await request(app)
        .patch(`/api/assets/${createdAssetId}`)
        .send({
          hostname: 'proxy-01.corp.local', // matches Public Web Proxy
        })
        .expect(409);

      expect(res.body.error).toBe('Conflict');
    });
  });

  describe('DELETE /api/assets/:id', () => {
    it('should delete an asset', async () => {
      const createRes = await request(app)
        .post('/api/assets')
        .send({
          organization_id: testOrgId,
          name: 'Temporary Decommissioned Server',
        })
        .expect(201);

      await request(app)
        .delete(`/api/assets/${createRes.body.id}`)
        .expect(200);

      await request(app)
        .get(`/api/assets/${createRes.body.id}`)
        .expect(404);
    });
  });

  describe('POST /api/assets/import/json', () => {
    it('should batch import assets and skip duplicates cleanly', async () => {
      const batchPayload = {
        organization_id: testOrgId,
        assets: [
          {
            name: 'DB Cluster Node 1',
            hostname: 'db-01.internal',
            ip_address: '10.0.1.10',
            asset_type: 'database_server',
            business_criticality: 1,
            data_classification: 'Restricted',
          },
          {
            name: 'DB Cluster Node 2',
            hostname: 'db-02.internal',
            ip_address: '10.0.1.11',
            asset_type: 'database_server',
            business_criticality: 1,
            data_classification: 'Restricted',
          },
          {
            name: 'DB Cluster Node 1 Duplicate',
            hostname: 'db-01.internal', // Duplicate within same org
            ip_address: '10.0.1.99',
            asset_type: 'database_server',
          },
        ],
      };

      const res = await request(app)
        .post('/api/assets/import/json')
        .send(batchPayload)
        .expect(200);

      expect(res.body.totalRows).toBe(3);
      expect(res.body.imported).toBe(2);
      expect(res.body.skippedDuplicates).toBe(1);
      expect(res.body.errors.length).toBe(0);
    });

    it('should return 400 when JSON import batch exceeds or has invalid data', async () => {
      const res = await request(app)
        .post('/api/assets/import/json')
        .send({
          organization_id: testOrgId,
          assets: [],
        })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/assets/import/csv', () => {
    it('should parse and import valid CSV asset data', async () => {
      const csvData = `name,hostname,ip_address,asset_type,business_criticality,is_internet_facing
Auth Server,auth-01.corp.internal,10.0.2.15,server,1,false
DNS Gateway,dns-01.corp.internal,10.0.2.53,network_appliance,2,true
Worker Node 1,worker-01.corp.internal,10.0.3.1,cloud_instance,3,false`;

      const res = await request(app)
        .post('/api/assets/import/csv')
        .set('X-Organization-Id', testOrgId)
        .set('Content-Type', 'text/csv')
        .send(csvData)
        .expect(200);

      expect(res.body.totalRows).toBe(3);
      expect(res.body.imported).toBe(3);
      expect(res.body.skippedDuplicates).toBe(0);
      expect(res.body.errors.length).toBe(0);
    });

    it('should handle CSV with row-level validation errors and partial imports', async () => {
      const csvWithErrors = `asset_name,hostname,ip_address,business_criticality
Valid Asset 1,val-01.corp.internal,10.0.4.1,2
Invalid Criticality Asset,inv-01.corp.internal,10.0.4.2,99
Invalid IP Asset,inv-02.corp.internal,999.999.999.999,3`;

      const res = await request(app)
        .post('/api/assets/import/csv')
        .set('X-Organization-Id', testOrgId)
        .set('Content-Type', 'text/csv')
        .send(csvWithErrors)
        .expect(200);

      expect(res.body.totalRows).toBe(3);
      expect(res.body.imported).toBe(1);
      expect(res.body.errors.length).toBe(2);
      expect(res.body.errors[0].row).toBe(3); // Line 3: Invalid Criticality Asset
      expect(res.body.errors[1].row).toBe(4); // Line 4: Invalid IP Asset
    });

    it('should reject CSV missing required name column', async () => {
      const badCsv = `hostname,ip_address,asset_type
srv-01.corp.internal,10.0.5.1,server`;

      const res = await request(app)
        .post('/api/assets/import/csv')
        .set('X-Organization-Id', testOrgId)
        .set('Content-Type', 'text/csv')
        .send(badCsv)
        .expect(200);

      expect(res.body.imported).toBe(0);
      expect(res.body.errors.length).toBe(1);
      expect(res.body.errors[0].message).toContain('Missing required "name"');
    });
  });
});
