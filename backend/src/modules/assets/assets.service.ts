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

  // ---------------------------------------------------------------------------
  // Risk Inputs & Completeness (HARSH-P2-02)
  // ---------------------------------------------------------------------------

  async getAssetRiskInputs(id: string): Promise<any | null> {
    const asset = await this.repo.findAssetById(id);
    if (!asset) return null;

    const controls = await this.repo.getAssetControls(id);

    // Completeness Calculation Methodology:
    // Criticality defined (1-5): 0.20
    // Internet Facing defined: 0.20
    // Data Classification defined: 0.20
    // Control posture assigned (not empty/UNKNOWN): 0.20
    // Business Unit assigned: 0.20
    let completeness = 0;
    if (asset.business_criticality >= 1 && asset.business_criticality <= 5) completeness += 0.20;
    if (asset.is_internet_facing !== null && asset.is_internet_facing !== undefined) completeness += 0.20;
    if (asset.data_classification && asset.data_classification !== 'Internal') completeness += 0.20;
    if (controls.some(c => c.status !== 'UNKNOWN')) completeness += 0.20;
    if (asset.business_unit_id) completeness += 0.20;

    return {
      assetId: asset.id,
      assetName: asset.name,
      assetType: asset.asset_type,
      criticalityTier: asset.business_criticality,
      isInternetFacing: asset.is_internet_facing,
      dataClassification: asset.data_classification,
      revenueDependencyPct: parseFloat(asset.revenue_dependency_pct || '0'),
      operationalImportanceScore: parseFloat(asset.operational_importance || '1.0'),
      controls: controls.map(c => ({
        controlCode: c.control_code,
        status: c.status,
        effectivenessScore: parseFloat(c.effectiveness_score),
        source: c.source || 'USER_CONFIG',
      })),
      completenessScore: Math.round(completeness * 100) / 100,
      provenance: 'VERIFIED_ENTERPRISE_INPUT',
    };
  }

  async getRiskInputsSummary(organizationId?: string): Promise<any> {
    const { assets, total } = await this.repo.listAssets({
      organizationId,
      limit: 10000,
    });

    const internetFacingCount = assets.filter(a => a.is_internet_facing).length;
    const criticalityDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    assets.forEach(a => {
      criticalityDist[a.business_criticality] = (criticalityDist[a.business_criticality] || 0) + 1;
    });

    return {
      totalAssets: total,
      internetFacingCount,
      criticalityDistribution: criticalityDist,
      provenance: 'USER_CONFIG_AND_SCANNER_IMPORT',
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
