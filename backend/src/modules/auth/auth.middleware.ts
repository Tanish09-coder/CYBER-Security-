// =============================================================================
// CyberRiskOS — Auth Middleware (JWT verification + Org-scoped Authorization)
// Phase 9 — Security Hardening
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type { AuthTokenPayload } from './auth.types';

/**
 * Extends Express Request with the authenticated user context.
 */
export interface AuthenticatedRequest extends Request {
  auth: AuthTokenPayload;
}

/**
 * requireAuth — verifies the Bearer JWT in the Authorization header.
 * Attaches the decoded payload to req.auth.
 * Returns 401 if missing or invalid, 403 if expired.
 * Never logs the raw token value.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'A valid Bearer token is required.',
    });
    return;
  }

  const token = authHeader.slice(7); // Never log this
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as AuthTokenPayload;
    (req as AuthenticatedRequest).auth = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'TokenExpired', message: 'Access token has expired. Please log in again.' });
    } else {
      logger.warn('JWT verification failed', { reason: err.message }); // Never log the token
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid access token.' });
    }
  }
}

/**
 * requireOrgAccess — ensures the authenticated user belongs to the organization
 * referenced in the request. Prevents cross-organization data access by checking
 * route params, query params, and body for organizationId.
 *
 * MUST be used after requireAuth.
 *
 * Sensitive resource IDs (assetId, resultId, financialResultId, etc.) are
 * scoped to the org in repository queries, not checked here individually.
 * This middleware enforces the organizationId parameter explicitly.
 */
export function requireOrgAccess(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
    return;
  }

  const requestedOrgId =
    req.params.organizationId ||
    req.params.orgId ||
    req.query.organizationId as string ||
    (req.body as any)?.organizationId;

  if (requestedOrgId && requestedOrgId !== authReq.auth.organizationId) {
    logger.warn('Cross-organization access attempt blocked', {
      userId: authReq.auth.userId,
      userOrgId: authReq.auth.organizationId,
      requestedOrgId,
      path: req.path,
      method: req.method,
    });
    res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have access to data belonging to another organization.',
    });
    return;
  }

  next();
}

/**
 * requireRole — restricts access to users with specific roles.
 * MUST be used after requireAuth.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.auth || !roles.includes(authReq.auth.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${roles.join(', ')}.`,
      });
      return;
    }
    next();
  };
}
