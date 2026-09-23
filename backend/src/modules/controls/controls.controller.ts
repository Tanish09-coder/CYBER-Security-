// =============================================================================
// CyberRiskOS — Security Controls Controller
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { Request, Response } from 'express';
import {
  ControlsService,
  ControlsAssetNotFoundError,
  ControlCodeNotFoundError,
} from './controls.service';
import {
  setAssetControlsSchema,
  updateAssetControlSchema,
  controlCodeSchema,
} from './controls.validation';
import { uuidSchema } from '../organizations/organizations.validation';
import { logger } from '../../config/logger';

export class ControlsController {
  private service: ControlsService;

  constructor(service?: ControlsService) {
    this.service = service || new ControlsService();
  }

  // ---------------------------------------------------------------------------
  // Catalog Endpoints
  // ---------------------------------------------------------------------------

  listControls = async (req: Request, res: Response): Promise<void> => {
    try {
      const summaryParam = req.query.summary === 'true';
      const organizationId = req.query.organizationId as string | undefined;

      if (summaryParam) {
        const summary = await this.service.getCoverageSummary(organizationId);
        res.status(200).json(summary);
        return;
      }

      const controls = await this.service.listCatalogControls();
      res.status(200).json({
        count: controls.length,
        data: controls,
      });
    } catch (err: any) {
      logger.error('Failed to list security controls', { error: err.message });
      res.status(500).json({ error: 'QueryError', message: err.message });
    }
  };

  getControl = async (req: Request, res: Response): Promise<void> => {
    try {
      const code = req.params.code;
      const control = await this.service.getControlByCode(code);
      if (!control) {
        res.status(404).json({
          error: 'NotFound',
          message: `Security control "${code}" not found in catalog`,
        });
        return;
      }

      res.status(200).json(control);
    } catch (err: any) {
      logger.error('Failed to get security control', { error: err.message });
      res.status(500).json({ error: 'QueryError', message: err.message });
    }
  };

  // ---------------------------------------------------------------------------
  // Asset Control Posture Endpoints
  // ---------------------------------------------------------------------------

  listAssetControls = async (req: Request, res: Response): Promise<void> => {
    try {
      const assetIdVal = uuidSchema.safeParse(req.params.assetId);
      if (!assetIdVal.success) {
        res.status(400).json({ error: 'Validation Error', details: assetIdVal.error.errors.map((e) => e.message) });
        return;
      }

      const controls = await this.service.listControlsForAsset(assetIdVal.data);
      res.status(200).json({
        assetId: assetIdVal.data,
        count: controls.length,
        data: controls,
      });
    } catch (err: any) {
      if (err instanceof ControlsAssetNotFoundError) {
        res.status(404).json({ error: 'NotFound', message: err.message });
        return;
      }

      logger.error('Failed to list asset controls', { error: err.message });
      res.status(500).json({ error: 'QueryError', message: err.message });
    }
  };

  setAssetControls = async (req: Request, res: Response): Promise<void> => {
    try {
      const assetIdVal = uuidSchema.safeParse(req.params.assetId);
      if (!assetIdVal.success) {
        res.status(400).json({ error: 'Validation Error', details: assetIdVal.error.errors.map((e) => e.message) });
        return;
      }

      const validation = setAssetControlsSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ error: 'Validation Error', details: validation.error.errors.map((e) => e.message) });
        return;
      }

      let items: any[] = [];
      if (Array.isArray(validation.data)) {
        items = validation.data;
      } else if ('controls' in validation.data && Array.isArray(validation.data.controls)) {
        items = validation.data.controls;
      } else {
        items = [validation.data];
      }

      const results = await this.service.setAssetControls(assetIdVal.data, items);
      res.status(200).json({
        count: results.length,
        data: results,
      });
    } catch (err: any) {
      if (err instanceof ControlsAssetNotFoundError || err instanceof ControlCodeNotFoundError) {
        res.status(404).json({ error: 'NotFound', message: err.message });
        return;
      }

      logger.error('Failed to set asset controls', { error: err.message });
      res.status(500).json({ error: 'UpdateError', message: err.message });
    }
  };

  updateAssetControl = async (req: Request, res: Response): Promise<void> => {
    try {
      const assetIdVal = uuidSchema.safeParse(req.params.assetId);
      if (!assetIdVal.success) {
        res.status(400).json({ error: 'Validation Error', details: assetIdVal.error.errors.map((e) => e.message) });
        return;
      }

      const codeVal = controlCodeSchema.safeParse(req.params.controlCode);
      if (!codeVal.success) {
        res.status(400).json({ error: 'Validation Error', details: codeVal.error.errors.map((e) => e.message) });
        return;
      }

      const bodyVal = updateAssetControlSchema.safeParse(req.body);
      if (!bodyVal.success) {
        res.status(400).json({ error: 'Validation Error', details: bodyVal.error.errors.map((e) => e.message) });
        return;
      }

      const updated = await this.service.updateAssetControl(assetIdVal.data, codeVal.data, bodyVal.data);
      if (!updated) {
        res.status(404).json({
          error: 'NotFound',
          message: `Control "${codeVal.data}" not found on asset ${assetIdVal.data}`,
        });
        return;
      }

      res.status(200).json(updated);
    } catch (err: any) {
      if (err instanceof ControlsAssetNotFoundError) {
        res.status(404).json({ error: 'NotFound', message: err.message });
        return;
      }

      logger.error('Failed to update asset control', { error: err.message });
      res.status(500).json({ error: 'UpdateError', message: err.message });
    }
  };

  deleteAssetControl = async (req: Request, res: Response): Promise<void> => {
    try {
      const assetIdVal = uuidSchema.safeParse(req.params.assetId);
      if (!assetIdVal.success) {
        res.status(400).json({ error: 'Validation Error', details: assetIdVal.error.errors.map((e) => e.message) });
        return;
      }

      const codeVal = controlCodeSchema.safeParse(req.params.controlCode);
      if (!codeVal.success) {
        res.status(400).json({ error: 'Validation Error', details: codeVal.error.errors.map((e) => e.message) });
        return;
      }

      const deleted = await this.service.deleteAssetControl(assetIdVal.data, codeVal.data);
      if (!deleted) {
        res.status(404).json({
          error: 'NotFound',
          message: `Control "${codeVal.data}" not found on asset ${assetIdVal.data}`,
        });
        return;
      }

      res.status(200).json({
        message: `Control "${codeVal.data}" removed from asset ${assetIdVal.data}`,
      });
    } catch (err: any) {
      if (err instanceof ControlsAssetNotFoundError) {
        res.status(404).json({ error: 'NotFound', message: err.message });
        return;
      }

      logger.error('Failed to delete asset control', { error: err.message });
      res.status(500).json({ error: 'DeleteError', message: err.message });
    }
  };
}
