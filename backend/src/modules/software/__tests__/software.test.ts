// =============================================================================
// CyberRiskOS — Software Inventory Test Suite
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import request from 'supertest';
import express from 'express';
import { createOrganizationRouter } from '../../organizations/organizations.routes';
import { createAssetRouter } from '../../assets/assets.routes';
import { createSoftwareRouter } from '../software.routes';
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
  app.use('/api/software', createSoftwareRouter());

  // Setup parent org and asset
  const orgRes = await request(app)
    .post('/api/organizations')
    .send({ name: 'Software Test Org', currency: 'USD' });
  testOrgId = orgRes.body.id;

  const assetRes = await request(app)
    .post('/api/assets')
    .send({
      organization_id: testOrgId,
      name: 'Application Server Node 1',
      hostname: 'app-node-01.local',
    });
  testAssetId = assetRes.body.id;
});

describe('Software Inventory API', () => {
  let createdSoftwareId: string;

  describe('POST /api/assets/:assetId/software', () => {
    it('should register a single software package on an asset', async () => {
      const res = await request(app)
        .post(`/api/assets/${testAssetId}/software`)
        .send({
          vendor: 'Apache',
          product: 'Log4j',
          version: '2.14.1',
          release: 'ga',
          cpe23: 'cpe:2.3:a:apache:log4j:2.14.1:*:*:*:*:*:*:*',
          install_path: '/opt/apps/lib/log4j-core-2.14.1.jar',
        })
        .expect(201);

      expect(res.body).toHaveProperty('count', 1);
      expect(Array.isArray(res.body.data)).toBe(true);
      const pkg = res.body.data[0];
      expect(pkg.vendor).toBe('apache'); // normalized lowercase
      expect(pkg.product).toBe('log4j'); // normalized lowercase
      expect(pkg.version).toBe('2.14.1');
      expect(pkg.assetId).toBe(testAssetId);
      expect(pkg.installPath).toBe('/opt/apps/lib/log4j-core-2.14.1.jar');
      createdSoftwareId = pkg.id;
    });

    it('should register a batch of software packages', async () => {
      const res = await request(app)
        .post(`/api/assets/${testAssetId}/software`)
        .send({
          packages: [
            {
              vendor: 'OpenSSL',
              product: 'OpenSSL',
              version: '3.0.2',
            },
            {
              vendor: 'Oracle',
              product: 'JDK',
              version: '17.0.2',
            },
            {
              vendor: 'Nginx',
              product: 'Nginx',
              version: '1.24.0',
            },
          ],
        })
        .expect(201);

      expect(res.body.count).toBe(3);
      expect(res.body.data.length).toBe(3);
    });

    it('should upsert when the same software package version is registered again', async () => {
      const res = await request(app)
        .post(`/api/assets/${testAssetId}/software`)
        .send({
          vendor: 'Apache',
          product: 'Log4j',
          version: '2.14.1',
          install_path: '/opt/apps/lib/new-path/log4j.jar',
        })
        .expect(201);

      expect(res.body.count).toBe(1);
      expect(res.body.data[0].id).toBe(createdSoftwareId);
      expect(res.body.data[0].installPath).toBe('/opt/apps/lib/new-path/log4j.jar');
    });

    it('should return 404 when registering software on non-existent asset', async () => {
      const fakeAssetId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post(`/api/assets/${fakeAssetId}/software`)
        .send({
          vendor: 'Apache',
          product: 'Tomcat',
          version: '9.0.50',
        })
        .expect(404);

      expect(res.body.error).toBe('NotFound');
    });

    it('should return 400 for missing required vendor, product, or version', async () => {
      const res = await request(app)
        .post(`/api/assets/${testAssetId}/software`)
        .send({
          vendor: 'Apache',
        })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/assets/:assetId/software', () => {
    it('should list all software packages installed on an asset', async () => {
      const res = await request(app)
        .get(`/api/assets/${testAssetId}/software`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body.total).toBe(4); // log4j, openssl, jdk, nginx
      expect(res.body.data.length).toBe(4);
    });

    it('should filter software packages by vendor', async () => {
      const res = await request(app)
        .get(`/api/assets/${testAssetId}/software?vendor=apache`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].product).toBe('log4j');
    });

    it('should filter software packages by search term', async () => {
      const res = await request(app)
        .get(`/api/assets/${testAssetId}/software?search=ssl`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].product).toBe('openssl');
    });

    it('should return 404 for non-existent asset ID', async () => {
      const fakeAssetId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/assets/${fakeAssetId}/software`)
        .expect(404);

      expect(res.body.error).toBe('NotFound');
    });
  });

  describe('GET /api/software/:id', () => {
    it('should retrieve a software package by ID', async () => {
      const res = await request(app)
        .get(`/api/software/${createdSoftwareId}`)
        .expect(200);

      expect(res.body.id).toBe(createdSoftwareId);
      expect(res.body.product).toBe('log4j');
    });

    it('should return 404 for non-existent software package ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/software/${fakeId}`)
        .expect(404);

      expect(res.body.error).toBe('NotFound');
    });
  });

  describe('PATCH /api/software/:id', () => {
    it('should update software release or install_path', async () => {
      const res = await request(app)
        .patch(`/api/software/${createdSoftwareId}`)
        .send({
          release: 'p1',
          install_path: '/usr/local/log4j.jar',
        })
        .expect(200);

      expect(res.body.release).toBe('p1');
      expect(res.body.installPath).toBe('/usr/local/log4j.jar');
    });
  });

  describe('DELETE /api/software/:id', () => {
    it('should delete a software package', async () => {
      const registerRes = await request(app)
        .post(`/api/assets/${testAssetId}/software`)
        .send({
          vendor: 'TempVendor',
          product: 'TempProduct',
          version: '1.0.0',
        })
        .expect(201);

      const tempId = registerRes.body.data[0].id;

      await request(app)
        .delete(`/api/software/${tempId}`)
        .expect(200);

      await request(app)
        .get(`/api/software/${tempId}`)
        .expect(404);
    });
  });

  describe('Cascade Deletion', () => {
    it('should cascade delete software packages when parent asset is deleted', async () => {
      const assetRes = await request(app)
        .post('/api/assets')
        .send({
          organization_id: testOrgId,
          name: 'Disposable Asset with Software',
        });
      const dispAssetId = assetRes.body.id;

      const swRes = await request(app)
        .post(`/api/assets/${dispAssetId}/software`)
        .send({
          vendor: 'Redis',
          product: 'Redis',
          version: '7.0.0',
        });
      const swId = swRes.body.data[0].id;

      // Delete asset
      await request(app)
        .delete(`/api/assets/${dispAssetId}`)
        .expect(200);

      // Verify software was cascaded
      await request(app)
        .get(`/api/software/${swId}`)
        .expect(404);
    });
  });
});
