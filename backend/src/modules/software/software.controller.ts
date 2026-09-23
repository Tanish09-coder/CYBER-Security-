// =============================================================================
// CyberRiskOS — Software Inventory Controller
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { Request, Response } from 'express';
import { SoftwareService, SoftwareAssetNotFoundError } from './software.service';
import {
  registerSoftwareSchema,
  updateSoftwareSchema,
  softwareQuerySchema,
} from './software.validation';
import { uuidSchema } from '../organizations/organizations.validation';
import { logger } from '../../config/logger';

export class SoftwareController {
  private service: SoftwareService;

  constructor(service?: SoftwareService) {
    this.service = service || new SoftwareService();
  }

  registerAssetSoftware = async (req: Request, res: Response): Promise<void> => {
    try {
      const assetIdValidation = uuidSchema.safeParse(req.params.assetId);
      if (!assetIdValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: assetIdValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const validation = registerSoftwareSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      // Normalize parsed input to an array of RegisterSoftwareItem
      let items: any[] = [];
      if (Array.isArray(validation.data)) {
        items = validation.data;
      } else if ('packages' in validation.data && Array.isArray(validation.data.packages)) {
        items = validation.data.packages;
      } else {
        items = [validation.data];
      }

      const results = await this.service.registerSoftware(assetIdValidation.data, items);
      res.status(201).json({
        count: results.length,
        data: results,
      });
    } catch (err: any) {
      if (err instanceof SoftwareAssetNotFoundError) {
        res.status(404).json({ error: 'NotFound', message: err.message });
        return;
      }

      logger.error('Failed to register software', { error: err.message });
      res.status(500).json({ error: 'CreateError', message: err.message });
    }
  };

  listAssetSoftware = async (req: Request, res: Response): Promise<void> => {
    try {
      const assetIdValidation = uuidSchema.safeParse(req.params.assetId);
      if (!assetIdValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: assetIdValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const queryValidation = softwareQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: queryValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const result = await this.service.listSoftwareForAsset(
        assetIdValidation.data,
        queryValidation.data
      );

      res.status(200).json(result);
    } catch (err: any) {
      if (err instanceof SoftwareAssetNotFoundError) {
        res.status(404).json({ error: 'NotFound', message: err.message });
        return;
      }

      logger.error('Failed to list software', { error: err.message });
      res.status(500).json({ error: 'QueryError', message: err.message });
    }
  };

  getSoftware = async (req: Request, res: Response): Promise<void> => {
    try {
      const idValidation = uuidSchema.safeParse(req.params.id);
      if (!idValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: idValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const sw = await this.service.getSoftwareById(idValidation.data);
      if (!sw) {
        res.status(404).json({
          error: 'NotFound',
          message: `Software package ${idValidation.data} not found`,
        });
        return;
      }

      res.status(200).json(sw);
    } catch (err: any) {
      logger.error('Failed to get software', { error: err.message });
      res.status(500).json({ error: 'QueryError', message: err.message });
    }
  };

  updateSoftware = async (req: Request, res: Response): Promise<void> => {
    try {
      const idValidation = uuidSchema.safeParse(req.params.id);
      if (!idValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: idValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const bodyValidation = updateSoftwareSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: bodyValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const sw = await this.service.updateSoftware(idValidation.data, bodyValidation.data);
      if (!sw) {
        res.status(404).json({
          error: 'NotFound',
          message: `Software package ${idValidation.data} not found`,
        });
        return;
      }

      res.status(200).json(sw);
    } catch (err: any) {
      logger.error('Failed to update software', { error: err.message });
      res.status(500).json({ error: 'UpdateError', message: err.message });
    }
  };

  deleteSoftware = async (req: Request, res: Response): Promise<void> => {
    try {
      const idValidation = uuidSchema.safeParse(req.params.id);
      if (!idValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: idValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const deleted = await this.service.deleteSoftware(idValidation.data);
      if (!deleted) {
        res.status(404).json({
          error: 'NotFound',
          message: `Software package ${idValidation.data} not found`,
        });
        return;
      }

      res.status(200).json({
        message: `Software package ${idValidation.data} deleted successfully`,
      });
    } catch (err: any) {
      logger.error('Failed to delete software', { error: err.message });
      res.status(500).json({ error: 'DeleteError', message: err.message });
    }
  };
}
