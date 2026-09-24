import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { WhatIfSimulationResponse } from '../types/risk';
import { riskApi } from '../api/risk';

export const WhatIfSimulator: React.FC = () => {
  const [data, setData] = useState<WhatIfSimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await riskApi.simulateWhatIf({
          organization_id: 'org-default',
          baseline_request: {
            organization_id: 'org-default',
            financial_parameters: { hourly_downtime_cost: 0, hourly_recovery_rate: 0, cost_per_sensitive_record: 0, regulatory_breach_penalty: 0, daily_transaction_volume: 0 },
            assets: []
          },
          interventions: []
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
      <p className="text-sm font-medium text-text-secondary">Loading simulation sandbox...</p>
    </div>
  );

  if (error) return (
    <div className="p-6 h-full flex flex-col items-center justify-center">
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-lg text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h3 className="text-sm font-bold text-red-900 mb-2">Simulation Blocked</h3>
        <p className="text-xs text-red-700">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-text-primary mb-6">What-If Risk Simulator</h2>
      {data && (
        <div className="bg-app-surface border border-app-border p-4 rounded text-sm text-text-primary">
          Simulated Exposure: {data.simulated_exposure}
        </div>
      )}
    </div>
  );
};
