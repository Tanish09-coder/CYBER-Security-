import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Info, ShieldAlert } from 'lucide-react';
import { FinancialExposureResponse } from '../types/risk';
import { riskApi } from '../api/risk';

export const FinancialExposure: React.FC = () => {
  const [data, setData] = useState<FinancialExposureResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await riskApi.getFinancialExposure({ limit: 100 });
        setData(response);
      } catch (err: any) {
        setError(err.message || "Failed to load financial exposure.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 1. LOADING STATE
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-sm font-medium text-text-secondary">Quantifying financial exposure...</p>
      </div>
    );
  }

  // 2. ERROR STATE
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 min-h-[400px]">
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
  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 min-h-[400px]">
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

  const items = data.items;
  const totalEal = items.reduce((sum, item) => sum + (item.eal || 0), 0);
  const currency = items.length > 0 ? items[0].currency : 'USD';

  // 4. POPULATED STATE
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Required Banner */}
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

      {/* High Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Total Modeled Annual Exposure</h3>
          <p className="text-4xl font-bold text-text-primary text-purple-700">
            {currency} {totalEal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Evaluated Exposures</h3>
          <p className="text-4xl font-bold text-text-primary">
            {data.total.toLocaleString()}
          </p>
        </div>
        <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Data Completeness (Avg)</h3>
          <p className="text-4xl font-bold text-text-primary">
            {((items.reduce((acc, curr) => acc + curr.dataCompletenessScore, 0) / items.length) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Asset Level Financial Exposure Breakdown */}
      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-app-border bg-surface-secondary">
          <h3 className="text-sm font-semibold text-text-primary">Asset & Vulnerability Financial Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-app-border">
            <thead className="bg-app-surface">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Asset Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">CVE ID</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Primary Loss</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Secondary Loss</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Single Loss Exp. (SLE)</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Modeled Annual (EAL)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-app-border">
              {items.map((item, idx) => (
                <tr key={`${item.assetId}-${item.cveId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                    {item.assetName || item.assetId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {item.cveId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary text-right">
                    {item.primaryLoss ? `${item.currency} ${item.primaryLoss.toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary text-right">
                    {item.secondaryLoss ? `${item.currency} ${item.secondaryLoss.toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary text-right">
                    {item.sle ? `${item.currency} ${item.sle.toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-700 text-right">
                    {item.eal ? `${item.currency} ${item.eal.toLocaleString()}` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
