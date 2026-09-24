// =============================================================================
// CyberRiskOS — Executive Dashboard Service Layer
// Phase: Phase 6 — Executive Decision Dashboard
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P6-01)
// =============================================================================

import { executiveRepository, ExecutiveRepository } from './executive.repository';
import {
  ExecutivePostureDTO,
  ExecutiveTopRiskDTO,
  ExecutiveFinancialSummaryDTO,
} from './executive.types';

export class ExecutiveService {
  constructor(private repo: ExecutiveRepository = executiveRepository) {}

  async getExecutivePosture(orgId?: string): Promise<ExecutivePostureDTO> {
    return await this.repo.getExecutivePosture(orgId);
  }

  async getTopRisks(limit: number = 5, orgId?: string): Promise<ExecutiveTopRiskDTO[]> {
    const safeLimit = Math.max(1, Math.min(20, limit));
    return await this.repo.getTopRisks(safeLimit, orgId);
  }

  async getFinancialSummary(orgId?: string): Promise<ExecutiveFinancialSummaryDTO> {
    return await this.repo.getFinancialSummary(orgId);
  }
}

export const executiveService = new ExecutiveService();
