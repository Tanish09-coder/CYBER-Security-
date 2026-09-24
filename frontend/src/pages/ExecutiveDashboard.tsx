import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, BarChart2, ShieldAlert, Activity, PieChart, Info, DollarSign } from 'lucide-react';
import { executiveApi } from '../api/executive';
import { 
  ExecutivePostureDTO, 
  ExecutiveTopRiskDTO, 
  ExecutiveFinancialSummaryDTO 
} from '../types/executive';

export const ExecutiveDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [posture, setPosture] = useState<ExecutivePostureDTO | null>(null);
  const [topRisks, setTopRisks] = useState<ExecutiveTopRiskDTO[]>([]);
  const [financial, setFinancial] = useState<ExecutiveFinancialSummaryDTO | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postureRes, risksRes, financialRes] = await Promise.all([
          executiveApi.getPosture(),
          executiveApi.getTopRisks(5),
          executiveApi.getFinancialSummary()
        ]);
        
        setPosture(postureRes.data);
        setTopRisks(risksRes.data);
        setFinancial(financialRes.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load executive dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      <p className="text-sm font-medium text-text-secondary">Aggregating executive rollups...</p>
    </div>
  );

  if (error) return (
    <div className="p-6 h-full flex flex-col items-center justify-center min-h-[400px]">
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-lg text-center shadow-sm">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h3 className="text-sm font-bold text-red-900 mb-2">Dashboard Error</h3>
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

  if (!posture || !financial) return (
    <div className="p-6 h-full flex flex-col items-center justify-center min-h-[400px]">
      <div className="bg-app-surface border border-app-border p-6 rounded-lg max-w-lg text-center shadow-sm">
        <Info className="w-8 h-8 text-text-muted mx-auto mb-4" />
        <h3 className="text-sm font-bold text-text-primary mb-2">No Data Available</h3>
        <p className="text-xs text-text-secondary mb-4">No risk data was returned for the executive dashboard.</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-text-primary flex items-center">
          <BarChart2 className="w-6 h-6 mr-2 text-brand-primary" />
          Executive Decision Dashboard
        </h2>
        {posture.dataFreshnessTimestamp && (
          <span className="text-xs text-text-muted">
            Last Updated: {new Date(posture.dataFreshnessTimestamp).toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Posture Score */}
        <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-sm flex flex-col justify-center items-center">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2 text-center">Enterprise Risk Score</h3>
          <p className="text-5xl font-bold text-text-primary mb-2">
            {posture.overallRiskScore.toFixed(1)}
          </p>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            posture.riskSeverity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
            posture.riskSeverity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
            posture.riskSeverity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {posture.riskSeverity}
          </span>
        </div>

        {/* Financial Summary */}
        <div className="md:col-span-2 bg-app-surface border border-app-border p-6 rounded-lg shadow-sm flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center">
             <DollarSign className="w-4 h-4 mr-1 text-purple-600"/>
             Modeled Financial Exposure
          </h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-4xl font-bold text-purple-700">
                {financial.currency} {(financial.totalModeledEal || 0).toLocaleString()}
              </p>
              {financial.isPartialCoverage && (
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  * {financial.coverageNote || 'Partial coverage'}
                </p>
              )}
            </div>
            <div className="text-right space-y-2">
               <div>
                 <p className="text-xs text-text-muted uppercase">Primary Loss</p>
                 <p className="text-sm font-semibold text-text-primary">{financial.currency} {financial.totalPrimaryLoss.toLocaleString()}</p>
               </div>
               <div>
                 <p className="text-xs text-text-muted uppercase">Secondary Loss</p>
                 <p className="text-sm font-semibold text-text-primary">{financial.currency} {financial.totalSecondaryLoss.toLocaleString()}</p>
               </div>
            </div>
          </div>
        </div>

        {/* KEV & Ransomware */}
        <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-sm flex flex-col justify-center space-y-4">
           <div>
             <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center">
               <ShieldAlert className="w-4 h-4 mr-1 text-red-500" />
               CISA KEV Exposure
             </h3>
             <p className="text-2xl font-bold text-red-600">{posture.kevExposureCount}</p>
           </div>
           <div>
             <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center">
               <Activity className="w-4 h-4 mr-1 text-orange-500" />
               Ransomware Associated
             </h3>
             <p className="text-2xl font-bold text-orange-600">{posture.ransomwareAssociatedCount}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
         {/* Top Risks */}
         <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
           <div className="px-6 py-4 border-b border-app-border bg-surface-secondary">
             <h3 className="text-sm font-semibold text-text-primary">Top Critical Risks</h3>
           </div>
           <div className="p-0 overflow-x-auto">
             <table className="min-w-full divide-y divide-app-border">
               <thead className="bg-app-surface">
                 <tr>
                   <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Asset</th>
                   <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">CVE ID</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">Risk Score</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">EAL</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-app-border">
                 {topRisks.map(risk => (
                   <tr key={`${risk.assetId}-${risk.cveId}`} className="hover:bg-gray-50 transition-colors">
                     <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">{risk.assetName}</td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                       {risk.cveId}
                       {risk.isKnownExploited && <span className="ml-2 text-xs text-red-600 font-bold">KEV</span>}
                     </td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-brand-primary font-bold text-right">{risk.riskScore.toFixed(1)}</td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-700 font-medium text-right">
                       {risk.eal ? `${risk.currency} ${risk.eal.toLocaleString()}` : 'N/A'}
                     </td>
                   </tr>
                 ))}
                 {topRisks.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-4 py-6 text-center text-sm text-text-muted">No top risks identified.</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
         </div>

         {/* Business Unit Rollup */}
         <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
           <div className="px-6 py-4 border-b border-app-border bg-surface-secondary flex items-center">
             <PieChart className="w-4 h-4 mr-2 text-text-secondary"/>
             <h3 className="text-sm font-semibold text-text-primary">Business Unit Risk Distribution</h3>
           </div>
           <div className="p-0 overflow-x-auto">
             <table className="min-w-full divide-y divide-app-border">
               <thead className="bg-app-surface">
                 <tr>
                   <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Business Unit</th>
                   <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">Avg Risk Score</th>
                   <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">Total Assets</th>
                   <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">Critical Flaws</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-app-border">
                 {posture.businessUnitRollups.map(bu => (
                   <tr key={bu.businessUnitId} className="hover:bg-gray-50 transition-colors">
                     <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">{bu.businessUnitName || bu.businessUnitId}</td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-brand-primary font-bold text-center">{bu.avgRiskScore.toFixed(1)}</td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary text-center">{bu.totalAssets}</td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-medium text-right">{bu.criticalFlawsCount}</td>
                   </tr>
                 ))}
                 {posture.businessUnitRollups.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-4 py-6 text-center text-sm text-text-muted">No business unit data available.</td>
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
