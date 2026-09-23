// =============================================================================
// CyberRiskOS — CPE Matching Service
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { CpeMatchingRepository } from './cpe-matching.repository';
import { AssetRepository } from '../assets/assets.repository';
import { SoftwareRepository } from '../software/software.repository';
import {
  EvaluateMatchingRequest,
  EvaluateMatchingResponse,
  CorrelatedVulnerabilityResponse,
} from './cpe-matching.types';
import { evaluateCpeMatch } from './cpe-matching.evaluator';
import { logger } from '../../config/logger';

export class CpeMatchingService {
  private cpeRepo: CpeMatchingRepository;
  private assetRepo: AssetRepository;
  private softwareRepo: SoftwareRepository;

  constructor(
    cpeRepo?: CpeMatchingRepository,
    assetRepo?: AssetRepository,
    softwareRepo?: SoftwareRepository
  ) {
    this.cpeRepo = cpeRepo || new CpeMatchingRepository();
    this.assetRepo = assetRepo || new AssetRepository();
    this.softwareRepo = softwareRepo || new SoftwareRepository();
  }

  /**
   * Evaluates installed software on assets against NVD CPE vulnerability criteria.
   */
  async evaluateMatches(req: EvaluateMatchingRequest = {}): Promise<EvaluateMatchingResponse> {
    const cpeCriteriaList = await this.cpeRepo.getAllCpeCriteria();
    logger.info(`Loaded ${cpeCriteriaList.length} active NVD CPE criteria records for evaluation`);

    let targetAssets: any[] = [];
    if (req.asset_id) {
      const single = await this.assetRepo.findAssetById(req.asset_id);
      if (!single) {
        throw new MatchingAssetNotFoundError(`Asset ${req.asset_id} not found.`);
      }
      targetAssets = [single];
    } else if (req.organization_id) {
      const { assets } = await this.assetRepo.listAssets({
        organizationId: req.organization_id,
        limit: 10000,
      });
      targetAssets = assets;
    } else {
      const { assets } = await this.assetRepo.listAssets({ limit: 10000 });
      targetAssets = assets;
    }

    let evaluatedPackagesCount = 0;
    let matchedVulnerabilitiesCount = 0;

    for (const asset of targetAssets) {
      const { data: installedSoftware } = await this.softwareRepo.listSoftwareByAsset(asset.id, {
        limit: 1000,
      });
      evaluatedPackagesCount += installedSoftware.length;

      for (const sw of installedSoftware) {
        for (const cpeRecord of cpeCriteriaList) {
          const evalResult = evaluateCpeMatch(
            sw.vendor,
            sw.product,
            sw.version,
            cpeRecord,
            asset.name
          );

          if (evalResult.isMatch) {
            await this.cpeRepo.upsertAssetVulnerability({
              asset_id: asset.id,
              software_id: sw.id,
              vulnerability_id: cpeRecord.vulnerability_id,
              cve_id: cpeRecord.cve_id,
              cpe_criteria_id: cpeRecord.id,
              match_confidence: evalResult.confidence,
              match_type: evalResult.matchType,
              match_reason: evalResult.reason,
            });
            matchedVulnerabilitiesCount++;
          }
        }
      }
    }

    logger.info('CPE Matching evaluation run completed', {
      evaluatedAssets: targetAssets.length,
      evaluatedPackages: evaluatedPackagesCount,
      matchedVulnerabilities: matchedVulnerabilitiesCount,
    });

    return {
      message: `CPE Matching evaluation completed. Evaluated ${targetAssets.length} asset(s) and ${evaluatedPackagesCount} installed package(s). Identified ${matchedVulnerabilitiesCount} potential vulnerability match(es).`,
      evaluatedAssets: targetAssets.length,
      evaluatedPackages: evaluatedPackagesCount,
      matchedVulnerabilities: matchedVulnerabilitiesCount,
      newMatches: matchedVulnerabilitiesCount,
    };
  }

  /**
   * Retrieves correlated vulnerabilities for an asset.
   */
  async getAssetCorrelations(assetId: string): Promise<CorrelatedVulnerabilityResponse[]> {
    const asset = await this.assetRepo.findAssetById(assetId);
    if (!asset) {
      throw new MatchingAssetNotFoundError(`Asset ${assetId} not found.`);
    }

    return await this.cpeRepo.getCorrelatedVulnerabilitiesByAsset(assetId);
  }
}

export class MatchingAssetNotFoundError extends Error {
  constructor(message: string = 'Asset not found') {
    super(message);
    this.name = 'MatchingAssetNotFoundError';
  }
}
