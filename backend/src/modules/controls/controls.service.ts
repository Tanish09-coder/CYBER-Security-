// =============================================================================
// CyberRiskOS — Security Controls Service
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { ControlsRepository } from './controls.repository';
import { AssetRepository } from '../assets/assets.repository';
import {
  SetAssetControlItem,
  UpdateAssetControlRequest,
  SecurityControlResponse,
  AssetControlResponse,
  ControlsSummaryResponse,
  mapSecurityControlToResponse,
  mapAssetControlToResponse,
} from './controls.types';
import { logger } from '../../config/logger';

export class ControlsService {
  private repo: ControlsRepository;
  private assetRepo: AssetRepository;

  constructor(repo?: ControlsRepository, assetRepo?: AssetRepository) {
    this.repo = repo || new ControlsRepository();
    this.assetRepo = assetRepo || new AssetRepository();
  }

  // ---------------------------------------------------------------------------
  // Catalog Operations
  // ---------------------------------------------------------------------------

  async listCatalogControls(): Promise<SecurityControlResponse[]> {
    const rows = await this.repo.listCatalogControls();
    return rows.map(mapSecurityControlToResponse);
  }

  async getControlByCode(code: string): Promise<SecurityControlResponse | null> {
    const row = await this.repo.findControlByCode(code);
    return row ? mapSecurityControlToResponse(row) : null;
  }

  async getCoverageSummary(organizationId?: string): Promise<ControlsSummaryResponse> {
    const controls = await this.repo.getCoverageSummary(organizationId);
    return {
      totalCatalogControls: controls.length,
      controls,
    };
  }

  // ---------------------------------------------------------------------------
  // Asset Control Posture Operations
  // ---------------------------------------------------------------------------

  async listControlsForAsset(assetId: string): Promise<AssetControlResponse[]> {
    const asset = await this.assetRepo.findAssetById(assetId);
    if (!asset) {
      throw new ControlsAssetNotFoundError(`Asset ${assetId} not found.`);
    }

    const rows = await this.repo.listControlsByAsset(assetId);
    return rows.map(mapAssetControlToResponse);
  }

  async setAssetControls(
    assetId: string,
    items: SetAssetControlItem[]
  ): Promise<AssetControlResponse[]> {
    const asset = await this.assetRepo.findAssetById(assetId);
    if (!asset) {
      throw new ControlsAssetNotFoundError(`Asset ${assetId} not found. Cannot assign controls.`);
    }

    const results: AssetControlResponse[] = [];

    for (const item of items) {
      const control = await this.repo.findControlByCode(item.control_code);
      if (!control) {
        throw new ControlCodeNotFoundError(
          `Security control with code "${item.control_code}" is not in the catalog. Available: MFA, EDR, BACKUP, SEGMENTATION, PAM, ENCRYPTION, MONITORING.`
        );
      }

      const row = await this.repo.upsertAssetControl(assetId, control, item);
      results.push(mapAssetControlToResponse(row));
    }

    logger.info('Updated security controls on asset', {
      assetId,
      controlCount: items.length,
    });

    return results;
  }

  async updateAssetControl(
    assetId: string,
    controlCode: string,
    data: UpdateAssetControlRequest
  ): Promise<AssetControlResponse | null> {
    const asset = await this.assetRepo.findAssetById(assetId);
    if (!asset) {
      throw new ControlsAssetNotFoundError(`Asset ${assetId} not found.`);
    }

    const existing = await this.repo.findAssetControl(assetId, controlCode);
    if (!existing) {
      return null;
    }

    const row = await this.repo.updateAssetControl(assetId, controlCode, data);
    return row ? mapAssetControlToResponse(row) : null;
  }

  async deleteAssetControl(assetId: string, controlCode: string): Promise<boolean> {
    const asset = await this.assetRepo.findAssetById(assetId);
    if (!asset) {
      throw new ControlsAssetNotFoundError(`Asset ${assetId} not found.`);
    }

    return await this.repo.deleteAssetControl(assetId, controlCode);
  }
}

// =============================================================================
// Domain Error Classes
// =============================================================================

export class ControlsAssetNotFoundError extends Error {
  constructor(message: string = 'Asset not found') {
    super(message);
    this.name = 'ControlsAssetNotFoundError';
  }
}

export class ControlCodeNotFoundError extends Error {
  constructor(message: string = 'Control code not found in catalog') {
    super(message);
    this.name = 'ControlCodeNotFoundError';
  }
}
