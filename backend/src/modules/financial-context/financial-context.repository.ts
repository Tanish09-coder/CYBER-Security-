// =============================================================================
// CyberRiskOS — Financial Context & Enterprise Inputs Repository
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { query } from '../../db';
import {
  OrganizationFinancialParameters,
  SetFinancialParametersInput,
  RemediationAction,
  CreateRemediationActionInput,
  AssetDependency,
  CreateAssetDependencyInput,
  ComplianceFramework,
  ComplianceEvidence,
  CreateComplianceEvidenceInput,
  EnterpriseRiskInputsBundle,
} from './financial-context.types';
import { logger } from '../../config/logger';

export class FinancialContextRepository {
  // ---------------------------------------------------------------------------
  // Financial Parameters
  // ---------------------------------------------------------------------------

  async getFinancialParameters(organizationId: string): Promise<OrganizationFinancialParameters | null> {
    const res = await query<any>(
      `SELECT * FROM organization_financial_parameters WHERE organization_id = $1`,
      [organizationId]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    return {
      id: row.id,
      organizationId: row.organization_id,
      hourlyDowntimeCost: row.hourly_downtime_cost !== null ? parseFloat(row.hourly_downtime_cost) : null,
      hourlyRecoveryRate: row.hourly_recovery_rate !== null ? parseFloat(row.hourly_recovery_rate) : null,
      costPerSensitiveRecord: row.cost_per_sensitive_record !== null ? parseFloat(row.cost_per_sensitive_record) : null,
      regulatoryBreachPenalty: row.regulatory_breach_penalty !== null ? parseFloat(row.regulatory_breach_penalty) : null,
      dailyTransactionVolume: row.daily_transaction_volume !== null ? parseFloat(row.daily_transaction_volume) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async upsertFinancialParameters(
    organizationId: string,
    input: SetFinancialParametersInput
  ): Promise<OrganizationFinancialParameters> {
    const res = await query<any>(
      `INSERT INTO organization_financial_parameters (
        organization_id, hourly_downtime_cost, hourly_recovery_rate,
        cost_per_sensitive_record, regulatory_breach_penalty, daily_transaction_volume
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (organization_id) DO UPDATE SET
        hourly_downtime_cost = EXCLUDED.hourly_downtime_cost,
        hourly_recovery_rate = EXCLUDED.hourly_recovery_rate,
        cost_per_sensitive_record = EXCLUDED.cost_per_sensitive_record,
        regulatory_breach_penalty = EXCLUDED.regulatory_breach_penalty,
        daily_transaction_volume = EXCLUDED.daily_transaction_volume,
        updated_at = NOW()
       RETURNING *`,
      [
        organizationId,
        input.hourlyDowntimeCost ?? null,
        input.hourlyRecoveryRate ?? null,
        input.costPerSensitiveRecord ?? null,
        input.regulatoryBreachPenalty ?? null,
        input.dailyTransactionVolume ?? null,
      ]
    );

    const row = res.rows[0];
    logger.info('Updated organization financial parameters', { organizationId });

    return {
      id: row.id,
      organizationId: row.organization_id,
      hourlyDowntimeCost: row.hourly_downtime_cost !== null ? parseFloat(row.hourly_downtime_cost) : null,
      hourlyRecoveryRate: row.hourly_recovery_rate !== null ? parseFloat(row.hourly_recovery_rate) : null,
      costPerSensitiveRecord: row.cost_per_sensitive_record !== null ? parseFloat(row.cost_per_sensitive_record) : null,
      regulatoryBreachPenalty: row.regulatory_breach_penalty !== null ? parseFloat(row.regulatory_breach_penalty) : null,
      dailyTransactionVolume: row.daily_transaction_volume !== null ? parseFloat(row.daily_transaction_volume) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ---------------------------------------------------------------------------
  // Remediation Action Catalog
  // ---------------------------------------------------------------------------

  async createRemediationAction(input: CreateRemediationActionInput): Promise<RemediationAction> {
    const res = await query<any>(
      `INSERT INTO remediation_actions (
        organization_id, title, description, action_type, remediation_cost,
        estimated_effort_hours, target_control_code, target_cve_id, affected_asset_ids, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        input.organizationId,
        input.title,
        input.description || null,
        input.actionType,
        input.remediationCost,
        input.estimatedEffortHours ?? null,
        input.targetControlCode || null,
        input.targetCveId || null,
        JSON.stringify(input.affectedAssetIds || []),
        input.status || 'PLANNED',
      ]
    );

    const row = res.rows[0];
    logger.info('Created remediation action', { id: row.id, title: input.title });

    return {
      id: row.id,
      organizationId: row.organization_id,
      title: row.title,
      description: row.description,
      actionType: row.action_type,
      remediationCost: parseFloat(row.remediation_cost),
      estimatedEffortHours: row.estimated_effort_hours !== null ? parseFloat(row.estimated_effort_hours) : null,
      targetControlCode: row.target_control_code,
      targetCveId: row.target_cve_id,
      affectedAssetIds: typeof row.affected_asset_ids === 'string' ? JSON.parse(row.affected_asset_ids) : (row.affected_asset_ids || []),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listRemediationActions(organizationId: string): Promise<RemediationAction[]> {
    const res = await query<any>(
      `SELECT * FROM remediation_actions WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organizationId]
    );

    return res.rows.map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      title: row.title,
      description: row.description,
      actionType: row.action_type,
      remediationCost: parseFloat(row.remediation_cost),
      estimatedEffortHours: row.estimated_effort_hours !== null ? parseFloat(row.estimated_effort_hours) : null,
      targetControlCode: row.target_control_code,
      targetCveId: row.target_cve_id,
      affectedAssetIds: typeof row.affected_asset_ids === 'string' ? JSON.parse(row.affected_asset_ids) : (row.affected_asset_ids || []),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  // ---------------------------------------------------------------------------
  // Asset Dependencies
  // ---------------------------------------------------------------------------

  async createAssetDependency(input: CreateAssetDependencyInput): Promise<AssetDependency> {
    const res = await query<any>(
      `INSERT INTO asset_dependencies (
        source_asset_id, target_asset_id, dependency_type, propagation_weight, notes
       )
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (source_asset_id, target_asset_id) DO UPDATE SET
        dependency_type = EXCLUDED.dependency_type,
        propagation_weight = EXCLUDED.propagation_weight,
        notes = EXCLUDED.notes,
        updated_at = NOW()
       RETURNING *`,
      [
        input.sourceAssetId,
        input.targetAssetId,
        input.dependencyType || 'API',
        input.propagationWeight ?? 0.20,
        input.notes || null,
      ]
    );

    const row = res.rows[0];
    logger.info('Created asset dependency', { source: input.sourceAssetId, target: input.targetAssetId });

    return {
      id: row.id,
      sourceAssetId: row.source_asset_id,
      targetAssetId: row.target_asset_id,
      dependencyType: row.dependency_type,
      propagationWeight: parseFloat(row.propagation_weight),
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getAssetDependencies(assetId: string): Promise<AssetDependency[]> {
    const res = await query<any>(
      `SELECT * FROM asset_dependencies WHERE source_asset_id = $1 OR target_asset_id = $1`,
      [assetId]
    );

    return res.rows.map(row => ({
      id: row.id,
      sourceAssetId: row.source_asset_id,
      targetAssetId: row.target_asset_id,
      dependencyType: row.dependency_type,
      propagationWeight: parseFloat(row.propagation_weight),
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  // ---------------------------------------------------------------------------
  // Compliance Frameworks & Evidence
  // ---------------------------------------------------------------------------

  async listComplianceFrameworks(): Promise<ComplianceFramework[]> {
    const res = await query<any>(
      `SELECT * FROM compliance_frameworks ORDER BY code ASC`
    );

    return res.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      version: row.version,
      description: row.description,
      createdAt: row.created_at,
    }));
  }

  async createComplianceEvidence(input: CreateComplianceEvidenceInput): Promise<ComplianceEvidence> {
    const res = await query<any>(
      `INSERT INTO compliance_evidence (
        organization_id, compliance_control_id, asset_id, evidence_uri, evidence_type, status, verified_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.organizationId,
        input.complianceControlId,
        input.assetId || null,
        input.evidenceUri,
        input.evidenceType || 'DOCUMENT',
        input.status || 'PENDING',
        input.status === 'VERIFIED' ? new Date() : null,
      ]
    );

    const row = res.rows[0];

    return {
      id: row.id,
      organizationId: row.organization_id,
      complianceControlId: row.compliance_control_id,
      assetId: row.asset_id,
      evidenceUri: row.evidence_uri,
      evidenceType: row.evidence_type,
      status: row.status,
      verifiedAt: row.verified_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listComplianceEvidence(organizationId: string): Promise<ComplianceEvidence[]> {
    const res = await query<any>(
      `SELECT * FROM compliance_evidence WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organizationId]
    );

    return res.rows.map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      complianceControlId: row.compliance_control_id,
      assetId: row.asset_id,
      evidenceUri: row.evidence_uri,
      evidenceType: row.evidence_type,
      status: row.status,
      verifiedAt: row.verified_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getRemediationBudgetSummary(organizationId: string): Promise<{
    organizationId: string;
    totalPlannedCost: number;
    totalApprovedCost: number;
    totalCompletedCost: number;
    totalOrganizationBudget: number | null;
    actionCount: number;
  }> {
    const actionsRes = await query<any>(
      `SELECT status, SUM(remediation_cost) as total_cost, COUNT(*) as count
       FROM remediation_actions
       WHERE organization_id = $1
       GROUP BY status`,
      [organizationId]
    );

    const budgetRes = await query<any>(
      `SELECT SUM(budget) as total_budget FROM business_units WHERE organization_id = $1`,
      [organizationId]
    );

    let totalPlannedCost = 0;
    let totalApprovedCost = 0;
    let totalCompletedCost = 0;
    let actionCount = 0;

    for (const row of actionsRes.rows) {
      const cost = parseFloat(row.total_cost || '0');
      const cnt = parseInt(row.count, 10);
      actionCount += cnt;

      if (row.status === 'PLANNED') totalPlannedCost += cost;
      if (row.status === 'APPROVED' || row.status === 'IN_PROGRESS') totalApprovedCost += cost;
      if (row.status === 'COMPLETED') totalCompletedCost += cost;
    }

    const totalBudget = budgetRes.rows[0]?.total_budget ? parseFloat(budgetRes.rows[0].total_budget) : null;

    return {
      organizationId,
      totalPlannedCost,
      totalApprovedCost,
      totalCompletedCost,
      totalOrganizationBudget: totalBudget,
      actionCount,
    };
  }

  async getFrameworkCoverage(frameworkCode: string, organizationId: string): Promise<{
    frameworkCode: string;
    organizationId: string;
    totalFrameworkControls: number;
    implementedControls: number;
    partialControls: number;
    notImplementedControls: number;
    coveragePercentage: number;
  }> {
    const fwRes = await query<any>(`SELECT id FROM compliance_frameworks WHERE code = $1`, [frameworkCode]);
    if (fwRes.rows.length === 0) {
      return {
        frameworkCode,
        organizationId,
        totalFrameworkControls: 0,
        implementedControls: 0,
        partialControls: 0,
        notImplementedControls: 0,
        coveragePercentage: 0,
      };
    }

    const frameworkId = fwRes.rows[0].id;
    const ctrlRes = await query<any>(
      `SELECT cc.requirement_code, ccm.security_control_code
       FROM compliance_controls cc
       LEFT JOIN control_compliance_mappings ccm ON cc.id = ccm.compliance_control_id
       WHERE cc.framework_id = $1`,
      [frameworkId]
    );

    const totalFrameworkControls = ctrlRes.rows.length;
    if (totalFrameworkControls === 0) {
      return {
        frameworkCode,
        organizationId,
        totalFrameworkControls: 0,
        implementedControls: 0,
        partialControls: 0,
        notImplementedControls: 0,
        coveragePercentage: 0,
      };
    }

    // Get asset controls status for this org
    const postureRes = await query<any>(
      `SELECT sc.code as control_code, ac.status
       FROM asset_controls ac
       JOIN security_controls sc ON ac.control_id = sc.id
       JOIN assets a ON ac.asset_id = a.id
       WHERE a.organization_id = $1`,
      [organizationId]
    );

    const statusMap = new Map<string, string>();
    for (const r of postureRes.rows) {
      statusMap.set(r.control_code, r.status);
    }

    let implemented = 0;
    let partial = 0;
    let notImplemented = 0;

    for (const ctrl of ctrlRes.rows) {
      const code = ctrl.security_control_code;
      const status = code ? statusMap.get(code) : undefined;
      if (status === 'IMPLEMENTED') implemented++;
      else if (status === 'PARTIAL') partial++;
      else notImplemented++;
    }

    const coveragePercentage = Math.round((implemented / totalFrameworkControls) * 100 * 100) / 100;

    return {
      frameworkCode,
      organizationId,
      totalFrameworkControls,
      implementedControls: implemented,
      partialControls: partial,
      notImplementedControls: notImplemented,
      coveragePercentage,
    };
  }

  async getComplianceGaps(organizationId: string): Promise<Array<{
    controlCode: string;
    controlTitle: string;
    unprotectedAssetsCount: number;
    severity: string;
  }>> {
    const gapsRes = await query<any>(
      `SELECT sc.code, sc.name, COUNT(ac.asset_id) as unprotected_count
       FROM asset_controls ac
       JOIN security_controls sc ON ac.control_id = sc.id
       JOIN assets a ON ac.asset_id = a.id
       WHERE a.organization_id = $1 AND ac.status IN ('NOT_IMPLEMENTED', 'UNKNOWN')
       GROUP BY sc.code, sc.name
       ORDER BY unprotected_count DESC`,
      [organizationId]
    );

    return gapsRes.rows.map(row => ({
      controlCode: row.code,
      controlTitle: row.name,
      unprotectedAssetsCount: parseInt(row.unprotected_count, 10),
      severity: parseInt(row.unprotected_count, 10) > 5 ? 'HIGH' : 'MEDIUM',
    }));
  }

  // ---------------------------------------------------------------------------
  // Aggregated Risk Inputs Bundle for Tanish's Risk Engine
  // ---------------------------------------------------------------------------

  async getAggregatedRiskInputsBundle(organizationId: string): Promise<EnterpriseRiskInputsBundle> {
    // 1. Fetch organization profile for currency
    const orgRes = await query<any>(`SELECT currency FROM organizations WHERE id = $1`, [organizationId]);
    const currency: string | null = orgRes.rows[0]?.currency ?? null; // null = org currency unavailable

    // 2. Fetch financial parameters
    const finParams = await this.getFinancialParameters(organizationId);

    // 3. Fetch assets with business unit names
    const assetRes = await query<any>(
      `SELECT a.*, bu.name as business_unit_name
       FROM assets a
       LEFT JOIN business_units bu ON a.business_unit_id = bu.id
       WHERE a.organization_id = $1`,
      [organizationId]
    );

    // 4. For each asset, fetch controls and upstream dependencies
    const assetsBundle = [];
    for (const asset of assetRes.rows) {
      const controlsRes = await query<any>(
        `SELECT ac.control_code, ac.status, ac.effectiveness_score, sc.default_mitigation_weight
         FROM asset_controls ac
         JOIN security_controls sc ON ac.control_id = sc.id
         WHERE ac.asset_id = $1`,
        [asset.id]
      );

      const depsRes = await query<any>(
        `SELECT source_asset_id FROM asset_dependencies WHERE target_asset_id = $1`,
        [asset.id]
      );

      assetsBundle.push({
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.asset_type,
        businessUnit: asset.business_unit_name || 'Unassigned',
        criticalityTier: asset.business_criticality,
        isInternetFacing: asset.is_internet_facing,
        dataClassification: asset.data_classification,
        revenueDependencyPct: parseFloat(asset.revenue_dependency_pct || '0'),
        operationalImportanceScore: parseFloat(asset.operational_importance || '1.0'),
        controls: controlsRes.rows.map(c => ({
          controlCode: c.control_code,
          status: c.status,
          effectivenessScore: parseFloat(c.effectiveness_score),
          mitigationWeight: parseFloat(c.default_mitigation_weight),
        })),
        upstreamDependencies: depsRes.rows.map(d => d.source_asset_id),
      });
    }

    // 5. Fetch remediation actions
    const actions = await this.listRemediationActions(organizationId);

    return {
      organizationId,
      currency,
      financialParameters: {
        hourlyDowntimeCost: finParams?.hourlyDowntimeCost ?? null,
        hourlyRecoveryRate: finParams?.hourlyRecoveryRate ?? null,
        costPerSensitiveRecord: finParams?.costPerSensitiveRecord ?? null,
        regulatoryBreachPenalty: finParams?.regulatoryBreachPenalty ?? null,
        dailyTransactionVolume: finParams?.dailyTransactionVolume ?? null,
      },
      assets: assetsBundle,
      remediationActions: actions.map(act => ({
        actionId: act.id,
        actionType: act.actionType,
        title: act.title,
        remediationCost: act.remediationCost,
        targetControlCode: act.targetControlCode || undefined,
        targetCveId: act.targetCveId || undefined,
        affectedAssetIds: act.affectedAssetIds,
      })),
    };
  }
}
