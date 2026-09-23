// =============================================================================
// CyberRiskOS — Enterprise Asset Controller
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { Request, Response } from 'express';
import {
  AssetService,
  AssetOrganizationNotFoundError,
  AssetDuplicateError,
} from './assets.service';
import {
  createAssetSchema,
  updateAssetSchema,
  assetImportJsonSchema,
  assetQuerySchema,
} from './assets.validation';
import { uuidSchema } from '../organizations/organizations.validation';
import { logger } from '../../config/logger';

export class AssetController {
  private service: AssetService;

  constructor(service?: AssetService) {
    this.service = service || new AssetService();
  }

  // ---------------------------------------------------------------------------
  // Single Asset Endpoints
  // ---------------------------------------------------------------------------

  createAsset = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = createAssetSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const asset = await this.service.createAsset(validation.data);
      res.status(201).json(asset);
    } catch (err: any) {
      if (err instanceof AssetOrganizationNotFoundError) {
        res.status(404).json({ error: 'NotFound', message: err.message });
        return;
      }
      if (err instanceof AssetDuplicateError) {
        res.status(409).json({ error: 'Conflict', message: err.message });
        return;
      }

      logger.error('Failed to create asset', { error: err.message });
      res.status(500).json({ error: 'CreateError', message: err.message });
    }
  };

  getAsset = async (req: Request, res: Response): Promise<void> => {
    try {
      const idValidation = uuidSchema.safeParse(req.params.id);
      if (!idValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: idValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const asset = await this.service.getAssetById(idValidation.data);
      if (!asset) {
        res.status(404).json({
          error: 'NotFound',
          message: `Asset ${idValidation.data} not found`,
        });
        return;
      }

      res.status(200).json(asset);
    } catch (err: any) {
      logger.error('Failed to get asset', { error: err.message });
      res.status(500).json({ error: 'QueryError', message: err.message });
    }
  };

  listAssets = async (req: Request, res: Response): Promise<void> => {
    try {
      const queryValidation = assetQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: queryValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const filters = queryValidation.data;
      const result = await this.service.listAssets(filters);

      res.status(200).json(result);
    } catch (err: any) {
      logger.error('Failed to list assets', { error: err.message });
      res.status(500).json({ error: 'QueryError', message: err.message });
    }
  };

  updateAsset = async (req: Request, res: Response): Promise<void> => {
    try {
      const idValidation = uuidSchema.safeParse(req.params.id);
      if (!idValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: idValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const bodyValidation = updateAssetSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: bodyValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const asset = await this.service.updateAsset(idValidation.data, bodyValidation.data);
      if (!asset) {
        res.status(404).json({
          error: 'NotFound',
          message: `Asset ${idValidation.data} not found`,
        });
        return;
      }

      res.status(200).json(asset);
    } catch (err: any) {
      if (err instanceof AssetDuplicateError) {
        res.status(409).json({ error: 'Conflict', message: err.message });
        return;
      }

      logger.error('Failed to update asset', { error: err.message });
      res.status(500).json({ error: 'UpdateError', message: err.message });
    }
  };

  deleteAsset = async (req: Request, res: Response): Promise<void> => {
    try {
      const idValidation = uuidSchema.safeParse(req.params.id);
      if (!idValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: idValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const deleted = await this.service.deleteAsset(idValidation.data);
      if (!deleted) {
        res.status(404).json({
          error: 'NotFound',
          message: `Asset ${idValidation.data} not found`,
        });
        return;
      }

      res.status(200).json({
        message: `Asset ${idValidation.data} deleted successfully`,
      });
    } catch (err: any) {
      logger.error('Failed to delete asset', { error: err.message });
      res.status(500).json({ error: 'DeleteError', message: err.message });
    }
  };

  // ---------------------------------------------------------------------------
  // Import Endpoints
  // ---------------------------------------------------------------------------

  importJson = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = assetImportJsonSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const result = await this.service.importJson(
        validation.data.organization_id,
        validation.data.assets
      );

      res.status(200).json(result);
    } catch (err: any) {
      if (err instanceof AssetOrganizationNotFoundError) {
        res.status(404).json({ error: 'NotFound', message: err.message });
        return;
      }

      logger.error('Failed to import JSON assets', { error: err.message });
      res.status(500).json({ error: 'ImportError', message: err.message });
    }
  };

  importCsv = async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = (req.headers['x-organization-id'] || req.query.organizationId || req.body?.organization_id) as string;

      const orgValidation = uuidSchema.safeParse(organizationId);
      if (!orgValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: ['Missing or invalid organization ID. Provide via X-Organization-Id header, query param, or JSON body.'],
        });
        return;
      }

      let csvContent = '';
      if (typeof req.body === 'string') {
        csvContent = req.body;
      } else if (req.body?.csv) {
        csvContent = req.body.csv;
      } else if (Buffer.isBuffer(req.body)) {
        csvContent = req.body.toString('utf-8');
      }

      if (!csvContent || csvContent.trim() === '') {
        res.status(400).json({
          error: 'Validation Error',
          details: ['CSV content is empty. Provide raw CSV text or { "csv": "..." } payload.'],
        });
        return;
      }

      const result = await this.service.importCsv(orgValidation.data, csvContent);
      res.status(200).json(result);
    } catch (err: any) {
      if (err instanceof AssetOrganizationNotFoundError) {
        res.status(404).json({ error: 'NotFound', message: err.message });
        return;
      }

      logger.error('Failed to import CSV assets', { error: err.message });
      res.status(500).json({ error: 'ImportError', message: err.message });
    }
  };
}
