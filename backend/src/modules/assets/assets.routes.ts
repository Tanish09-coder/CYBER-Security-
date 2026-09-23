// =============================================================================
// CyberRiskOS — Enterprise Asset Routes
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { Router, text } from 'express';
import { AssetController } from './assets.controller';

import { createAssetSoftwareRouter } from '../software/software.routes';

export function createAssetRouter(controller?: AssetController): Router {
  const router = Router();
  const ctrl = controller || new AssetController();

  // Middleware to support raw text/csv uploads on CSV import endpoint
  const textParser = text({ type: ['text/csv', 'text/plain', 'application/csv'], limit: '10mb' });

  // Software Sub-resource Routes
  router.use('/:assetId/software', createAssetSoftwareRouter());

  // Import Endpoints
  router.post('/import/json', ctrl.importJson);
  router.post('/import/csv', textParser, ctrl.importCsv);

  // Asset CRUD & Listing
  router.post('/', ctrl.createAsset);
  router.get('/', ctrl.listAssets);
  router.get('/:id', ctrl.getAsset);
  router.patch('/:id', ctrl.updateAsset);
  router.delete('/:id', ctrl.deleteAsset);

  return router;
}
