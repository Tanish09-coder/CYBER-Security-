// =============================================================================
// CyberRiskOS — Software Inventory Service
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { SoftwareRepository } from './software.repository';
import { AssetRepository } from '../assets/assets.repository';
import {
  RegisterSoftwareItem,
  UpdateSoftwareRequest,
  SoftwareResponse,
  SoftwareQueryFilters,
  mapSoftwareToResponse,
} from './software.types';
import { logger } from '../../config/logger';

export class SoftwareService {
  private repo: SoftwareRepository;
  private assetRepo: AssetRepository;

  constructor(repo?: SoftwareRepository, assetRepo?: AssetRepository) {
    this.repo = repo || new SoftwareRepository();
    this.assetRepo = assetRepo || new AssetRepository();
  }

  async registerSoftware(
    assetId: string,
    items: RegisterSoftwareItem[]
  ): Promise<SoftwareResponse[]> {
    const asset = await this.assetRepo.findAssetById(assetId);
    if (!asset) {
      throw new SoftwareAssetNotFoundError(`Asset ${assetId} not found. Cannot register software.`);
    }

    const rows = await this.repo.batchUpsertSoftware(assetId, items);
    logger.info('Software packages registered on asset', {
      assetId,
      packageCount: items.length,
    });

    return rows.map(mapSoftwareToResponse);
  }

  async listSoftwareForAsset(
    assetId: string,
    filters: SoftwareQueryFilters
  ): Promise<{ data: SoftwareResponse[]; total: number; page: number; limit: number }> {
    const asset = await this.assetRepo.findAssetById(assetId);
    if (!asset) {
      throw new SoftwareAssetNotFoundError(`Asset ${assetId} not found.`);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const { data, total } = await this.repo.listSoftwareByAsset(assetId, filters);

    return {
      data: data.map(mapSoftwareToResponse),
      total,
      page,
      limit,
    };
  }

  async getSoftwareById(id: string): Promise<SoftwareResponse | null> {
    const row = await this.repo.findSoftwareById(id);
    return row ? mapSoftwareToResponse(row) : null;
  }

  async updateSoftware(
    id: string,
    data: UpdateSoftwareRequest
  ): Promise<SoftwareResponse | null> {
    const existing = await this.repo.findSoftwareById(id);
    if (!existing) {
      return null;
    }

    const row = await this.repo.updateSoftware(id, data);
    return row ? mapSoftwareToResponse(row) : null;
  }

  async deleteSoftware(id: string): Promise<boolean> {
    const existing = await this.repo.findSoftwareById(id);
    if (!existing) {
      return false;
    }
    return this.repo.deleteSoftware(id);
  }
}

// =============================================================================
// Domain Error Classes
// =============================================================================

export class SoftwareAssetNotFoundError extends Error {
  constructor(message: string = 'Asset not found') {
    super(message);
    this.name = 'SoftwareAssetNotFoundError';
  }
}
