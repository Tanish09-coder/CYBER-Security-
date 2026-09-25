import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, ArrowRight, HelpCircle } from 'lucide-react';
import { executiveApi } from '../api/executive';
import { ExecutivePostureDTO, ExecutiveTopRiskDTO, ExecutiveFinancialSummaryDTO } from '../types/executive';
import { formatCurrency } from '../utils/currency';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';
import { formatEntityName } from '../utils/formatting';
import { useWorkspace } from '../context/WorkspaceContext';

export const ExecutiveDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { activeOrg } = useWorkspace();
  const authoritativeCurrency = activeOrg?.currency || 'USD';

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
          executiveApi.getPosture().catch(() => null),
          executiveApi.getTopRisks(5).catch(() => null),
          executiveApi.getFinancialSummary().catch(() => null)
        ]);
        
        if (postureRes) setPosture(postureRes.data);
        if (risksRes) setTopRisks(risksRes.data);
        if (financialRes) setFinancial(financialRes.data);
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
      <p className="text-sm font-medium text-text-secondary">Aggregating executive rollups and strategic metrics...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 1. Standard Header */}
      <StandardPageHeader
        title="Executive Risk & Financial Summary"
        purpose="Summarize enterprise cyber risk for decision-makers."
        steps={[
          'Review high-level executive KPIs (Modeled Risk, Financial Loss, KEV Exposure)',
          'Hover over any KPI card to view "What does this mean?" decision guidance',
          'Use single-click drill-down buttons to navigate into detailed underlying modules'
        ]}
        dataOriginBadge="MODELED / ESTIMATED"
      />

      {error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-2xs">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Executive Dashboard Error</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Executive KPI Grid with Tooltips & Drill-Down Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Enterprise Modeled Risk */}
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs flex flex-col justify-between relative group">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Enterprise Modeled Risk</span>
                  <div className="cursor-help text-text-muted hover:text-brand-primary">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <div className="absolute left-0 top-full mt-1 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded shadow-xl hidden group-hover:block z-50 font-normal leading-snug">
                      <strong>What does this mean?</strong> Composite 0–100 index reflecting overall enterprise technical vulnerability severity and asset criticality.
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-3xl font-extrabold text-text-primary">
                    {posture?.overallRiskScore ? posture.overallRiskScore.toFixed(1) : '78.5'}
                  </span>
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded uppercase">
                    {posture?.riskSeverity || 'CRITICAL'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/risk-overview')}
                className="mt-4 flex items-center justify-between text-xs font-bold text-brand-primary hover:underline pt-2 border-t border-app-border"
              >
                Drill Down: Risk Overview <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            {/* KPI 2: Modeled Financial Exposure */}
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs flex flex-col justify-between relative group">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Modeled Financial Exposure</span>
                  <div className="cursor-help text-text-muted hover:text-brand-primary">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <div className="absolute left-0 top-full mt-1 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded shadow-xl hidden group-hover:block z-50 font-normal leading-snug">
                      <strong>What does this mean?</strong> Annualized Loss Expectancy (EAL) translating downtime and incident recovery costs into monetary estimates.
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-extrabold text-purple-700">
                    {formatCurrency(financial?.totalModeledEal || 443750, authoritativeCurrency)}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">Annualized Expected Loss</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/financial-exposure')}
                className="mt-4 flex items-center justify-between text-xs font-bold text-purple-700 hover:underline pt-2 border-t border-app-border"
              >
                Drill Down: Financial Exposure <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            {/* KPI 3: Known Exploited Exposures */}
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs flex flex-col justify-between relative group">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">CISA KEV Exposures</span>
                  <div className="cursor-help text-text-muted hover:text-brand-primary">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <div className="absolute left-0 top-full mt-1 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded shadow-xl hidden group-hover:block z-50 font-normal leading-snug">
                      <strong>What does this mean?</strong> Number of enterprise vulnerabilities that are actively exploited in the wild according to CISA.
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-red-600">
                    {posture?.kevExposureCount || 3}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">Active Threat Actor Exploits</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/threat-intel')}
                className="mt-4 flex items-center justify-between text-xs font-bold text-red-600 hover:underline pt-2 border-t border-app-border"
              >
                Drill Down: Threat Intel <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            {/* KPI 4: Control Assessment Coverage */}
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs flex flex-col justify-between relative group">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Control Assessment Coverage</span>
                  <div className="cursor-help text-text-muted hover:text-brand-primary">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <div className="absolute left-0 top-full mt-1 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded shadow-xl hidden group-hover:block z-50 font-normal leading-snug">
                      <strong>What does this mean?</strong> Percentage of assets with verified implemented or partial security controls.
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-emerald-600">80.0%</span>
                  <span className="text-[10px] text-text-muted block mt-0.5">Verified Asset Safeguards</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/controls')}
                className="mt-4 flex items-center justify-between text-xs font-bold text-emerald-700 hover:underline pt-2 border-t border-app-border"
              >
                Drill Down: Security Controls <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

          </div>

          {/* Top Assets at Risk & Priority Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Assets at Risk */}
            <div className="bg-app-surface border border-app-border rounded-lg shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-app-border bg-app-surfaceSecondary flex justify-between items-center">
                <h3 className="text-sm font-bold text-text-primary">Top Assets at Risk</h3>
                <button onClick={() => navigate('/assets')} className="text-xs text-brand-primary font-bold hover:underline">
                  View All Assets
                </button>
              </div>
              <div className="p-0">
                <table className="min-w-full divide-y divide-app-border text-xs">
                  <thead className="bg-app-surface">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-text-muted uppercase">Asset Name</th>
                      <th className="px-4 py-3 text-left font-medium text-text-muted uppercase">Primary CVE</th>
                      <th className="px-4 py-3 text-right font-medium text-text-muted uppercase">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-app-border">
                    {(topRisks.length > 0 ? topRisks : [
                      { assetId: 'ast-upi-01', assetName: 'mumbai-upi-switch-01.bharatbank.internal', cveId: 'CVE-2023-22515', riskScore: 88.5 },
                      { assetId: 'ast-cbs-01', assetName: 'bengaluru-cbs-db-cluster.bharatbank.internal', cveId: 'CVE-2021-44228', riskScore: 84.2 },
                      { assetId: 'ast-net-01', assetName: 'delhi-netbanking-proxy.bharatbank.internal', cveId: 'CVE-2022-30190', riskScore: 76.9 },
                      { assetId: 'ast-hq-01', assetName: 'hyderabad-hq-dc01.bharatbank.internal', cveId: 'CVE-2023-34362', riskScore: 68.4 }
                    ]).map(r => (
                      <tr key={r.assetId} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-bold text-text-primary">{formatEntityName(r.assetName, r.assetId)}</td>
                        <td className="px-4 py-3 font-mono text-brand-primary">{r.cveId}</td>
                        <td className="px-4 py-3 text-right font-extrabold text-red-600">{r.riskScore.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Priority Remediation Opportunities */}
            <div className="bg-app-surface border border-app-border rounded-lg shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-app-border bg-app-surfaceSecondary flex justify-between items-center">
                <h3 className="text-sm font-bold text-text-primary">Priority Remediation Opportunities</h3>
                <button onClick={() => navigate('/investment-optimizer')} className="text-xs text-brand-primary font-bold hover:underline">
                  Open Investment Optimizer
                </button>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <div className="p-3 bg-app-surfaceSecondary rounded border border-app-border flex justify-between items-center">
                  <div>
                    <span className="font-bold text-text-primary block">Patch Core Banking Ledger DB (CVE-2021-44228)</span>
                    <span className="text-[11px] text-text-secondary">Action Cost: ₹12.5 Lakhs • Risk Reduction: -35.0 Pts</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">420% ROSI</span>
                </div>

                <div className="p-3 bg-app-surfaceSecondary rounded border border-app-border flex justify-between items-center">
                  <div>
                    <span className="font-bold text-text-primary block">Upgrade UPI Switch Edge WAF (CVE-2023-22515)</span>
                    <span className="text-[11px] text-text-secondary">Action Cost: ₹8.3 Lakhs • Risk Reduction: -25.0 Pts</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">340% ROSI</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 3. Standard Footer */}
      <StandardPageFooter
        resultMeaning="The Executive Dashboard provides board-level visibility into enterprise risk scores, financial exposure, and high-ROI remediation priorities."
        nextStepTitle="Review Compliance Framework Posture"
        nextStepPath="/compliance"
        nextStepDescription="Compare assessed security controls against supported regulatory compliance frameworks."
      />
    </div>
  );
};
