// =============================================================================
// CyberRiskOS — Financial Context & Enterprise Inputs Controller
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { FinancialContextService } from './financial-context.service';

export class FinancialContextController {
  constructor(private service: FinancialContextService = new FinancialContextService()) {}

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

  listComplianceFrameworks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const frameworks = await this.service.listComplianceFrameworks();
      res.status(200).json({ frameworks, total: frameworks.length });
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
