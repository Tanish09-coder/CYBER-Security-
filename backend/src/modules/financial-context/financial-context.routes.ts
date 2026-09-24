// =============================================================================
// CyberRiskOS — Financial Context & Enterprise Inputs Routes
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { Router } from 'express';
import { FinancialContextController } from './financial-context.controller';

export const financialContextRouter = Router();
const controller = new FinancialContextController();

// Financial parameters per organization
financialContextRouter.get('/organizations/:orgId/financial-parameters', controller.getFinancialParameters);
financialContextRouter.post('/organizations/:orgId/financial-parameters', controller.upsertFinancialParameters);

// Remediation action catalog
financialContextRouter.post('/remediation-actions', controller.createRemediationAction);
financialContextRouter.get('/remediation-actions', controller.listRemediationActions);

// Asset dependencies
financialContextRouter.post('/assets/:assetId/dependencies', controller.createAssetDependency);
financialContextRouter.get('/assets/:assetId/dependencies', controller.getAssetDependencies);

// Compliance frameworks and evidence
financialContextRouter.get('/compliance/frameworks', controller.listComplianceFrameworks);
financialContextRouter.post('/compliance/evidence', controller.createComplianceEvidence);
financialContextRouter.get('/compliance/evidence', controller.listComplianceEvidence);

// Aggregated Enterprise Risk Inputs bundle for Tanish's Risk Engine
financialContextRouter.get('/enterprise-context/risk-inputs/:orgId', controller.getAggregatedRiskInputsBundle);
