import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, GitMerge, ShieldAlert, Activity } from 'lucide-react';
import { attackPathsApi } from '../api/attack-paths';
import { AttackGraphAnalysisResultDTO } from '../types/attack-paths';

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
      <p className="text-sm font-medium text-text-secondary">Generating attack graphs and calculating blast radius...</p>
    </div>
  );

  if (error) return (
    <div className="p-6 h-full flex flex-col items-center justify-center min-h-[400px]">
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-lg text-center shadow-sm">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h3 className="text-sm font-bold text-red-900 mb-2">Graph Engine Unavailable</h3>
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

  if (!graphData) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-text-primary flex items-center">
          <GitMerge className="w-6 h-6 mr-2 text-brand-primary" />
          Attack Path & Blast Radius Analysis
        </h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded border border-blue-200 uppercase tracking-widest">
          Model v{graphData.modelVersion}
        </span>
      </div>
      <p className="text-xs text-text-secondary mb-6">
        Visualize structural choke points and exploit paths across the enterprise network topology.
      </p>

      {/* High-level metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm text-center flex flex-col items-center justify-center">
            <h3 className="text-xs font-semibold text-text-muted uppercase mb-2">Total Paths</h3>
            <p className="text-4xl font-bold text-text-primary">{graphData.totalPathsFound}</p>
         </div>
         <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm text-center flex flex-col items-center justify-center">
            <h3 className="text-xs font-semibold text-text-muted uppercase mb-2">Max Path Risk</h3>
            <p className="text-4xl font-bold text-red-600">{graphData.maxPathRisk.toFixed(1)}</p>
         </div>
         <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm text-center flex flex-col items-center justify-center">
            <h3 className="text-xs font-semibold text-text-muted uppercase mb-2">Entry Points</h3>
            <p className="text-4xl font-bold text-orange-600">{graphData.entryPointsCount}</p>
         </div>
         <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm text-center flex flex-col items-center justify-center">
            <h3 className="text-xs font-semibold text-text-muted uppercase mb-2">Critical Targets</h3>
            <p className="text-4xl font-bold text-purple-600">{graphData.criticalTargetsCount}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
         {/* Choke Points */}
         <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
           <div className="px-6 py-4 border-b border-app-border bg-surface-secondary flex items-center">
             <ShieldAlert className="w-4 h-4 mr-2 text-text-secondary" />
             <h3 className="text-sm font-semibold text-text-primary">Structural Choke Points</h3>
           </div>
           <div className="p-0 overflow-x-auto">
             <table className="min-w-full divide-y divide-app-border">
               <thead className="bg-app-surface">
                 <tr>
                   <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Asset</th>
                   <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">Intercepted Paths</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">Choke Score</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-app-border">
                 {graphData.chokePoints.map(cp => (
                   <tr key={cp.assetId} className="hover:bg-gray-50 transition-colors">
                     <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">
                       <div>{cp.assetName}</div>
                       <div className="text-xs text-text-muted font-normal mt-0.5">{cp.remediationRecommendation}</div>
                     </td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-center">
                       {cp.interceptedPathsCount}
                     </td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-brand-primary font-bold text-right">
                       {cp.chokePointScore.toFixed(1)}
                     </td>
                   </tr>
                 ))}
                 {graphData.chokePoints.length === 0 && (
                   <tr>
                     <td colSpan={3} className="px-4 py-6 text-center text-sm text-text-muted">No choke points identified.</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
         </div>

         {/* Critical Paths */}
         <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
           <div className="px-6 py-4 border-b border-app-border bg-surface-secondary flex items-center">
             <Activity className="w-4 h-4 mr-2 text-text-secondary" />
             <h3 className="text-sm font-semibold text-text-primary">Highest Risk Attack Paths</h3>
           </div>
           <div className="p-0 overflow-x-auto">
             <table className="min-w-full divide-y divide-app-border">
               <thead className="bg-app-surface">
                 <tr>
                   <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Entry → Target</th>
                   <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">Hops</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">Cumulative Risk</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-app-border">
                 {graphData.discoveredPaths.slice(0, 10).map(path => (
                   <tr key={path.pathId} className="hover:bg-gray-50 transition-colors">
                     <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">
                       <div className="flex items-center">
                         <span className="text-orange-600 truncate max-w-[100px]">{path.entryAssetId}</span>
                         <span className="mx-2 text-gray-400">→</span>
                         <span className="text-purple-700 truncate max-w-[100px]">{path.targetAssetId}</span>
                       </div>
                       {path.criticalCves.length > 0 && (
                         <div className="text-xs text-text-muted font-normal mt-1 flex flex-wrap gap-1">
                           {path.criticalCves.map(cve => (
                             <span key={cve} className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-[10px]">
                               {cve}
                             </span>
                           ))}
                         </div>
                       )}
                     </td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-center">
                       {path.hopCount}
                     </td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-bold text-right">
                       {path.cumulativeRiskScore.toFixed(1)}
                     </td>
                   </tr>
                 ))}
                 {graphData.discoveredPaths.length === 0 && (
                   <tr>
                     <td colSpan={3} className="px-4 py-6 text-center text-sm text-text-muted">No attack paths found.</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
         </div>
      </div>
    </div>
  );
};
