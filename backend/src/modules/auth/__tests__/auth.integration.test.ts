// =============================================================================
// CyberRiskOS — Authentication & Organization-Scoped Authorization Tests
// Phase 9 — Security Hardening Gate
// =============================================================================

import request from 'supertest';
import express from 'express';
import { createAuthRouter } from '../auth.routes';
import { requireAuth, requireOrgAccess, AuthenticatedRequest } from '../auth.middleware';
import { initMemoryDb } from '../../../db';

let app: express.Application;

beforeAll(async () => {
  process.env.USE_MEMORY_DB = 'true';
  process.env.JWT_SECRET = 'test-jwt-secret-key-phase9-testing-only-12345';
  await initMemoryDb();

  app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRouter());

  // Protected route simulating an organization-scoped endpoint
  app.get(
    '/api/test/orgs/:organizationId/secure-data',
    requireAuth,
    requireOrgAccess,
    (req: express.Request, res: express.Response) => {
      res.status(200).json({
        message: 'Access granted to organization data',
        organizationId: (req as AuthenticatedRequest).auth.organizationId,
      });
    }
  );
});

describe('Authentication & Authorization Suite (Phase 9)', () => {
  let orgAToken: string;
  let orgAId: string;
  let orgBToken: string;
  let orgBId: string;

  describe('POST /api/auth/register', () => {
    it('should register a new organization and admin user with explicit ISO-4217 currency', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          organizationName: 'Alpha Defense Corp',
          organizationCurrency: 'INR',
          organizationIndustry: 'Cybersecurity',
          email: 'admin@alphadefense.com',
          password: 'Password123!',
          fullName: 'Security Lead Alpha',
        })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.tokenType).toBe('Bearer');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('admin@alphadefense.com');
      expect(res.body.user.role).toBe('Administrator');
      expect(res.body.user.organizationId).toBeDefined();

      // SECURITY CRITICAL: Ensure password hash is NEVER leaked in response
      expect(res.body.user).not.toHaveProperty('password_hash');
      expect(res.body.user).not.toHaveProperty('password');

      orgAToken = res.body.accessToken;
      orgAId = res.body.user.organizationId;
    });

    it('should register a second organization (Org B)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          organizationName: 'Beta Finance Corp',
          organizationCurrency: 'USD',
          email: 'ciso@betafinance.com',
          password: 'Password123!',
          fullName: 'CISO Beta',
        })
        .expect(201);

      orgBToken = res.body.accessToken;
      orgBId = res.body.user.organizationId;
      expect(orgBId).not.toBe(orgAId);
    });

    it('should reject registration when currency is missing (no silent USD fallback)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          organizationName: 'No Currency Corp',
          email: 'noccy@example.com',
          password: 'Password123!',
          fullName: 'No Currency',
        })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });

    it('should reject invalid ISO-4217 currency code', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          organizationName: 'Invalid Currency Corp',
          organizationCurrency: 'INVALID',
          email: 'badccy@example.com',
          password: 'Password123!',
          fullName: 'Bad Currency',
        })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });

    it('should reject registration with duplicate email (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          organizationName: 'Duplicate Corp',
          organizationCurrency: 'USD',
          email: 'admin@alphadefense.com', // Duplicate
          password: 'Password123!',
          fullName: 'Duplicate User',
        })
        .expect(409);

      expect(res.body.error).toContain('already exists');
    });

    it('should reject password under 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          organizationName: 'Short PW Corp',
          organizationCurrency: 'USD',
          email: 'shortpw@example.com',
          password: 'short',
          fullName: 'Short Password',
        })
        .expect(400);

      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate user with valid credentials and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@alphadefense.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe('admin@alphadefense.com');
      expect(res.body.user.organizationId).toBe(orgAId);
    });

    it('should reject invalid password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@alphadefense.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(res.body.error).toBe('Invalid email or password.');
    });

    it('should reject non-existent email with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(res.body.error).toBe('Invalid email or password.');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return profile for authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(200);

      expect(res.body.email).toBe('admin@alphadefense.com');
      expect(res.body.organizationId).toBe(orgAId);
    });

    it('should reject request without authorization header with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.error).toBe('Unauthorized');
    });

    it('should reject request with tampered JWT token with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.token')
        .expect(401);

      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('Organization-Scoped Authorization (Cross-Tenant Isolation)', () => {
    it('should ALLOW user from Org A to access Org A data', async () => {
      const res = await request(app)
        .get(`/api/test/orgs/${orgAId}/secure-data`)
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(200);

      expect(res.body.organizationId).toBe(orgAId);
    });

    it('should BLOCK user from Org A trying to access Org B data (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/test/orgs/${orgBId}/secure-data`) // Org A user trying to access Org B
        .set('Authorization', `Bearer ${orgAToken}`)
        .expect(403);

      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toContain('another organization');
    });

    it('should BLOCK user from Org B trying to access Org A data (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/test/orgs/${orgAId}/secure-data`) // Org B user trying to access Org A
        .set('Authorization', `Bearer ${orgBToken}`)
        .expect(403);

      expect(res.body.error).toBe('Forbidden');
    });
  });
});
