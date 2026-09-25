import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, GitMerge, Globe, Server, Database, Info } from 'lucide-react';
import { attackPathsApi } from '../api/attack-paths';
import { AttackGraphAnalysisResultDTO } from '../types/attack-paths';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';
import { formatEntityName } from '../utils/formatting';

export const AttackPath: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<AttackGraphAnalysisResultDTO | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await attackPathsApi.getAttackGraph();
        setGraphData(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to generate attack graphs.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      <p className="text-sm font-medium text-text-secondary">Generating hypothetical attack paths and graph choke points...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 1. Standard Header */}
      <StandardPageHeader
        title="Hypothetical Attack Path Analysis"
        purpose="Visualize hypothetical routes between connected enterprise systems."
        steps={[
          'Review the legend to distinguish Internet-exposed entry points, Internal systems, and Critical Targets',
          'Inspect identified structural choke points where security interventions intercept multiple attack routes',
          'Evaluate prioritized attack paths to focus network micro-segmentation efforts'
        ]}
        dataOriginBadge="HYPOTHETICAL"
      />

      {/* Mandatory Disclaimer Box */}
      <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-lg text-xs text-indigo-950 flex items-start space-x-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-indigo-900 block mb-0.5">Modeled Graph Topology Note:</span>
          <span>This graph depicts <strong>MODELED / HYPOTHETICAL PATHS</strong> based on network connectivity and software correlation. It does <strong>NOT</strong> represent observed live attacker movement.</span>
        </div>
      </div>

      {/* Legend Card */}
      <div className="bg-app-surface border border-app-border rounded-lg p-4 shadow-2xs">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2.5">Graph Topology Legend:</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center space-x-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-900">
            <Globe className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="font-bold">Internet-Exposed</span>
          </div>

          <div className="flex items-center space-x-2 p-2 bg-slate-100 border border-slate-300 rounded text-slate-800">
            <Server className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <span className="font-bold">Internal Network</span>
          </div>

          <div className="flex items-center space-x-2 p-2 bg-purple-50 border border-purple-200 rounded text-purple-900">
            <Database className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span className="font-bold">Critical Asset (Target)</span>
          </div>

          <div className="flex items-center space-x-2 p-2 bg-indigo-50 border border-indigo-200 rounded text-indigo-900">
            <GitMerge className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="font-bold">Potential Path</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-2xs">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Graph Engine Unavailable</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      ) : !graphData ? (
        <div className="bg-app-surface border border-app-border p-12 rounded-lg text-center shadow-2xs">
          <GitMerge className="w-10 h-10 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-base font-bold text-text-primary mb-2">No attack graph data available.</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Why it is empty: Network topology and asset connections have not been evaluated.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* High Level Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs text-center">
              <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Discovered Paths</span>
              <span className="text-3xl font-extrabold text-text-primary">{graphData.totalPathsFound}</span>
            </div>

            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs text-center">
              <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Max Path Severity</span>
              <span className="text-3xl font-extrabold text-red-600">{graphData.maxPathRisk.toFixed(1)}</span>
            </div>

            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs text-center">
              <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Perimeter Entry Points</span>
              <span className="text-3xl font-extrabold text-amber-600">{graphData.entryPointsCount}</span>
            </div>

            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs text-center">
              <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Critical Targets</span>
              <span className="text-3xl font-extrabold text-purple-700">{graphData.criticalTargetsCount}</span>
            </div>
          </div>

          {/* Choke Points & Discovered Paths */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Choke Points */}
            <div className="bg-app-surface border border-app-border rounded-lg shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-app-border bg-app-surfaceSecondary">
                <h3 className="text-sm font-bold text-text-primary">Structural Choke Points</h3>
              </div>
              <div className="p-0">
                <table className="min-w-full divide-y divide-app-border text-xs">
                  <thead className="bg-app-surface">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-text-muted uppercase">Asset Name</th>
                      <th className="px-4 py-3 text-center font-medium text-text-muted uppercase">Intercepted Paths</th>
                      <th className="px-4 py-3 text-right font-medium text-text-muted uppercase">Choke Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-app-border">
                    {graphData.chokePoints.map(cp => (
                      <tr key={cp.assetId} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-bold text-text-primary">
                          {formatEntityName(cp.assetName, cp.assetId)}
                          <span className="text-[10px] text-text-muted font-normal block">{cp.remediationRecommendation}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-text-secondary">{cp.interceptedPathsCount}</td>
                        <td className="px-4 py-3 text-right font-extrabold text-brand-primary">{cp.chokePointScore.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prioritized Attack Paths */}
            <div className="bg-app-surface border border-app-border rounded-lg shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-app-border bg-app-surfaceSecondary">
                <h3 className="text-sm font-bold text-text-primary">Prioritized Hypothetical Attack Paths</h3>
              </div>
              <div className="p-0">
                <table className="min-w-full divide-y divide-app-border text-xs">
                  <thead className="bg-app-surface">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-text-muted uppercase">Entry → Target</th>
                      <th className="px-4 py-3 text-center font-medium text-text-muted uppercase">Hops</th>
                      <th className="px-4 py-3 text-right font-medium text-text-muted uppercase">Priority Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-app-border">
                    {graphData.discoveredPaths.slice(0, 5).map(p => (
                      <tr key={p.pathId} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-bold text-text-primary">
                          <div className="flex items-center space-x-1">
                            <span className="text-amber-700">{formatEntityName(p.entryAssetId)}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-purple-700">{formatEntityName(p.targetAssetId)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-text-secondary">{p.hopCount}</td>
                        <td className="px-4 py-3 text-right font-extrabold text-red-600">{p.cumulativeRiskScore.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 3. Standard Footer */}
      <StandardPageFooter
        resultMeaning="Attack path analysis maps potential multi-hop exploitation routes. Implementing controls at structural choke points neutralizes multiple attack paths simultaneously."
        nextStepTitle="Ask CyberRiskOS Explanation Assistant"
        nextStepPath="/ai-assistant"
        nextStepDescription="Generate structured plain-language explanations for risk scores, financial metrics, and attack routes."
      />
    </div>
  );
};
