// =============================================================================
// CyberRiskOS — Enterprise Asset Service
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { AssetRepository } from './assets.repository';
import { OrganizationRepository } from '../organizations/organizations.repository';
import {
  CreateAssetRequest,
  UpdateAssetRequest,
  AssetResponse,
  AssetQueryFilters,
  AssetImportResult,
  ImportRowError,
  mapAssetToResponse,
} from './assets.types';
import { parseAssetCsv } from './assets.csv-parser';
import { logger } from '../../config/logger';

export class AssetService {
  private repo: AssetRepository;
  private orgRepo: OrganizationRepository;

  constructor(repo?: AssetRepository, orgRepo?: OrganizationRepository) {
    this.repo = repo || new AssetRepository();
    this.orgRepo = orgRepo || new OrganizationRepository();
  }

  // ---------------------------------------------------------------------------
  // Single Asset Operations
  // ---------------------------------------------------------------------------

  async createAsset(data: CreateAssetRequest): Promise<AssetResponse> {
    const org = await this.orgRepo.findOrganizationById(data.organization_id);
    if (!org) {
      throw new AssetOrganizationNotFoundError(
        `Organization ${data.organization_id} not found. Cannot create asset.`
      );
    }

    // Check for duplicate identifiers within the organization
    const dup = await this.repo.findDuplicate(data.organization_id, {
      hostname: data.hostname,
      mac_address: data.mac_address,
      ip_address: data.ip_address,
    });

    if (dup) {
      throw new AssetDuplicateError(
        `Asset already exists in this organization with matching hostname (${data.hostname || 'N/A'}), MAC (${data.mac_address || 'N/A'}), or IP (${data.ip_address || 'N/A'}). Existing asset: "${dup.name}" (ID: ${dup.id})`
      );
    }

    const row = await this.repo.createAsset(data);
    return mapAssetToResponse(row);
  }

  async getAssetById(id: string): Promise<AssetResponse | null> {
    const row = await this.repo.findAssetById(id);
    return row ? mapAssetToResponse(row) : null;
  }

  async listAssets(
    filters: AssetQueryFilters
  ): Promise<{ data: AssetResponse[]; total: number; page: number; limit: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const { assets, total } = await this.repo.listAssets(filters);

    return {
      data: assets.map(mapAssetToResponse),
      total,
      page,
      limit,
    };
  }

  async updateAsset(id: string, data: UpdateAssetRequest): Promise<AssetResponse | null> {
    const existing = await this.repo.findAssetById(id);
    if (!existing) {
      return null;
    }

    // If identifiers changed, verify no conflicts in the same organization
    if (data.hostname || data.mac_address || data.ip_address) {
      const dup = await this.repo.findDuplicate(
        existing.organization_id,
        {
          hostname: data.hostname !== undefined ? data.hostname : existing.hostname,
          mac_address: data.mac_address !== undefined ? data.mac_address : existing.mac_address,
          ip_address: data.ip_address !== undefined ? data.ip_address : existing.ip_address,
        },
        id
      );

      if (dup) {
        throw new AssetDuplicateError(
          `Update creates duplicate identifier conflict with existing asset "${dup.name}" (ID: ${dup.id})`
        );
      }
    }

    const row = await this.repo.updateAsset(id, data);
    return row ? mapAssetToResponse(row) : null;
  }

  async deleteAsset(id: string): Promise<boolean> {
    const existing = await this.repo.findAssetById(id);
    if (!existing) {
      return false;
    }
    return this.repo.deleteAsset(id);
  }

  // ---------------------------------------------------------------------------
  // JSON Batch Import
  // ---------------------------------------------------------------------------

  async importJson(
    organizationId: string,
    assetItems: Omit<CreateAssetRequest, 'organization_id'>[]
  ): Promise<AssetImportResult> {
    const org = await this.orgRepo.findOrganizationById(organizationId);
    if (!org) {
      throw new AssetOrganizationNotFoundError(
        `Organization ${organizationId} not found. Cannot import assets.`
      );
    }

    let imported = 0;
    let skippedDuplicates = 0;
    const errors: ImportRowError[] = [];

    for (let i = 0; i < assetItems.length; i++) {
      const item = assetItems[i];
      const rowNum = i + 1;

      try {
        const dup = await this.repo.findDuplicate(organizationId, {
          hostname: item.hostname,
          mac_address: item.mac_address,
          ip_address: item.ip_address,
        });

        if (dup) {
          skippedDuplicates++;
          continue;
        }

        await this.repo.createAsset({
          ...item,
          organization_id: organizationId,
        });
        imported++;
      } catch (err: any) {
        errors.push({
          row: rowNum,
          message: err.message,
          rawValue: item.name,
        });
      }
    }

    logger.info('JSON Asset Import completed', {
      organizationId,
      totalRows: assetItems.length,
      imported,
      skippedDuplicates,
      errorsCount: errors.length,
    });

    return {
      totalRows: assetItems.length,
      imported,
      skippedDuplicates,
      errors,
    };
  }

  // ---------------------------------------------------------------------------
  // CSV Import
  // ---------------------------------------------------------------------------

  async importCsv(organizationId: string, csvContent: string): Promise<AssetImportResult> {
    const org = await this.orgRepo.findOrganizationById(organizationId);
    if (!org) {
      throw new AssetOrganizationNotFoundError(
        `Organization ${organizationId} not found. Cannot import assets.`
      );
    }

    const { assets: parsedAssets, errors: parseErrors, totalRows } = parseAssetCsv(csvContent);

    let imported = 0;
    let skippedDuplicates = 0;
    const errors: ImportRowError[] = [...parseErrors];

    for (let i = 0; i < parsedAssets.length; i++) {
      const item = parsedAssets[i];
      const rowNum = i + 2; // header is row 1

      try {
        const dup = await this.repo.findDuplicate(organizationId, {
          hostname: item.hostname,
          mac_address: item.mac_address,
          ip_address: item.ip_address,
        });

        if (dup) {
          skippedDuplicates++;
          continue;
        }

        await this.repo.createAsset({
          ...item,
          organization_id: organizationId,
        });
        imported++;
      } catch (err: any) {
        errors.push({
          row: rowNum,
          message: err.message,
          rawValue: item.name,
        });
      }
    }

    logger.info('CSV Asset Import completed', {
      organizationId,
      totalRows,
      imported,
      skippedDuplicates,
      errorsCount: errors.length,
    });

    return {
      totalRows,
      imported,
      skippedDuplicates,
      errors,
    };
  }
}

// =============================================================================
// Domain Error Classes
// =============================================================================

export class AssetOrganizationNotFoundError extends Error {
  constructor(message: string = 'Organization not found') {
    super(message);
    this.name = 'AssetOrganizationNotFoundError';
  }
}

export class AssetDuplicateError extends Error {
  constructor(message: string = 'Asset identifier duplicate conflict') {
    super(message);
    this.name = 'AssetDuplicateError';
  }
}
