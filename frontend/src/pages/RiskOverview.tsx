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
        const response = await riskApi.getRiskScores({ limit: 100 });
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
      <div className="flex flex-col items-center justify-center h-full space-y-4 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-sm font-medium text-text-secondary">Quantifying enterprise risk...</p>
      </div>
    );
  }

  // 2. ERROR STATE
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
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
  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
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

  const items = data.items;
  const criticalItems = items.filter(item => (item.level || item.severity) === 'CRITICAL').length;
  const avgCompleteness = items.length > 0
    ? ((items.reduce((acc, curr) => acc + (curr.dataCompleteness ?? curr.dataCompletenessScore ?? 0), 0) / items.length) * 100).toFixed(1)
    : '0.0';
  
  // 4. INCOMPLETE DATA STATE / POPULATED
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Enterprise Risk Overview</h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200">
          Model v{items[0]?.modelVersion || '1.0.0'}
        </span>
      </div>
      
      {/* High Level Rollups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Total Evaluated Risks</h3>
          <p className="text-3xl font-bold text-text-primary">
            {data.total.toLocaleString()}
          </p>
        </div>
        <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Critical Risks</h3>
          <p className="text-3xl font-bold text-red-600">
            {criticalItems.toLocaleString()}
          </p>
        </div>
        <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Data Completeness (Avg)</h3>
          <p className="text-xl font-bold text-text-primary truncate">
            {avgCompleteness}%
          </p>
        </div>
      </div>

      {/* Granular Asset/Vulnerability Risk Table */}
      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-app-border bg-surface-secondary">
          <h3 className="text-sm font-semibold text-text-primary">Granular Risk Rollup (Asset + Vulnerability)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-app-border">
            <thead className="bg-app-surface">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Asset</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">CVE ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Level / Severity</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Risk Score</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Base CVSS</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Completeness</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Provenance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-app-border">
              {items.map((item, idx) => {
                const scoreVal = item.score !== undefined ? item.score : item.riskScore;
                const levelVal = item.level || item.severity || 'UNKNOWN';
                const completenessVal = (item.dataCompleteness ?? item.dataCompletenessScore ?? 0) * 100;
                const provHash = item.inputProvenanceHash || item.provenanceHash || '';

                return (
                  <tr key={`${item.assetId}-${item.cveId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {item.assetName || item.assetId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {item.cveId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        levelVal === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        levelVal === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        levelVal === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        levelVal === 'LOW' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {levelVal}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {scoreVal !== null && scoreVal !== undefined ? (
                        <span className="font-semibold text-text-primary">{scoreVal.toFixed(2)}</span>
                      ) : (
                        <span className="text-amber-600 font-medium text-xs">NOT_AVAILABLE</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary text-right">
                      {item.baseCvss !== null && item.baseCvss !== undefined ? item.baseCvss.toFixed(1) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary text-right">
                      {completenessVal.toFixed(0)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-text-muted text-right font-mono" title={provHash}>
                      {provHash ? `${provHash.substring(0, 8)}...` : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
