import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Info, AlertTriangle } from 'lucide-react';
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

  // 1. LOADING STATE
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-sm font-medium text-text-secondary">Quantifying enterprise risk...</p>
      </div>
    );
  }

  // 2. ERROR STATE
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-lg text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-red-900 mb-2">Unable to Load Risk Overview</h3>
          <p className="text-xs text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
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
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-app-surface border border-app-border p-8 rounded-lg max-w-md text-center shadow-sm">
          <Info className="w-10 h-10 text-text-muted mx-auto mb-4" />
          <h3 className="text-base font-bold text-text-primary mb-2">No Risk Data Available</h3>
          <p className="text-xs text-text-secondary">
            Please ensure asset inventories and vulnerability scans are integrated to generate the initial risk quantification.
          </p>
        </div>
      </div>
    );
  }

  // 4. INCOMPLETE DATA STATE / POPULATED
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Enterprise Risk Overview</h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200">
          Model v1.0.0
        </span>
      </div>
      
      {/* High Level Rollups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Annual Loss Expectancy</h3>
          <p className="text-3xl font-bold text-text-primary">
            {data.currency} {data.total_modeled_annual_exposure.toLocaleString()}
          </p>
        </div>
        <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Evaluated Assets</h3>
          <p className="text-3xl font-bold text-text-primary">
            {data.evaluated_asset_count.toLocaleString()}
          </p>
        </div>
        <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Highest Exposure Asset</h3>
          <p className="text-xl font-bold text-text-primary truncate" title={data.highest_exposure_asset_id}>
            {data.highest_exposure_asset_id || "N/A"}
          </p>
        </div>
      </div>

      {/* Incomplete Data Banner (Dependency Request NISHIT-006) */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-md">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-amber-600 mr-3" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">Incomplete Data: Granular Vulnerability Risk Pending</h3>
            <p className="text-xs text-amber-800 mt-1">
              Asset-level risk aggregates are available. However, per-vulnerability risk drill-downs (CVE ID, Base CVSS, per-CVE Risk Score) are awaiting backend schema definition. See dependency request <strong>NISHIT-006</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Asset Risk Table (Populated with what we have) */}
      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-app-border bg-surface-secondary">
          <h3 className="text-sm font-semibold text-text-primary">Asset Risk Rollup</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-app-border">
            <thead className="bg-app-surface">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Asset Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Risk Tier</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Incident Probability</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Modeled Exposure</th>
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
                    {data.currency} {asset.modeled_annual_exposure.toLocaleString()}
                  </td>
                </tr>
              ))}
              {data.asset_results.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-text-muted">
                    No asset risk results provided in the response payload.
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

