import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { RiskCalculationResponse } from '../types/risk';
import { riskApi } from '../api/risk';

export const FinancialExposure: React.FC = () => {
  const [data, setData] = useState<RiskCalculationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await riskApi.calculateRisk({
          organization_id: 'org-default',
          financial_parameters: { hourly_downtime_cost: 0, hourly_recovery_rate: 0, cost_per_sensitive_record: 0, regulatory_breach_penalty: 0, daily_transaction_volume: 0 },
          assets: []
        });
        setData(response);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      <p className="text-sm font-medium text-text-secondary">Simulating Monte Carlo loss exceedance...</p>
    </div>
  );

  if (error) return (
    <div className="p-6 h-full flex flex-col items-center justify-center">
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-lg text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h3 className="text-sm font-bold text-red-900 mb-2">Exposure Calculation Blocked</h3>
        <p className="text-xs text-red-700">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-text-primary mb-6">Financial Exposure Analysis</h2>
      {data && (
        <div className="bg-app-surface border border-app-border p-4 rounded text-sm text-text-primary">
          Total Exposure: {data.currency} {data.total_modeled_annual_exposure}
        </div>
      )}
    </div>
  );
};
