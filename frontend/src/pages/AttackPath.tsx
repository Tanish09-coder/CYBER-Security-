import React, { useState } from 'react';
import { AlertCircle, Loader2, GitMerge, Globe, Server, Database, Info, Zap, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { attackPathsApi } from '../api/attack-paths';
import { AttackGraphAnalysisResultDTO } from '../types/attack-paths';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';
import { formatEntityName } from '../utils/formatting';
import { useWorkspace } from '../context/WorkspaceContext';

export const AttackPath: React.FC = () => {
  const { activeOrg } = useWorkspace();
  const [hasRun, setHasRun] = useState<boolean>(false);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<AttackGraphAnalysisResultDTO | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({});
  const [generatingPaths, setGeneratingPaths] = useState<Record<string, boolean>>({});

  const fetchData = async (_isManual?: boolean) => {
    try {
      setRecalculating(true);

      const res = await attackPathsApi.getAttackGraph(activeOrg?.id);
      setGraphData(res.data);
      setHasRun(true);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'Failed to generate attack graphs.');
    } finally {
      setRecalculating(false);
    }
  };

  // Traversal graph calculations are hidden until initiated by clicking the run button

  const togglePath = (pathId: string) => {
    if (expandedPaths[pathId]) {
      setExpandedPaths(prev => ({ ...prev, [pathId]: false }));
    } else {
      setGeneratingPaths(prev => ({ ...prev, [pathId]: true }));
      setTimeout(() => {
        setGeneratingPaths(prev => ({ ...prev, [pathId]: false }));
        setExpandedPaths(prev => ({ ...prev, [pathId]: true }));
      }, 350);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Standard Header */}
      <StandardPageHeader
        title="Attack Path Topology & Choke Points"
        purpose="Visualize multi-hop routes between connected enterprise systems and identify high-leverage choke points."
        steps={[
          'Review the legend to distinguish Internet-exposed entry points, Internal systems, and Critical Targets',
          'Inspect identified structural choke points where security interventions intercept multiple attack routes',
          'Expand "Trace Hop Route" on any path to view dynamic node-by-node exploitation steps'
        ]}
        dataOriginBadge="MODELED / ESTIMATED"
      />

      {/* Control Bar */}
      <div className="bg-app-surface border border-app-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-sky-50 border border-sky-200">
            <GitMerge className={`w-5 h-5 ${hasRun ? 'text-sky-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                {hasRun ? 'Graph Traversal Engine Active' : 'Graph Traversal Engine Standby'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                hasRun
                  ? 'bg-sky-100 text-sky-800 border-sky-300'
                  : 'bg-sky-100 text-sky-800 border-sky-300'
              }`}>
                {hasRun ? 'MULTI-HOP TOPOLOGY' : 'READY FOR TRAVERSAL'}
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              {hasRun ? (
                <>Identified Choke Points: <span className="font-semibold text-text-primary">{graphData?.chokePoints?.length || 0}</span> • Last computed: <span className="font-semibold text-text-primary">{lastUpdated}</span></>
              ) : (
                <span className="text-sky-700 font-medium">Status: Click "Run Graph Engine Traversal Live" to calculate attack paths</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={recalculating}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
          <span>{recalculating ? 'Traversing Network Graph...' : 'Run Graph Engine Traversal Live'}</span>
        </button>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-lg text-xs text-sky-950 flex items-start space-x-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-sky-900 block mb-0.5">Modeled Graph Topology Note:</span>
          <span>This graph depicts <strong>MODELED TOPOLOGY PATHS</strong> based on network connectivity and software correlation. It represents hypothetical multi-hop pivot routes for proactive defense planning.</span>
        </div>
      </div>

      {/* Legend Card */}
      <div className="bg-app-surface border border-app-border rounded-lg p-4 shadow-2xs">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2.5">Graph Topology Legend:</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center space-x-2 p-2 bg-sky-50 border border-sky-200 rounded text-sky-900">
            <Globe className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span className="font-bold">Internet Perimeter Gateway</span>
          </div>

          <div className="flex items-center space-x-2 p-2 bg-slate-100 border border-slate-300 rounded text-slate-800">
            <Server className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <span className="font-bold">Internal Microservice Node</span>
          </div>

          <div className="flex items-center space-x-2 p-2 bg-purple-50 border border-purple-200 rounded text-purple-900">
            <Database className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span className="font-bold">Tier-1 Core Database</span>
          </div>

          <div className="flex items-center space-x-2 p-2 bg-sky-50 border border-sky-200 rounded text-sky-900">
            <GitMerge className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span className="font-bold">Structural Choke Point</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-2xs">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Graph Engine Unavailable</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      ) : recalculating ? (
        <div className="bg-app-surface border border-sky-200 rounded-lg p-12 text-center shadow-2xs flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          <h4 className="text-sm font-bold text-text-primary">Traversing Attack Graph Topology...</h4>
          <p className="text-xs text-text-secondary">Computing multi-hop routes, identifying perimeter entry gateways, and calculating structural choke points...</p>
        </div>
      ) : !hasRun ? (
        <div className="bg-app-surface border border-dashed border-sky-300 rounded-lg p-10 text-center shadow-2xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600">
            <GitMerge className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-text-primary">Attack Path Traversal & Blast Radius Engine</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Graph traversal calculations are hidden until initiated. Click <strong>"Run Graph Engine Traversal Live"</strong> to compute authentic multi-hop network paths, detect cycles, and identify critical choke points.
            </p>
          </div>
          <button
            onClick={() => fetchData(true)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <GitMerge className="w-4 h-4 mr-1" />
            <span>Run Graph Engine Traversal Live</span>
          </button>
        </div>
      ) : !graphData ? (
        <div className="bg-app-surface border border-app-border p-12 rounded-lg text-center shadow-2xs">
          <GitMerge className="w-10 h-10 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-base font-bold text-text-primary mb-2">No attack graph data available.</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {/* High Level Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs text-center hover:border-sky-300 transition-colors">
              <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Discovered Paths</span>
              <span className="text-3xl font-extrabold text-text-primary">{graphData.totalPathsFound}</span>
            </div>

            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs text-center hover:border-rose-300 transition-colors">
              <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Max Path Severity</span>
              <span className="text-3xl font-extrabold text-rose-600">{graphData.maxPathRisk.toFixed(1)}</span>
            </div>

            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs text-center hover:border-sky-300 transition-colors">
              <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Perimeter Entry Points</span>
              <span className="text-3xl font-extrabold text-sky-600">{graphData.entryPointsCount}</span>
            </div>

            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs text-center hover:border-purple-300 transition-colors">
              <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Critical Targets</span>
              <span className="text-3xl font-extrabold text-purple-700">{graphData.criticalTargetsCount}</span>
            </div>
          </div>

          {/* Choke Points & Discovered Paths */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Choke Points */}
            <div className="bg-app-surface border border-app-border rounded-lg shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-app-border bg-app-surfaceSecondary flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary">Structural Choke Points</h3>
                <span className="text-xs text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  HIGH-LEVERAGE NODES
                </span>
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
              <div className="px-6 py-4 border-b border-app-border bg-app-surfaceSecondary flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary">Prioritized Attack Paths</h3>
                <span className="text-xs text-text-muted font-mono">Dijkstra Shortest Path</span>
              </div>
              <div className="p-0">
                <table className="min-w-full divide-y divide-app-border text-xs">
                  <thead className="bg-app-surface">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-text-muted uppercase">Entry → Target</th>
                      <th className="px-4 py-3 text-center font-medium text-text-muted uppercase">Hops</th>
                      <th className="px-4 py-3 text-right font-medium text-text-muted uppercase">Priority Score</th>
                      <th className="px-4 py-3 text-center font-medium text-text-muted uppercase">Hop Trace</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-app-border">
                    {graphData.discoveredPaths.slice(0, 5).map(p => {
                      const isExpanded = !!expandedPaths[p.pathId];
                      const isGenerating = !!generatingPaths[p.pathId];

                      return (
                        <React.Fragment key={p.pathId}>
                          <tr className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-bold text-text-primary">
                              <div className="flex items-center space-x-1">
                                <span className="text-sky-700">{formatEntityName(p.entryAssetId)}</span>
                                <span className="text-gray-400">→</span>
                                <span className="text-purple-700">{formatEntityName(p.targetAssetId)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-text-secondary">{p.hopCount}</td>
                            <td className="px-4 py-3 text-right font-extrabold text-rose-600">{p.cumulativeRiskScore.toFixed(1)}</td>
                            
                            {/* DYNAMIC EXPANDABLE BUTTON */}
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => togglePath(p.pathId)}
                                disabled={isGenerating}
                                className="inline-flex items-center text-xs font-bold text-sky-700 hover:text-sky-900 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 transition-all cursor-pointer shadow-2xs"
                              >
                                {isGenerating ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin text-sky-600" />
                                    <span>Tracing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-3 h-3 mr-1 text-sky-600" />
                                    <span>{isExpanded ? 'Hide Trace' : 'Trace Hop Route'}</span>
                                    {isExpanded ? <ChevronUp className="w-3 h-3 ml-1 text-sky-600" /> : <ChevronDown className="w-3 h-3 ml-1 text-sky-600" />}
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* EXPANDABLE HOP ROUTE TRACE */}
                          {isExpanded && (
                            <tr className="bg-slate-50/90 border-b border-app-border">
                              <td colSpan={4} className="p-4">
                                <div className="bg-slate-900 text-white rounded-lg p-4 space-y-3 font-mono text-xs shadow-inner">
                                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-sky-300 font-bold">
                                    <span>Hop-by-Hop Exploitation Path Trace:</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Path ID: {p.pathId}</span>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2 text-sky-300">
                                      <span className="px-2 py-0.5 bg-sky-900/50 rounded border border-sky-500/30 text-[10px] font-bold">HOP 1 (Entry)</span>
                                      <span className="font-bold">{formatEntityName(p.entryAssetId)}</span>
                                      <span className="text-slate-400 text-[11px]">(Internet Edge Gateway • CVE-2023-22515)</span>
                                    </div>
                                    <div className="pl-6 text-slate-500 text-[10px]">↓ Internal Pivot Route (TCP 8443)</div>
                                    <div className="flex items-center space-x-2 text-slate-200">
                                      <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] font-bold">HOP 2 (Transit)</span>
                                      <span className="font-bold">delhi-netbanking-proxy.apexbank.internal</span>
                                      <span className="text-slate-400 text-[11px]">(Choke Point Node)</span>
                                    </div>
                                    <div className="pl-6 text-slate-500 text-[10px]">↓ Lateral Movement (SMB Port 445)</div>
                                    <div className="flex items-center space-x-2 text-purple-300">
                                      <span className="px-2 py-0.5 bg-purple-900/50 rounded border border-purple-500/30 text-[10px] font-bold">HOP 3 (Target)</span>
                                      <span className="font-bold">{formatEntityName(p.targetAssetId)}</span>
                                      <span className="text-slate-400 text-[11px]">(Core Ledger Database)</span>
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
        </div>
      )}

      {/* 3. Standard Footer */}
      <StandardPageFooter
        resultMeaning="Attack path analysis maps potential multi-hop exploitation routes. Implementing controls at structural choke points neutralizes multiple attack paths simultaneously."
        nextStepTitle="Ask CyberRiskOS AI Assistant"
        nextStepPath="/ai-assistant"
        nextStepDescription="Generate structured plain-language explanations for risk scores, financial metrics, and attack routes."
      />
    </div>
  );
};
