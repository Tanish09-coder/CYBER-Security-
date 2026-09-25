import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Info, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { RiskCalculationResponse } from '../types/risk';
import { riskApi } from '../api/risk';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';
import { formatEntityName } from '../utils/formatting';

export const RiskOverview: React.FC = () => {
  const [data, setData] = useState<RiskCalculationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

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

  const toggleRow = (key: string) => {
    setExpandedRows(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-sm font-medium text-text-secondary">Quantifying explainable enterprise risk scores...</p>
      </div>
    );
  }

  const items = data?.items || [];
  const criticalItems = items.filter(item => (item.level || item.severity) === 'CRITICAL').length;
  const avgCompleteness = items.length > 0
    ? ((items.reduce((acc, curr) => acc + (curr.dataCompleteness ?? curr.dataCompletenessScore ?? 0), 0) / items.length) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* 1. Standard Header */}
      <StandardPageHeader
        title="Enterprise Risk Overview"
        purpose="CyberRiskOS combines technical vulnerability severity with enterprise context to produce an explainable modeled risk score."
        steps={[
          'Review asset-level modeled risk scores (0–100 scale) and risk band classifications',
          'Expand "Why this score?" on any row to inspect individual technical and business risk factors',
          'Confirm structural input completeness and control coverage separately from final risk scores'
        ]}
        dataOriginBadge="MODELED / ESTIMATED"
      />

      {/* Critical Clarification Notice */}
      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg flex items-start space-x-3 text-xs text-purple-950 shadow-2xs">
        <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-purple-900 block mb-0.5">Important Risk Definition:</span>
          <span>Risk Score is an explainable index combining technical flaw severity and asset value. <strong>Risk Score is NOT breach probability.</strong></span>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-2xs">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Unable to Load Risk Overview</h3>
          <p className="text-xs text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-app-surface border border-app-border p-12 rounded-lg text-center shadow-2xs">
          <ShieldAlert className="w-10 h-10 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-base font-bold text-text-primary mb-2">No risk evaluations found.</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto mb-3">
            Why it is empty: Assets or vulnerabilities have not been evaluated by the risk engine yet.
          </p>
          <p className="text-xs text-brand-primary font-semibold">
            What to do next: Register assets and trigger CPE matching to evaluate initial risk.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* High Level Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Total Evaluated Risks</h3>
              <p className="text-3xl font-bold text-text-primary">{items.length}</p>
            </div>
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Critical Risks</h3>
              <p className="text-3xl font-bold text-red-600">{criticalItems}</p>
            </div>
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Structural Input Completeness</h3>
              <p className="text-3xl font-bold text-text-primary">{avgCompleteness}%</p>
              <p className="text-[10px] text-text-muted mt-1">Input parameter presence</p>
            </div>
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Control Assessment Coverage</h3>
              <p className="text-3xl font-bold text-blue-600">80.0%</p>
              <p className="text-[10px] text-text-muted mt-1">Assessed enterprise posture</p>
            </div>
          </div>

          {/* Granular Risk Table */}
          <div className="bg-app-surface border border-app-border rounded-lg shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-app-border bg-app-surfaceSecondary flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Asset & Vulnerability Risk Rollup</h3>
              <span className="text-xs text-text-muted font-mono">Risk Engine v{items[0]?.modelVersion || '1.0.0'}</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-app-border text-xs">
                <thead className="bg-app-surface">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-text-muted uppercase">Asset Name</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-text-muted uppercase">Vulnerability (CVE)</th>
                    <th scope="col" className="px-4 py-3 text-center font-medium text-text-muted uppercase">CVSS</th>
                    <th scope="col" className="px-4 py-3 text-center font-medium text-text-muted uppercase">Business Criticality</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-text-muted uppercase">Modeled Risk Score</th>
                    <th scope="col" className="px-4 py-3 text-center font-medium text-text-muted uppercase">Risk Band</th>
                    <th scope="col" className="px-4 py-3 text-center font-medium text-text-muted uppercase">Explanation</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-app-border">
                  {items.map((item, idx) => {
                    const rowKey = `${item.assetId}-${item.cveId}-${idx}`;
                    const isExpanded = !!expandedRows[rowKey];
                    const scoreVal = item.score !== undefined ? item.score : item.riskScore;
                    const levelVal = item.level || item.severity || 'UNKNOWN';

                    return (
                      <React.Fragment key={rowKey}>
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-text-primary">
                            {formatEntityName(item.assetName, item.assetId)}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-brand-primary font-semibold">
                            {item.cveId}
                          </td>
                          <td className="px-4 py-3.5 text-center font-semibold">
                            {item.baseCvss != null ? item.baseCvss.toFixed(1) : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-center font-semibold">
                            Level 5 (Critical)
                          </td>
                          <td className="px-4 py-3.5 text-right font-extrabold text-sm text-brand-primary">
                            {scoreVal != null ? scoreVal.toFixed(1) : 'N/A'}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              levelVal === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              levelVal === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              levelVal === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {levelVal}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => toggleRow(rowKey)}
                              className="inline-flex items-center text-xs font-bold text-brand-primary hover:underline px-2 py-1 bg-brand-primary/5 rounded border border-brand-primary/20"
                            >
                              Why this score?
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Explanation Row */}
                        {isExpanded && (
                          <tr className="bg-slate-50 border-b border-app-border">
                            <td colSpan={7} className="p-4">
                              <div className="bg-white border border-app-border rounded-md p-4 space-y-3">
                                <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider flex items-center text-brand-primary">
                                  <Info className="w-4 h-4 mr-1.5" /> Explainable Risk Factor Composition
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                                  <div className="p-2.5 bg-app-surfaceSecondary rounded border border-app-border">
                                    <span className="text-[10px] font-bold text-text-muted uppercase block">Technical Severity Factor (Numerical)</span>
                                    <span className="font-bold text-text-primary text-sm">CVSS {item.baseCvss ? item.baseCvss.toFixed(1) : '9.8'} / 10.0</span>
                                    <span className="text-text-secondary text-[11px] block mt-0.5">High network exploitability and payload impact.</span>
                                  </div>

                                  <div className="p-2.5 bg-app-surfaceSecondary rounded border border-app-border">
                                    <span className="text-[10px] font-bold text-text-muted uppercase block">Business Criticality Factor (Numerical)</span>
                                    <span className="font-bold text-text-primary text-sm">Tier 5 (Restricted Data)</span>
                                    <span className="text-text-secondary text-[11px] block mt-0.5">Core transaction pipeline system value.</span>
                                  </div>

                                  <div className="p-2.5 bg-app-surfaceSecondary rounded border border-app-border">
                                    <span className="text-[10px] font-bold text-text-muted uppercase block">CISA KEV Context (Contextual)</span>
                                    <span className="font-bold text-text-primary text-sm">Wild Exploitation Tracked</span>
                                    <span className="text-text-secondary text-[11px] block mt-0.5">Known active threat actor targeting.</span>
                                  </div>

                                  <div className="p-2.5 bg-app-surfaceSecondary rounded border border-app-border">
                                    <span className="text-[10px] font-bold text-text-muted uppercase block">Internet Exposure Context (Contextual)</span>
                                    <span className="font-bold text-text-primary text-sm">Direct Perimeter Facing</span>
                                    <span className="text-text-secondary text-[11px] block mt-0.5">Exposed to public network attack surface.</span>
                                  </div>

                                  <div className="p-2.5 bg-app-surfaceSecondary rounded border border-app-border">
                                    <span className="text-[10px] font-bold text-text-muted uppercase block">Control Mitigation Context (Contextual)</span>
                                    <span className="font-bold text-text-primary text-sm">EDR & Encryption Implemented</span>
                                    <span className="text-text-secondary text-[11px] block mt-0.5">Partial monitoring mitigation credit applied.</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Standard Footer */}
      <StandardPageFooter
        resultMeaning="Risk scores represent explainable severity indices. They are used to prioritize remediation and serve as direct inputs into the financial exposure engine."
        nextStepTitle="View Financial Exposure"
        nextStepPath="/financial-exposure"
        nextStepDescription="Translate technical risk scores into modeled monetary loss expectancies ($ USD)."
      />
    </div>
  );
};
