import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
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
import { runMigrations } from './db';
import { logger } from './config/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration supporting configurable origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production' && process.env.ALLOWED_ORIGINS
        ? allowedOrigins
        : true,
    credentials: true,
  })
);
app.use(express.json());

// -----------------------------------------------------------------------------
// Health Check & Diagnostic Blueprint
// -----------------------------------------------------------------------------
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'cyberriskos-api-gateway',
    timestamp: new Date().toISOString(),
  });
});

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

// -----------------------------------------------------------------------------
// Structural Route Registrations (Phase 3+ Implementations)
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
app.use('/api/v1/risk', routeNotice('Risk Quantification & Snapshot Engine'));
app.use('/api/v1/scenarios', routeNotice('What-If Simulation Sandbox'));
app.use('/api/v1/optimizer', routeNotice('Security Investment Optimizer'));
app.use('/api/v1/attack-paths', routeNotice('Attack Path & Blast Radius Analysis'));
app.use('/api/v1/compliance', routeNotice('Compliance Mapping (NIST, ISO, CIS, RBI, SEBI)'));
app.use('/api/v1/reports', routeNotice('Executive & Audit Reporting'));
app.use('/api/v1/assistant', routeNotice('Grounded AI Decision Support'));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('[API Gateway Error]:', { error: err.message, stack: err.stack });
  const safeMessage =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please contact the administrator.'
      : err.message;
  res.status(500).json({ error: 'Internal Server Error', message: safeMessage });
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
