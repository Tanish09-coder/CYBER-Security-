// =============================================================================
// CyberRiskOS — Financial Inputs & Integration Tests (Phase 3, 5, 7)
// Owner: HARSH
// =============================================================================

import { query } from '../../../db';
import { FinancialContextService } from '../financial-context.service';

jest.mock('../../../db', () => ({
  query: jest.fn(),
}));

describe('FinancialContextService Integration', () => {
  let service: FinancialContextService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FinancialContextService();
  });

  describe('Phase 3 — Financial Inputs', () => {
    it('should upsert financial parameters with non-negative validation', async () => {
      const mockRow = {
        id: 'fin-uuid-1',
        organization_id: 'org-uuid-1',
        hourly_downtime_cost: '15000.00',
        hourly_recovery_rate: '250.00',
        cost_per_sensitive_record: '150.00',
        regulatory_breach_penalty: '500000.00',
        daily_transaction_volume: '1000000.00',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (query as jest.Mock).mockResolvedValueOnce({ rows: [mockRow] });

      const result = await service.upsertFinancialParameters('org-uuid-1', {
        hourlyDowntimeCost: 15000,
        hourlyRecoveryRate: 250,
        costPerSensitiveRecord: 150,
        regulatoryBreachPenalty: 500000,
        dailyTransactionVolume: 1000000,
      });

      expect(result.hourlyDowntimeCost).toBe(15000);
      expect(result.hourlyRecoveryRate).toBe(250);
      expect(query).toHaveBeenCalled();
    });

    it('should reject negative downtime cost values in validation', async () => {
      await expect(
        service.upsertFinancialParameters('org-uuid-1', {
          hourlyDowntimeCost: -500,
        })
      ).rejects.toThrow();
    });
  });

  describe('Phase 5 — Remediation Budget Summary', () => {
    it('should compute remediation budget summary accurately', async () => {
      (query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            { status: 'PLANNED', total_cost: '25000.00', count: '2' },
            { status: 'APPROVED', total_cost: '10000.00', count: '1' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ total_budget: '100000.00' }],
        });

      const summary = await service.getRemediationBudgetSummary('org-uuid-1');

      expect(summary.totalPlannedCost).toBe(25000);
      expect(summary.totalApprovedCost).toBe(10000);
      expect(summary.totalOrganizationBudget).toBe(100000);
      expect(summary.actionCount).toBe(3);
    });
  });

  describe('Phase 7A — Compliance Framework Coverage & Gaps', () => {
    it('should return compliance gaps for unprotected controls', async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { code: 'MFA', name: 'Multi-Factor Authentication', unprotected_count: '8' },
          { code: 'EDR', name: 'Endpoint Detection', unprotected_count: '3' },
        ],
      });

      const gaps = await service.getComplianceGaps('org-uuid-1');

      expect(gaps.length).toBe(2);
      expect(gaps[0].controlCode).toBe('MFA');
      expect(gaps[0].severity).toBe('HIGH');
      expect(gaps[1].severity).toBe('MEDIUM');
    });
  });
});
