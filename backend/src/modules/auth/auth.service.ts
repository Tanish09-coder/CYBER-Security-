// =============================================================================
// CyberRiskOS — Authentication Service
// Phase 9 — Security Hardening
// Rules:
//   - Passwords hashed with bcrypt (cost 12)
//   - Never log passwords, JWTs, or secrets
//   - Registration creates org + admin user atomically
//   - A user cannot attach themselves to an arbitrary existing organizationId
//   - JWT payload: userId, organizationId, email, role
// =============================================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, withTransaction } from '../../db';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type {
  AuthRegisterRequest,
  AuthLoginRequest,
  AuthLoginResponse,
  AuthTokenPayload,
} from './auth.types';

const BCRYPT_COST = 12;
const ACCESS_TOKEN_EXPIRY_SECONDS = 3600; // 1 hour

function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    algorithm: 'HS256',
  });
}

export class AuthService {
  /**
   * Register a new organization + admin user atomically.
   * A caller cannot supply an existing organizationId — the organization is
   * always created fresh in this transaction. This prevents account takeover
   * by attaching to an arbitrary existing org.
   */
  async register(req: AuthRegisterRequest): Promise<AuthLoginResponse> {
    // Validate currency ISO-4217 format before any DB operation
    const currency = req.organizationCurrency?.toUpperCase?.()?.trim();
    if (!currency || !/^[A-Z]{3}$/.test(currency)) {
      throw Object.assign(
        new Error('organizationCurrency must be a valid 3-letter ISO-4217 code (e.g. INR, USD, GBP, EUR)'),
        { status: 400 }
      );
    }

    // Check if email is already registered
    const existingUser = await query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [req.email.toLowerCase().trim()]
    );
    if (existingUser.rows.length > 0) {
      throw Object.assign(new Error('An account with this email address already exists.'), { status: 409 });
    }

    const passwordHash = await bcrypt.hash(req.password, BCRYPT_COST);

    return withTransaction(async (client) => {
      // 1. Create organization (currency is explicitly required)
      const orgResult = await client.query(
        `INSERT INTO organizations (name, industry, currency)
         VALUES ($1, $2, $3)
         RETURNING id, name, currency`,
        [
          req.organizationName.trim(),
          req.organizationIndustry?.trim() || null,
          currency,
        ]
      );
      const org = orgResult.rows[0];

      // 2. Create admin user scoped to that new organization
      const userResult = await client.query(
        `INSERT INTO users (organization_id, email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4, 'Administrator')
         RETURNING id, email, full_name, role, organization_id`,
        [org.id, req.email.toLowerCase().trim(), passwordHash, req.fullName.trim()]
      );
      const user = userResult.rows[0];

      logger.info('New organization and admin user registered', {
        organizationId: org.id,
        organizationName: org.name,
        userId: user.id,
        // Never log email, password, or JWT
      });

      const tokenPayload: AuthTokenPayload = {
        userId: user.id,
        organizationId: org.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = signAccessToken(tokenPayload);

      return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          organizationId: org.id,
        },
      };
    });
  }

  /**
   * Authenticate an existing user. Returns a JWT on success.
   */
  async login(req: AuthLoginRequest): Promise<AuthLoginResponse> {
    const email = req.email?.toLowerCase?.()?.trim();
    if (!email || !req.password) {
      throw Object.assign(new Error('Email and password are required.'), { status: 400 });
    }

    const result = await query<{
      id: string;
      email: string;
      password_hash: string;
      full_name: string;
      role: string;
      organization_id: string;
      is_active: boolean;
    }>(
      `SELECT id, email, password_hash, full_name, role, organization_id, is_active
       FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    const user = result.rows[0];
    // Use constant-time comparison regardless of whether user exists to prevent timing attacks
    const dummyHash = '$2b$12$invalidhashfortimingnormalization0000000000000000000';
    const passwordMatch = user
      ? await bcrypt.compare(req.password, user.password_hash)
      : await bcrypt.compare(req.password, dummyHash); // prevent timing attack

    if (!user || !passwordMatch || !user.is_active) {
      throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
    }

    logger.info('User authenticated', { userId: user.id, organizationId: user.organization_id });
    // Never log the token or password

    const tokenPayload: AuthTokenPayload = {
      userId: user.id,
      organizationId: user.organization_id,
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(tokenPayload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        organizationId: user.organization_id,
      },
    };
  }
}

export const authService = new AuthService();
