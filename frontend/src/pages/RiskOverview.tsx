import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Info } from 'lucide-react';
import { RiskCalculationResponse } from '../types/risk';
import { riskApi } from '../api/risk';

export const RiskOverview: React.FC = () => {
  const [data, setData] = useState<RiskCalculationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        setLoading(true);
        // We construct a basic request object to satisfy the contract.
        // In a fully integrated flow, these inputs would come from the user's selected context.
        const response = await riskApi.calculateRisk({
          organization_id: 'org-default',
          financial_parameters: {
            hourly_downtime_cost: 0,
            hourly_recovery_rate: 0,
            cost_per_sensitive_record: 0,
            regulatory_breach_penalty: 0,
            daily_transaction_volume: 0
          },
          assets: []
        });
        setData(response);
      } catch (err: any) {
        setError(err.message || "Failed to load risk overview.");
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-sm font-medium text-text-secondary">Quantifying enterprise risk...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-lg text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-red-900 mb-2">Unable to Load Risk Overview</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.evaluated_asset_count === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-app-surface border border-app-border p-8 rounded-lg max-w-md text-center">
          <Info className="w-10 h-10 text-text-muted mx-auto mb-4" />
          <h3 className="text-base font-bold text-text-primary mb-2">No Risk Data Available</h3>
          <p className="text-xs text-text-secondary">
            Please ensure asset inventories and vulnerability scans are integrated to generate the initial risk quantification.
          </p>
        </div>
      </div>
    );
  }

  // POPULATED STATE (Waiting for real data contract)
  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-text-primary mb-6">Enterprise Risk Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Annual Loss Expectancy</h3>
          <p className="text-2xl font-bold text-text-primary">
            {data.currency} {data.total_modeled_annual_exposure.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
