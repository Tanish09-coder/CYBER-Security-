import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

import { createNvdRouter, createVulnerabilityRouter } from './modules/nvd/nvd.routes';
import { createCisaKevRouter } from './modules/cisa-kev/cisa-kev.routes';
import { createMitreAttackRouter } from './modules/mitre-attack/mitre-attack.routes';
import { createVcdbRouter } from './modules/vcdb/vcdb.routes';
import { createOrganizationRouter, createBusinessUnitRouter } from './modules/organizations/organizations.routes';
import { createAssetRouter } from './modules/assets/assets.routes';
import { createSoftwareRouter } from './modules/software/software.routes';
import { createCpeMatchingRouter } from './modules/cpe-matching/cpe-matching.routes';
import { createControlsRouter } from './modules/controls/controls.routes';
import { createThreatIntelRouter } from './modules/threat-intel/threat-intel.routes';
import { createRiskRouter } from './modules/risk/risk.routes';
import { createFinancialRouter } from './modules/financial/financial.routes';
import { createScenariosRouter } from './modules/scenarios/scenarios.routes';
import { createOptimizationRouter } from './modules/optimization/optimization.routes';
import { createExecutiveRouter } from './modules/executive/executive.routes';
import { createAttackPathsRouter } from './modules/attack-paths/attack-paths.routes';
import { createAssistantRouter } from './modules/assistant/assistant.routes';
import { financialContextRouter } from './modules/financial-context/financial-context.routes';
import { createAuthRouter } from './modules/auth/auth.routes';
import { runMigrations } from './db';
import { logger } from './config/logger';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// -----------------------------------------------------------------------------
// Security: Helmet — HTTP security headers
// -----------------------------------------------------------------------------
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// -----------------------------------------------------------------------------
// Security: CORS — strict allowlist; never origin:true in production
// -----------------------------------------------------------------------------
const devOrigins = ['http://localhost:3000', 'http://localhost:5173'];
const allowedOrigins: string[] = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : devOrigins;

if (NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
  logger.error(
    '[Security] ALLOWED_ORIGINS is not set in production. '
    + 'CORS will deny all cross-origin requests. '
    + 'Set ALLOWED_ORIGINS to a comma-separated list of trusted origins.'
  );
}

const corsOriginFn = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Allow server-to-server (no origin header) and explicitly allowed origins
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`CORS: Origin '${origin}' is not in the allowlist.`));
  }
};

// In development, allow all origins to avoid friction; in production, use allowlist
app.use(
  cors({
    origin: NODE_ENV === 'production' ? corsOriginFn : true,
    credentials: true,
  })
);

// -----------------------------------------------------------------------------
// Security: Body size limit and request correlation IDs
// -----------------------------------------------------------------------------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Attach correlation ID to every request for tracing
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// -----------------------------------------------------------------------------
// Security: Rate limiting — protect expensive/sensitive endpoints
// -----------------------------------------------------------------------------
const defaultRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Rate limit exceeded. Please retry after the window expires.' },
  skip: () => NODE_ENV === 'test', // Skip in test environment
});

const expensiveEndpointLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Rate limit exceeded for computation-intensive endpoint.' },
  skip: () => NODE_ENV === 'test',
});

app.use(defaultRateLimiter);

// -----------------------------------------------------------------------------
// Health Check (Expose both canonical /health and API route /api/health)
// -----------------------------------------------------------------------------
const healthHandler = (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'cyberriskos-api-gateway',
    timestamp: new Date().toISOString(),
    requestId: (req as any).requestId,
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// -----------------------------------------------------------------------------
// Production Module Routers (Canonical & Compatibility Aliases)
// -----------------------------------------------------------------------------
// External Cyber Intelligence (Owner: TANISH)
const vulnRouter = createVulnerabilityRouter();
app.use('/api/vulnerabilities', vulnRouter);
app.use('/api/v1/vulnerabilities', vulnRouter);

app.use('/api/integrations/nvd', createNvdRouter());
app.use('/api/integrations/cisa-kev', createCisaKevRouter());

const mitreRouter = createMitreAttackRouter();
app.use('/api/integrations/mitre-attack', mitreRouter);
app.use('/api/v1/threats', mitreRouter);

const vcdbRouter = createVcdbRouter();
app.use('/api/integrations/vcdb', vcdbRouter);
app.use('/api/v1/incidents', vcdbRouter);

app.use('/api/threat-intel', createThreatIntelRouter());

// Enterprise Context APIs (Owner: HARSH)
const orgRouter = createOrganizationRouter();
app.use('/api/organizations', orgRouter);
app.use('/api/v1/organizations', orgRouter);

const buRouter = createBusinessUnitRouter();
app.use('/api/business-units', buRouter);
app.use('/api/v1/business-units', buRouter);

const assetRouter = createAssetRouter();
app.use('/api/assets', assetRouter);
app.use('/api/v1/assets', assetRouter);

const softwareRouter = createSoftwareRouter();
app.use('/api/software', softwareRouter);
app.use('/api/v1/software', softwareRouter);

const cpeRouter = createCpeMatchingRouter();
app.use('/api/cpe-matching', cpeRouter);
app.use('/api/v1/cpe-matching', cpeRouter);

const controlsRouter = createControlsRouter();
app.use('/api/controls', controlsRouter);
app.use('/api/v1/controls', controlsRouter);

// Enterprise Financial Context & Compliance (Owner: HARSH - Phase 2 & 7A)
app.use('/api', financialContextRouter);
app.use('/api/v1', financialContextRouter);

// Risk Quantification Engine (Owner: TANISH - Phase 2)
const riskRouter = createRiskRouter();
app.use('/api/risk', expensiveEndpointLimiter, riskRouter);
app.use('/api/v1/risk', expensiveEndpointLimiter, riskRouter);

// Financial Exposure & EAL Engine (Owner: TANISH - Phase 3)
const financialRouter = createFinancialRouter();
app.use('/api/financial', expensiveEndpointLimiter, financialRouter);
app.use('/api/v1/financial', expensiveEndpointLimiter, financialRouter);

// What-If Simulation Sandbox Engine (Owner: TANISH - Phase 4)
const scenariosRouter = createScenariosRouter();
app.use('/api/scenarios', expensiveEndpointLimiter, scenariosRouter);
app.use('/api/v1/scenarios', expensiveEndpointLimiter, scenariosRouter);

// Investment Optimization Engine (Owner: TANISH - Phase 5)
const optimizationRouter = createOptimizationRouter();
app.use('/api/optimization', expensiveEndpointLimiter, optimizationRouter);
app.use('/api/v1/optimization', expensiveEndpointLimiter, optimizationRouter);

// Executive Decision Dashboard (Owner: TANISH - Phase 6)
const executiveRouter = createExecutiveRouter();
app.use('/api/executive', executiveRouter);
app.use('/api/v1/executive', executiveRouter);

// Attack Path & Blast Radius Analysis (Owner: TANISH - Phase 7B)
const attackPathsRouter = createAttackPathsRouter();
app.use('/api/attack-paths', attackPathsRouter);
app.use('/api/v1/attack-paths', attackPathsRouter);

// AI Explanation Assistant (Owner: TANISH - Phase 8)
const assistantRouter = createAssistantRouter();
app.use('/api/assistant', expensiveEndpointLimiter, assistantRouter);
app.use('/api/v1/assistant', expensiveEndpointLimiter, assistantRouter);

// Authentication & Authorization (Phase 9)
const authRouter = createAuthRouter();
app.use('/api/auth', authRouter);
app.use('/api/v1/auth', authRouter);

// -----------------------------------------------------------------------------
// Structural Route Registrations (Phase 5+ Implementations)
// -----------------------------------------------------------------------------
const routeNotice = (moduleName: string) => (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not Implemented',
    module: moduleName,
    message: `Structural route registered. Implementation scheduled in the development roadmap.`,
  });
};

// Domain Route Groups scheduled for future phases
app.use('/api/v1/auth', routeNotice('Authentication & RBAC'));
app.use('/api/v1/telemetry', routeNotice('Security Telemetry Ingestion (CSV/JSON/REST)'));
app.use('/api/v1/reports', routeNotice('Executive & Audit Reporting'));


// Global error handling middleware — never expose stack traces in production
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId;
  const isProduction = NODE_ENV === 'production';
  // Log internally with full details (never log Authorization header)
  logger.error('[API Error]', {
    requestId,
    method: req.method,
    path: req.path,
    error: err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
  const statusCode = (err as any).status || (err as any).statusCode || 500;
  res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
    error: statusCode === 500 ? 'Internal Server Error' : (err.message || 'Request Error'),
    message: isProduction && statusCode === 500
      ? 'An unexpected error occurred. Please contact the administrator.'
      : err.message,
    requestId,
  });
});


export async function startServer(port: number | string = PORT) {
  try {
    logger.info('[Bootstrap] Validating configuration and running database migrations...');
    await runMigrations();
    logger.info('[Bootstrap] Database migrations applied successfully.');

    return new Promise((resolve) => {
      const server = app.listen(port, () => {
        logger.info(`CyberRiskOS API Gateway listening on port ${port}`);
        console.log(`CyberRiskOS API Gateway listening on port ${port}`);
        console.log(`Health check: http://localhost:${port}/health`);
        console.log(`Vulnerabilities: http://localhost:${port}/api/vulnerabilities`);
        resolve(server);
      });
    });
  } catch (err: any) {
    logger.error('[Bootstrap Fatal Error]: Failed to initialize database migrations:', {
      error: err.message,
    });
    console.error('[Bootstrap Fatal Error]: Failed to initialize database migrations:', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw err;
  }
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('[Fatal Startup Failure]:', err);
    process.exit(1);
  });
}

export default app;
