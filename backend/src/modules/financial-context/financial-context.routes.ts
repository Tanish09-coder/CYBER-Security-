// =============================================================================
// CyberRiskOS — Financial Context & Enterprise Inputs Routes
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { Router } from 'express';
import { FinancialContextController } from './financial-context.controller';

export const financialContextRouter = Router();
const controller = new FinancialContextController();

// Financial parameters / inputs (Phase 3)
financialContextRouter.get('/organizations/:orgId/financial-parameters', controller.getFinancialParameters);
financialContextRouter.post('/organizations/:orgId/financial-parameters', controller.upsertFinancialParameters);

financialContextRouter.post('/financial-inputs', controller.postFinancialInputs);
financialContextRouter.get('/financial-inputs', controller.getFinancialInputsByQuery);
financialContextRouter.patch('/financial-inputs/:id', controller.patchFinancialInputs);

// Remediation action catalog & budget constraints (Phase 5)
financialContextRouter.post('/remediation-actions', controller.createRemediationAction);
financialContextRouter.get('/remediation-actions', controller.listRemediationActions);
financialContextRouter.get('/remediation-actions/budget', controller.getRemediationBudget);

// Asset dependencies (Phase 7B)
financialContextRouter.post('/assets/:assetId/dependencies', controller.createAssetDependency);
financialContextRouter.get('/assets/:assetId/dependencies', controller.getAssetDependencies);

// Compliance frameworks, coverage, evidence, and gaps (Phase 7A)
financialContextRouter.get('/compliance/frameworks', controller.listComplianceFrameworks);
financialContextRouter.get('/compliance/frameworks/:code/coverage', controller.getFrameworkCoverage);
financialContextRouter.post('/compliance/evidence', controller.createComplianceEvidence);
financialContextRouter.get('/compliance/evidence', controller.listComplianceEvidence);
financialContextRouter.get('/compliance/gaps', controller.getComplianceGaps);

// Aggregated Enterprise Risk Inputs bundle for Tanish's Risk Engine
financialContextRouter.get('/enterprise-context/risk-inputs/:orgId', controller.getAggregatedRiskInputsBundle);
