// =============================================================================
// CyberRiskOS — What-If Simulation Engine Service Layer
// Phase: Phase 4 — What-If Simulation Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P4-01)
// Rules:
// - Stateless, in-memory scenario simulation comparing baseline vs hypothetical postures
// - Strictly ZERO database mutations (no INSERT, UPDATE, DELETE)
// - NO silent fallback calculation in Node
// - Defensible attribution of risk & EAL reductions per remediation action
// =============================================================================

import { scenarioEngineClient, ScenarioEngineClient } from './scenarios.client';
import { query } from '../../db';
import { logger } from '../../config/logger';
import {
  ScenarioSimulationRequestDTO,
  ScenarioSimulationResultDTO,
  ScenarioPresetDTO,
  ScenarioActionDTO,
} from './scenarios.types';

export class ScenariosService {
  constructor(private client: ScenarioEngineClient = scenarioEngineClient) {}

  /**
   * Executes a What-If scenario simulation comparing baseline to hypothetical posture.
   * Strictly in-memory; produces ZERO database mutations.
   */
  async simulate(request: ScenarioSimulationRequestDTO): Promise<ScenarioSimulationResultDTO> {
    let baselineRiskInputs = request.baselineRiskInputs;
    let baselineFinancialInputs = request.baselineFinancialInputs;

    // If explicit baseline inputs were not passed, dynamically construct them from database
    if (!baselineRiskInputs || baselineRiskInputs.length === 0) {
      const targetAssetIds: string[] = [];

      if (request.assetId) {
        targetAssetIds.push(request.assetId);
      } else {
        const actionAssets = request.actions
          .map((a) => a.targetAssetId)
          .filter((id): id is string => Boolean(id));
        targetAssetIds.push(...Array.from(new Set(actionAssets)));
      }

      const baseline = await this.loadBaselineFromDb(targetAssetIds);
      baselineRiskInputs = baseline.riskInputs;
      baselineFinancialInputs = baseline.financialInputs;
    }

    if (!baselineRiskInputs || baselineRiskInputs.length === 0) {
      throw new Error(
        'Cannot execute simulation: No baseline vulnerabilities or assets found. Provide explicit baselineRiskInputs or correlate vulnerabilities to assets first.'
      );
    }

    logger.info('Executing What-If scenario simulation via Python Scenario Engine', {
      scenarioName: request.scenarioName,
      actionsCount: request.actions.length,
      baselineItemCount: baselineRiskInputs.length,
    });

    const pythonPayload = {
      scenarioName: request.scenarioName || 'Hypothetical Remediation Scenario',
      actions: request.actions,
      baselineRiskInputs,
      baselineFinancialInputs: baselineFinancialInputs || [],
    };

    return await this.client.simulateScenario(pythonPayload);
  }

  /**
   * Helper to simulate remediation actions targeted specifically at a single asset.
   */
  async simulateForAsset(
    assetId: string,
    actions: ScenarioActionDTO[],
    scenarioName?: string
  ): Promise<ScenarioSimulationResultDTO> {
    const assetActions = actions.map((a) => ({
      ...a,
      targetAssetId: a.targetAssetId || assetId,
    }));

    return await this.simulate({
      scenarioName: scenarioName || `Asset ${assetId} Remediation Simulation`,
      assetId,
      actions: assetActions,
    });
  }

  /**
   * Returns executive and tactical scenario simulation presets.
   */
  getPresets(): ScenarioPresetDTO[] {
    return [
      {
        id: 'PRESET-PATCH-KEV',
        name: 'Remediate All CISA KEV Exploited Vulnerabilities',
        description:
          'Simulates remediating known actively exploited vulnerabilities cataloged in CISA KEV. Remediates flaw exposure directly, reducing modeled risk scores and EAL.',
        category: 'VULNERABILITY_PATCHING',
        actions: [
          {
            actionType: 'PATCH_VULNERABILITY',
            targetAssetId: 'ALL_KEV_ASSETS',
            description: 'Apply patches for all cataloged CISA KEV vulnerabilities (eliminates active flaw exposure)',
          },
        ],
      },
      {
        id: 'PRESET-MFA-TIER1',
        name: 'Enforce Multi-Factor Authentication Across Tier-1 Assets',
        description:
          'Simulates deploying and enforcing strict MFA controls across mission-critical systems. Updates contextual defense posture (under Risk Model v1, controls are contextual explainability inputs with 0.0 continuous score reduction).',
        category: 'CONTROLS_ENFORCEMENT',
        actions: [
          {
            actionType: 'IMPLEMENT_CONTROL',
            targetAssetId: 'TIER_1_ASSETS',
            controlCode: 'MFA',
            description: 'Enforce hardware-backed MFA across Tier-1 systems (contextual posture enhancement)',
          },
        ],
      },
      {
        id: 'PRESET-ISOLATE-EDGE',
        name: 'Perimeter Defense: Isolate Exposed High-Risk Systems',
        description:
          'Simulates revoking direct public internet ingress for vulnerable edge appliances, shifting them behind zero-trust gateways. Updates exposure context (under Risk Model v1, perimeter exposure is contextual with 0.0 continuous score reduction).',
        category: 'PERIMETER_DEFENSE',
        actions: [
          {
            actionType: 'ISOLATE_ASSET',
            targetAssetId: 'INTERNET_FACING_ASSETS',
            description: 'Revoke direct internet exposure and place behind VPN/ZTNA gateway (contextual perimeter isolation)',
          },
        ],
      },
    ];
  }

  /**
   * Loads baseline risk and financial inputs from PostgreSQL.
   * Read-only operation: performs ZERO data modifications.
   */
  private async loadBaselineFromDb(assetIds: string[]): Promise<{
    riskInputs: any[];
    financialInputs: any[];
  }> {
    try {
      // 1. Fetch target assets
      let assetSql: string;
      let assetParams: any[];
      if (assetIds.length > 0) {
        const placeholders = assetIds.map((_, i) => `$${i + 1}`).join(', ');
        assetSql = `SELECT id, name, business_criticality, is_internet_facing FROM assets WHERE id IN (${placeholders})`;
        assetParams = [...assetIds];
      } else {
        assetSql = 'SELECT id, name, business_criticality, is_internet_facing FROM assets LIMIT 100';
        assetParams = [];
      }
      const assetRes = await query(assetSql, assetParams);

      if (assetRes.rows.length === 0) {
        return { riskInputs: [], financialInputs: [] };
      }

      const assetsMap = new Map<string, any>();
      for (const a of assetRes.rows) {
        assetsMap.set(a.id, a);
      }
      const loadedAssetIds = Array.from(assetsMap.keys());

      // 2. Fetch correlated vulnerabilities
      const avPlaceholders = loadedAssetIds.map((_, i) => `$${i + 1}`).join(', ');
      const avSql = `SELECT asset_id, cve_id FROM asset_vulnerabilities WHERE asset_id IN (${avPlaceholders})`;
      const avRes = await query(avSql, [...loadedAssetIds]);

      if (avRes.rows.length === 0) {
        return { riskInputs: [], financialInputs: [] };
      }

      // 3. Fetch vulnerability metadata
      const uniqueCves = Array.from(new Set(avRes.rows.map((r: any) => r.cve_id)));
      const vulnPlaceholders = uniqueCves.map((_, i) => `$${i + 1}`).join(', ');
      const vulnSql = `
        SELECT cve_id, cvss_base_score, cvss_version, known_exploited,
               kev_known_ransomware_campaign_use, source_identifier
        FROM vulnerabilities
        WHERE cve_id IN (${vulnPlaceholders})
      `;
      const vulnRes = await query(vulnSql, [...uniqueCves]);
      const vulnsMap = new Map<string, any>();
      for (const v of vulnRes.rows) {
        vulnsMap.set(v.cve_id, v);
      }

      // 4. Fetch controls
      let controlsByAsset: Record<string, any[]> = {};
      try {
        const ctrlPlaceholders = loadedAssetIds.map((_, i) => `$${i + 1}`).join(', ');
        const controlsSql = `
          SELECT asset_id, control_code, status, source
          FROM asset_controls
          WHERE asset_id IN (${ctrlPlaceholders})
        `;
        const ctrlRes = await query(controlsSql, [...loadedAssetIds]);
        for (const row of ctrlRes.rows) {
          if (!controlsByAsset[row.asset_id]) {
            controlsByAsset[row.asset_id] = [];
          }
          controlsByAsset[row.asset_id].push({
            controlCode: row.control_code,
            status: row.status,
            source: row.source,
          });
        }
      } catch {
        controlsByAsset = {};
      }

      // 5. Query stored financial_results for authoritative baseline metrics
      const finMap = new Map<string, any>();
      try {
        const finPlaceholders = loadedAssetIds.map((_, i) => `$${i + 1}`).join(', ');
        const finSql = `
          SELECT asset_id, cve_id, sle, alef, eal, eal_status, currency, primary_loss, secondary_loss,
                 estimated_outage_hours, hourly_downtime_rate, recovery_cost
          FROM financial_results
          WHERE asset_id IN (${finPlaceholders})
        `;
        const finRes = await query(finSql, [...loadedAssetIds]);
        for (const row of finRes.rows) {
          finMap.set(`${row.asset_id}:${row.cve_id}`, row);
        }
      } catch {
        // financial_results table may be empty or unpopulated
      }

      const riskInputs: any[] = [];
      const financialInputs: any[] = [];

      for (const av of avRes.rows) {
        const asset = assetsMap.get(av.asset_id);
        const vuln = vulnsMap.get(av.cve_id);
        if (!asset || !vuln) continue;

        const criticality = typeof asset.business_criticality === 'number'
          ? asset.business_criticality
          : (asset.business_criticality === 'TIER_1' || asset.business_criticality === 'CRITICAL' ? 1 : 3);
        const isInternetFacing = asset.is_internet_facing !== null && asset.is_internet_facing !== undefined
          ? Boolean(asset.is_internet_facing)
          : false;
        const controls = controlsByAsset[asset.id] || [];

        // Baseline risk input
        riskInputs.push({
          asset: {
            assetId: asset.id,
            assetName: asset.name,
            criticalityTier: criticality,
            isInternetFacing,
            controls,
          },
          vulnerability: {
            cveId: vuln.cve_id,
            cvssScore: vuln.cvss_base_score !== null ? parseFloat(vuln.cvss_base_score) : null,
            cvssVersion: vuln.cvss_version,
            isKnownExploited: Boolean(vuln.known_exploited),
            knownRansomwareCampaignUse: vuln.kev_known_ransomware_campaign_use,
            sourceIdentifier: vuln.source_identifier,
          },
        });

        // Baseline financial input — authoritative values only from financial_results
        const finRow = finMap.get(`${asset.id}:${vuln.cve_id}`);
        if (finRow && (finRow.hourly_downtime_rate !== null || finRow.recovery_cost !== null || finRow.estimated_outage_hours !== null)) {
          financialInputs.push({
            asset: {
              assetId: asset.id,
              assetName: asset.name,
              criticalityTier: criticality,
              isInternetFacing,
              hourlyDowntimeCost: finRow.hourly_downtime_rate !== null ? parseFloat(finRow.hourly_downtime_rate) : null,
              recoveryCost: finRow.recovery_cost !== null ? parseFloat(finRow.recovery_cost) : null,
              estimatedOutageHours: finRow.estimated_outage_hours !== null ? parseFloat(finRow.estimated_outage_hours) : null,
              annualizedLossEventFrequency: finRow.alef !== null ? parseFloat(finRow.alef) : null,
              currency: finRow.currency || 'USD',
            },
            vulnerability: {
              cveId: vuln.cve_id,
              cvssScore: vuln.cvss_base_score !== null ? parseFloat(vuln.cvss_base_score) : null,
              availabilityImpact: 'HIGH',
              scope: 'UNCHANGED',
              isKnownExploited: Boolean(vuln.known_exploited),
              knownRansomwareCampaignUse: vuln.kev_known_ransomware_campaign_use,
              annualizedLossEventFrequency: finRow.alef !== null ? parseFloat(finRow.alef) : null,
            },
          });
        }
      }

      return { riskInputs, financialInputs };
    } catch (err: any) {
      logger.warn('Could not query database for scenario baseline; returning empty baseline', {
        error: err.message,
      });
      return { riskInputs: [], financialInputs: [] };
    }
  }
}

export const scenariosService = new ScenariosService();
