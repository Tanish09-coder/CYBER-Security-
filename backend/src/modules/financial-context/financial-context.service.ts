// =============================================================================
// CyberRiskOS — Financial Context & Enterprise Inputs Service
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { FinancialContextRepository } from './financial-context.repository';
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
import {
  financialParametersSchema,
  remediationActionSchema,
  assetDependencySchema,
  complianceEvidenceSchema,
} from './financial-context.validation';

export class FinancialContextService {
  constructor(private repo: FinancialContextRepository = new FinancialContextRepository()) {}

  async getFinancialParameters(organizationId: string): Promise<OrganizationFinancialParameters | null> {
    return this.repo.getFinancialParameters(organizationId);
  }

  async upsertFinancialParameters(
    organizationId: string,
    rawInput: SetFinancialParametersInput
  ): Promise<OrganizationFinancialParameters> {
    const validated = financialParametersSchema.parse(rawInput);
    return this.repo.upsertFinancialParameters(organizationId, validated);
  }

  async createRemediationAction(rawInput: CreateRemediationActionInput): Promise<RemediationAction> {
    const validated = remediationActionSchema.parse(rawInput);
    return this.repo.createRemediationAction(validated as CreateRemediationActionInput);
  }

  async listRemediationActions(organizationId: string): Promise<RemediationAction[]> {
    return this.repo.listRemediationActions(organizationId);
  }

  async createAssetDependency(rawInput: CreateAssetDependencyInput): Promise<AssetDependency> {
    const validated = assetDependencySchema.parse(rawInput);
    return this.repo.createAssetDependency(validated as CreateAssetDependencyInput);
  }

  async getAssetDependencies(assetId: string): Promise<AssetDependency[]> {
    return this.repo.getAssetDependencies(assetId);
  }

  async listComplianceFrameworks(): Promise<ComplianceFramework[]> {
    return this.repo.listComplianceFrameworks();
  }

  async createComplianceEvidence(rawInput: CreateComplianceEvidenceInput): Promise<ComplianceEvidence> {
    const validated = complianceEvidenceSchema.parse(rawInput);
    return this.repo.createComplianceEvidence(validated as CreateComplianceEvidenceInput);
  }

  async listComplianceEvidence(organizationId: string): Promise<ComplianceEvidence[]> {
    return this.repo.listComplianceEvidence(organizationId);
  }

  async getRemediationBudgetSummary(organizationId: string) {
    return this.repo.getRemediationBudgetSummary(organizationId);
  }

  async getFrameworkCoverage(frameworkCode: string, organizationId: string) {
    return this.repo.getFrameworkCoverage(frameworkCode, organizationId);
  }

  async getComplianceGaps(organizationId: string, frameworkCode?: string) {
    return this.repo.getComplianceGaps(organizationId, frameworkCode);
  }

  async getAggregatedRiskInputsBundle(organizationId: string): Promise<EnterpriseRiskInputsBundle> {
    return this.repo.getAggregatedRiskInputsBundle(organizationId);
  }
}
