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
import { createRiskRouter } from './modules/risk/risk.routes';
import { createFinancialRouter } from './modules/financial/financial.routes';
import { createScenariosRouter } from './modules/scenarios/scenarios.routes';
import { createOptimizationRouter } from './modules/optimization/optimization.routes';
import { createExecutiveRouter } from './modules/executive/executive.routes';
import { createAttackPathsRouter } from './modules/attack-paths/attack-paths.routes';
import { createAssistantRouter } from './modules/assistant/assistant.routes';
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

// Risk Quantification Engine (Owner: TANISH - Phase 2)
const riskRouter = createRiskRouter();
app.use('/api/risk', riskRouter);
app.use('/api/v1/risk', riskRouter);

// Financial Exposure & EAL Engine (Owner: TANISH - Phase 3)
const financialRouter = createFinancialRouter();
app.use('/api/financial', financialRouter);
app.use('/api/v1/financial', financialRouter);

// What-If Simulation Sandbox Engine (Owner: TANISH - Phase 4)
const scenariosRouter = createScenariosRouter();
app.use('/api/scenarios', scenariosRouter);
app.use('/api/v1/scenarios', scenariosRouter);

// Investment Optimization Engine (Owner: TANISH - Phase 5)
const optimizationRouter = createOptimizationRouter();
app.use('/api/optimization', optimizationRouter);
app.use('/api/v1/optimization', optimizationRouter);

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
app.use('/api/assistant', assistantRouter);
app.use('/api/v1/assistant', assistantRouter);

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
app.use('/api/v1/compliance', routeNotice('Compliance Mapping (NIST, ISO, CIS, RBI, SEBI)'));
app.use('/api/v1/reports', routeNotice('Executive & Audit Reporting'));

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
