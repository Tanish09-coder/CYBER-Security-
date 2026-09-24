import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Info, AlertTriangle, ShieldAlert } from 'lucide-react';
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
        // Using the verified Risk Calculation contract as the source for financial exposure
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
        setError(err.message || "Failed to calculate financial exposure.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 1. LOADING STATE
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-sm font-medium text-text-secondary">Simulating enterprise financial exposure...</p>
      </div>
    );
  }

  // 2. ERROR STATE
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-lg text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-red-900 mb-2">Exposure Calculation Blocked</h3>
          <p className="text-xs text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (!data || data.evaluated_asset_count === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="bg-app-surface border border-app-border p-8 rounded-lg max-w-md text-center shadow-sm">
          <Info className="w-10 h-10 text-text-muted mx-auto mb-4" />
          <h3 className="text-base font-bold text-text-primary mb-2">No Financial Exposure Data</h3>
          <p className="text-xs text-text-secondary">
            Ensure assets are registered and financial parameters (like downtime cost) are configured to generate the exposure model.
          </p>
        </div>
      </div>
    );
  }

  // 4. INCOMPLETE DATA & POPULATED STATE
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Required Banner per NISHIT-004 */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-text-primary flex items-center">
          <ShieldAlert className="w-6 h-6 mr-2 text-brand-primary" />
          Financial Exposure Analysis
        </h2>
        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded border border-purple-200 uppercase tracking-widest">
          Modeled / Estimated
        </span>
      </div>
      <p className="text-xs text-text-secondary mb-6">
        Note: Financial exposure figures represent modeled annualized loss expectancies based on current inputs, and must never be interpreted as guaranteed actual loss.
      </p>

      {/* Incomplete Data Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md shadow-sm">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">Incomplete Data: Granular Breakdown & Completeness Score Missing</h3>
            <p className="text-xs text-amber-800 mt-1">
              Total Annualized Exposure and Single Loss Expectancy are available. However, detailed component breakdowns (Downtime Losses, Data Breach Impact, System Recovery Costs, Remediation Expenses) and the <strong>dataCompletenessScore</strong> required for unconfigured metric warnings are missing from the backend contract. (See <strong>NISHIT-004</strong> & <strong>NISHIT-005</strong>)
            </p>
          </div>
        </div>
      </div>

      {/* High Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Total Modeled Annual Exposure</h3>
          <p className="text-4xl font-bold text-text-primary text-purple-700">
            {data.currency} {data.total_modeled_annual_exposure.toLocaleString()}
          </p>
        </div>
        <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Evaluated Assets (Impacted)</h3>
          <p className="text-4xl font-bold text-text-primary">
            {data.evaluated_asset_count.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Asset Level Financial Exposure Breakdown */}
      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-app-border bg-surface-secondary">
          <h3 className="text-sm font-semibold text-text-primary">Asset Financial Exposure Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-app-border">
            <thead className="bg-app-surface">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Asset Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Risk Tier</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Incident Prob.</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Single Loss Expectancy (SLE)</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Modeled Annual Exposure (ALE)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-app-border">
              {data.asset_results.map((asset) => (
                <tr key={asset.asset_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                    {asset.asset_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      asset.risk_tier.toUpperCase() === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      asset.risk_tier.toUpperCase() === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      asset.risk_tier.toUpperCase() === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {asset.risk_tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary text-right">
                    {(asset.incident_probability * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary text-right">
                    {data.currency} {asset.single_loss_expectancy.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-700 text-right">
                    {data.currency} {asset.modeled_annual_exposure.toLocaleString()}
                  </td>
                </tr>
              ))}
              {data.asset_results.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-text-muted">
                    No asset exposure results available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

