// =============================================================================
// CyberRiskOS — CPE Matching Controller
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { Request, Response } from 'express';
import { CpeMatchingService, MatchingAssetNotFoundError } from './cpe-matching.service';
import { uuidSchema } from '../organizations/organizations.validation';
import { logger } from '../../config/logger';

export class CpeMatchingController {
  private service: CpeMatchingService;

  constructor(service?: CpeMatchingService) {
    this.service = service || new CpeMatchingService();
  }

  evaluateMatches = async (req: Request, res: Response): Promise<void> => {
    try {
      const assetId = req.body?.asset_id || req.query?.assetId;
      const organizationId = req.body?.organization_id || req.query?.organizationId;

      if (assetId) {
        const val = uuidSchema.safeParse(assetId);
        if (!val.success) {
          res.status(400).json({ error: 'Validation Error', details: ['Invalid asset_id UUID format'] });
          return;
        }
      }

      if (organizationId) {
        const val = uuidSchema.safeParse(organizationId);
        if (!val.success) {
          res.status(400).json({ error: 'Validation Error', details: ['Invalid organization_id UUID format'] });
          return;
        }
      }

      const result = await this.service.evaluateMatches({
        asset_id: assetId as string | undefined,
        organization_id: organizationId as string | undefined,
      });

      res.status(200).json(result);
    } catch (err: any) {
      if (err instanceof MatchingAssetNotFoundError) {
        res.status(404).json({ error: 'NotFound', message: err.message });
        return;
      }

      logger.error('Failed to run CPE matching evaluation', { error: err.message });
      res.status(500).json({ error: 'EvaluationError', message: err.message });
    }
  };

  getAssetVulnerabilities = async (req: Request, res: Response): Promise<void> => {
    try {
      const assetIdValidation = uuidSchema.safeParse(req.params.assetId);
      if (!assetIdValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: assetIdValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const correlations = await this.service.getAssetCorrelations(assetIdValidation.data);
      res.status(200).json({
        assetId: assetIdValidation.data,
        count: correlations.length,
        data: correlations,
      });
    } catch (err: any) {
      if (err instanceof MatchingAssetNotFoundError) {
        res.status(404).json({ error: 'NotFound', message: err.message });
        return;
      }

      logger.error('Failed to get asset vulnerability correlations', { error: err.message });
      res.status(500).json({ error: 'QueryError', message: err.message });
    }
  };
}
