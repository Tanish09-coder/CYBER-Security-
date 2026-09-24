// =============================================================================
// CyberRiskOS — Auth Routes
// Phase 9 — Security Hardening
// POST /api/auth/register — create org + admin user atomically
// POST /api/auth/login    — authenticate and receive access token
// GET  /api/auth/me       — return current user profile (requires auth)
// =============================================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { authService } from './auth.service';
import { requireAuth } from './auth.middleware';
import type { AuthenticatedRequest } from './auth.middleware';
import { logger } from '../../config/logger';

// Strict rate limiter for auth endpoints to prevent brute force
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Too many authentication attempts. Please wait 15 minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
});

// Validation schemas
const registerSchema = z.object({
  organizationName: z.string().trim().min(1).max(255),
  organizationCurrency: z
    .string()
    .trim()
    .length(3, 'Currency must be a 3-letter ISO-4217 code (e.g. INR, USD, GBP, EUR)')
    .regex(/^[A-Z]{3}$/i, 'Currency must consist of 3 alphabetic characters')
    .transform((s) => s.toUpperCase()),
  organizationIndustry: z.string().trim().max(128).optional(),
  email: z.string().trim().email('A valid email address is required').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  fullName: z.string().trim().min(1).max(255),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

export function createAuthRouter(): Router {
  const router = Router();

  /**
   * POST /api/auth/register
   * Creates a new organization and administrator user atomically.
   * A caller cannot supply an existing organizationId.
   */
  router.post('/register', authRateLimiter, async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: parsed.error.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
      });
      return;
    }

    try {
      const result = await authService.register(parsed.data);
      res.status(201).json(result);
    } catch (err: any) {
      const status = err.status || 500;
      if (status < 500) {
        res.status(status).json({ error: err.message });
      } else {
        logger.error('Registration failed', { error: err.message });
        res.status(500).json({ error: 'Registration failed. Please try again.' });
      }
    }
  });

  /**
   * POST /api/auth/login
   * Authenticates an existing user and returns a Bearer access token.
   */
  router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation Error',
        details: parsed.error.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
      });
      return;
    }

    try {
      const result = await authService.login(parsed.data);
      res.json(result);
    } catch (err: any) {
      const status = err.status || 500;
      if (status < 500) {
        res.status(status).json({ error: err.message });
      } else {
        logger.error('Login failed', { error: err.message });
        res.status(500).json({ error: 'Login failed. Please try again.' });
      }
    }
  });

  /**
   * GET /api/auth/me
   * Returns the authenticated user's profile. Requires Bearer token.
   */
  router.get('/me', requireAuth, (req: Request, res: Response) => {
    const auth = (req as AuthenticatedRequest).auth;
    res.json({
      userId: auth.userId,
      email: auth.email,
      organizationId: auth.organizationId,
      role: auth.role,
    });
  });

  return router;
}
