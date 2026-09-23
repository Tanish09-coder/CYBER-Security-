import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { createNvdRouter, createVulnerabilityRouter } from './modules/nvd/nvd.routes';
import { createCisaKevRouter } from './modules/cisa-kev/cisa-kev.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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
// Implemented Production Modules
// -----------------------------------------------------------------------------
// NVD Ingestion & Integration API
app.use('/api/integrations/nvd', createNvdRouter());
// CISA KEV Ingestion & Integration API
app.use('/api/integrations/cisa-kev', createCisaKevRouter());
// Normalized Vulnerabilities Query API
app.use('/api/vulnerabilities', createVulnerabilityRouter());
app.use('/api/v1/vulnerabilities', createVulnerabilityRouter());

// -----------------------------------------------------------------------------
// Structural Route Registrations (Phase 1-7 Implementations)
// -----------------------------------------------------------------------------
const routeNotice = (moduleName: string) => (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not Implemented',
    module: moduleName,
    message: `Structural route registered. Implementation scheduled in the development roadmap.`
  });
};

// Domain Route Groups
app.use('/api/v1/auth', routeNotice('Authentication & RBAC'));
app.use('/api/v1/organizations', routeNotice('Enterprise & Financial Calibration'));
app.use('/api/v1/assets', routeNotice('Enterprise Asset Registry'));
app.use('/api/v1/vulnerabilities', routeNotice('Vulnerability & CISA KEV Intelligence'));
app.use('/api/v1/threats', routeNotice('Threat Intelligence & MITRE ATT&CK'));
app.use('/api/v1/telemetry', routeNotice('Security Telemetry Ingestion (CSV/JSON/REST)'));
app.use('/api/v1/controls', routeNotice('Control Effectiveness Engine'));
app.use('/api/v1/risk', routeNotice('Risk Quantification & Snapshot Engine'));
app.use('/api/v1/scenarios', routeNotice('What-If Simulation Sandbox'));
app.use('/api/v1/optimizer', routeNotice('Security Investment Optimizer'));
app.use('/api/v1/attack-paths', routeNotice('Attack Path & Blast Radius Analysis'));
app.use('/api/v1/compliance', routeNotice('Compliance Mapping (NIST, ISO, CIS, RBI, SEBI)'));
app.use('/api/v1/reports', routeNotice('Executive & Audit Reporting'));
app.use('/api/v1/assistant', routeNotice('Grounded AI Decision Support'));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Gateway Error]:', err.message);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

export default app;
