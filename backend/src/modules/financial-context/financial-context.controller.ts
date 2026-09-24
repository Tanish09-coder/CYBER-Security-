// =============================================================================
// CyberRiskOS — Financial Context & Enterprise Inputs Controller
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { FinancialContextService } from './financial-context.service';

export class FinancialContextController {
  constructor(private service: FinancialContextService = new FinancialContextService()) {}

  // ---------------------------------------------------------------------------
  // Financial Parameters / Inputs (Phase 3)
  // ---------------------------------------------------------------------------

  getFinancialParameters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orgId } = req.params;
      const params = await this.service.getFinancialParameters(orgId);

      if (!params) {
        res.status(200).json({
          organizationId: orgId,
          hourlyDowntimeCost: null,
          hourlyRecoveryRate: null,
          costPerSensitiveRecord: null,
          regulatoryBreachPenalty: null,
          dailyTransactionVolume: null,
          isConfigured: false,
        });
        return;
      }

      res.status(200).json({
        ...params,
        isConfigured: true,
      });
    } catch (err) {
      next(err);
    }
  };

  upsertFinancialParameters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orgId } = req.params;
      const params = await this.service.upsertFinancialParameters(orgId, req.body);
      res.status(200).json(params);
    } catch (err) {
      next(err);
    }
  };

  postFinancialInputs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, ...params } = req.body;
      if (!organizationId || typeof organizationId !== 'string') {
        res.status(400).json({ error: 'organizationId is required' });
        return;
      }
      const result = await this.service.upsertFinancialParameters(organizationId, params);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  getFinancialInputsByQuery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = req.query;
      if (!organizationId || typeof organizationId !== 'string') {
        res.status(400).json({ error: 'organizationId query parameter is required' });
        return;
      }
      const params = await this.service.getFinancialParameters(organizationId);
      if (!params) {
        res.status(200).json({
          organizationId,
          hourlyDowntimeCost: null,
          hourlyRecoveryRate: null,
          costPerSensitiveRecord: null,
          regulatoryBreachPenalty: null,
          dailyTransactionVolume: null,
          isConfigured: false,
        });
        return;
      }
      res.status(200).json({ ...params, isConfigured: true });
    } catch (err) {
      next(err);
    }
  };

  patchFinancialInputs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { organizationId, ...params } = req.body;
      const targetOrgId = organizationId || id;
      if (!targetOrgId) {
        res.status(400).json({ error: 'Organization identifier is required' });
        return;
      }
      const result = await this.service.upsertFinancialParameters(targetOrgId, params);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  // ---------------------------------------------------------------------------
  // Remediation Action Catalog & Budget Constraints (Phase 5)
  // ---------------------------------------------------------------------------

  createRemediationAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const action = await this.service.createRemediationAction(req.body);
      res.status(201).json(action);
    } catch (err) {
      next(err);
    }
  };

  listRemediationActions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = req.query;
      if (!organizationId || typeof organizationId !== 'string') {
        res.status(400).json({ error: 'organizationId query parameter is required' });
        return;
      }
      const actions = await this.service.listRemediationActions(organizationId);
      res.status(200).json({ remediationActions: actions, total: actions.length });
    } catch (err) {
      next(err);
    }
  };

  getRemediationBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = req.query;
      if (!organizationId || typeof organizationId !== 'string') {
        res.status(400).json({ error: 'organizationId query parameter is required' });
        return;
      }
      const budgetSummary = await this.service.getRemediationBudgetSummary(organizationId);
      res.status(200).json(budgetSummary);
    } catch (err) {
      next(err);
    }
  };

  // ---------------------------------------------------------------------------
  // Asset Dependencies (Phase 7B)
  // ---------------------------------------------------------------------------

  createAssetDependency = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { assetId } = req.params;
      const dep = await this.service.createAssetDependency({
        ...req.body,
        sourceAssetId: assetId,
      });
      res.status(201).json(dep);
    } catch (err) {
      next(err);
    }
  };

  getAssetDependencies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { assetId } = req.params;
      const deps = await this.service.getAssetDependencies(assetId);
      res.status(200).json({ dependencies: deps, total: deps.length });
    } catch (err) {
      next(err);
    }
  };

  // ---------------------------------------------------------------------------
  // Compliance Frameworks & Evidence (Phase 7A)
  // ---------------------------------------------------------------------------

  listComplianceFrameworks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const frameworks = await this.service.listComplianceFrameworks();
      res.status(200).json({ frameworks, total: frameworks.length });
    } catch (err) {
      next(err);
    }
  };

  getFrameworkCoverage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.params;
      const { organizationId } = req.query;
      if (!organizationId || typeof organizationId !== 'string') {
        res.status(400).json({ error: 'organizationId query parameter is required' });
        return;
      }
      const coverage = await this.service.getFrameworkCoverage(code, organizationId);
      res.status(200).json(coverage);
    } catch (err) {
      next(err);
    }
  };

  createComplianceEvidence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const evidence = await this.service.createComplianceEvidence(req.body);
      res.status(201).json(evidence);
    } catch (err) {
      next(err);
    }
  };

  listComplianceEvidence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = req.query;
      if (!organizationId || typeof organizationId !== 'string') {
        res.status(400).json({ error: 'organizationId query parameter is required' });
        return;
      }
      const evidence = await this.service.listComplianceEvidence(organizationId);
      res.status(200).json({ evidence, total: evidence.length });
    } catch (err) {
      next(err);
    }
  };

  getComplianceGaps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = req.query;
      if (!organizationId || typeof organizationId !== 'string') {
        res.status(400).json({ error: 'organizationId query parameter is required' });
        return;
      }
      const gaps = await this.service.getComplianceGaps(organizationId);
      res.status(200).json({ gaps, totalGaps: gaps.length });
    } catch (err) {
      next(err);
    }
  };

  // ---------------------------------------------------------------------------
  // Aggregated Risk Inputs Bundle for Tanish's Risk Engine
  // ---------------------------------------------------------------------------

  getAggregatedRiskInputsBundle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orgId } = req.params;
      const bundle = await this.service.getAggregatedRiskInputsBundle(orgId);
      res.status(200).json(bundle);
    } catch (err) {
      next(err);
    }
  };
}
