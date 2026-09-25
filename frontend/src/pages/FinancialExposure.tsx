import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Info, Calculator, HelpCircle } from 'lucide-react';
import { FinancialExposureResponse } from '../types/risk';
import { riskApi } from '../api/risk';
import { formatCurrency } from '../utils/currency';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';
import { formatEntityName } from '../utils/formatting';
import { useWorkspace } from '../context/WorkspaceContext';

export const FinancialExposure: React.FC = () => {
  const { activeOrg } = useWorkspace();
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-sm font-medium text-text-secondary">Quantifying modeled financial exposure metrics...</p>
      </div>
    );
  }

  const items = data?.items || [];
  const authoritativeCurrency = activeOrg?.currency || 'USD';

  const modeledEalTotal = items.reduce((sum, item) => sum + (item.eal || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Standard Header */}
      <StandardPageHeader
        title="Financial Exposure Analysis"
        purpose="Translate cyber scenarios into modeled financial exposure."
        steps={[
          'Review synthetic financial parameters and explicit downtime cost assumptions',
          'Inspect Single Loss Expectancy (SLE) and Annualized Loss Expectancy (EAL) per asset',
          'Validate loss component breakdown across primary downtime loss and secondary recovery costs'
        ]}
        dataOriginBadge="MODELED / ESTIMATED"
      />

      {/* Demo Assumptions Disclaimer */}
      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-xs text-purple-950 space-y-2 shadow-2xs">
        <div className="flex items-center space-x-2 font-bold text-purple-900 text-sm">
          <Info className="w-4 h-4 text-purple-600" />
          <span>Explicit Synthetic Demo Assumptions</span>
          <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ml-2">
            DEMO ASSUMPTIONS
          </span>
        </div>
        <p className="text-purple-900/90 leading-relaxed">
          These financial exposure numbers are <strong>estimates based on explicit demo assumptions</strong>. They serve as a decision framework and must not be treated as guaranteed loss guarantees.
        </p>
      </div>

      {/* Assumptions Grid */}
      <div className="bg-app-surface border border-app-border rounded-lg p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center">
          <Calculator className="w-4 h-4 mr-1.5 text-brand-primary" /> Baseline Enterprise Financial Assumptions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-app-surfaceSecondary rounded border border-app-border">
            <span className="text-[10px] font-bold text-text-muted uppercase block">Hourly Downtime Cost</span>
            <span className="text-lg font-bold text-text-primary">$150,000 / hr</span>
            <span className="text-text-secondary text-[11px] block mt-0.5">Based on Apex Financial revenue rate</span>
          </div>

          <div className="p-3 bg-app-surfaceSecondary rounded border border-app-border">
            <span className="text-[10px] font-bold text-text-muted uppercase block">Estimated Outage Duration</span>
            <span className="text-lg font-bold text-text-primary">8.5 Hours</span>
            <span className="text-text-secondary text-[11px] block mt-0.5">VERIS historical mean recovery window</span>
          </div>

          <div className="p-3 bg-app-surfaceSecondary rounded border border-app-border">
            <span className="text-[10px] font-bold text-text-muted uppercase block">Recovery & Forensic Cost</span>
            <span className="text-lg font-bold text-text-primary">$500,000</span>
            <span className="text-text-secondary text-[11px] block mt-0.5">Incident response & remediation retainer</span>
          </div>

          <div className="p-3 bg-app-surfaceSecondary rounded border border-app-border relative group">
            <span className="text-[10px] font-bold text-text-muted uppercase flex items-center">
              ALEF <HelpCircle className="w-3 h-3 ml-1 text-brand-primary inline" />
            </span>
            <span className="text-lg font-bold text-purple-700">0.05 / year</span>
            <span className="text-text-secondary text-[11px] block mt-0.5">Annual Event Frequency (1 event / 20 yrs)</span>

            {/* Tooltip */}
            <div className="absolute left-0 bottom-full mb-2 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded shadow-lg hidden group-hover:block z-50 leading-snug">
              <strong>ALEF (Annual Event Frequency):</strong> Estimated annual probability of incident occurrence based on threat actor activity. <em>ALEF is NEVER derived directly from CVSS.</em>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Formula Card */}
      <div className="bg-slate-900 text-white p-5 rounded-lg border border-slate-800 shadow-2xs space-y-3">
        <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest flex items-center">
          <Calculator className="w-4 h-4 mr-1.5" /> Explainable Loss Calculation Formula
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-800/80 rounded border border-slate-700">
            <span className="text-slate-400 text-[10px] block">1. SINGLE INCIDENT LOSS (SLE)</span>
            <span className="text-white font-bold block mt-1">Downtime Cost + Recovery Cost = Single Incident Loss</span>
          </div>
          <div className="p-3 bg-slate-800/80 rounded border border-slate-700">
            <span className="text-slate-400 text-[10px] block">2. ANNUALIZED LOSS EXPECTANCY (EAL)</span>
            <span className="text-purple-300 font-bold block mt-1">Single Incident Loss × Annual Event Frequency = Estimated EAL</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-2xs">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Exposure Calculation Blocked</h3>
          <p className="text-xs text-red-700 mb-4">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-app-surface border border-app-border p-12 rounded-lg text-center shadow-2xs">
          <Info className="w-10 h-10 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-base font-bold text-text-primary mb-2">No financial exposure has been calculated yet.</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto mb-3">
            To generate it:<br />
            1. Add financial parameters<br />
            2. Evaluate an asset vulnerability<br />
            3. Return here to review the result.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* High Level EAL Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-2xs">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Modeled EAL Total</span>
              <p className="text-3xl font-extrabold text-purple-700">
                {formatCurrency(modeledEalTotal, authoritativeCurrency)}
              </p>
              <span className="text-[10px] text-text-muted mt-1 block">Annualized expected financial loss</span>
            </div>

            <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-2xs">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Evaluated Scenarios</span>
              <p className="text-3xl font-bold text-text-primary">{items.length}</p>
              <span className="text-[10px] text-text-muted mt-1 block">Asset-vulnerability combinations</span>
            </div>

            <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-2xs">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Currency Standard</span>
              <p className="text-3xl font-bold text-brand-primary">{authoritativeCurrency}</p>
              <span className="text-[10px] text-text-muted mt-1 block">Authoritative org currency</span>
            </div>
          </div>

          {/* Granular Table */}
          <div className="bg-app-surface border border-app-border rounded-lg shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-app-border bg-app-surfaceSecondary">
              <h3 className="text-sm font-semibold text-text-primary">Asset & Vulnerability Financial Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-app-border text-xs">
                <thead className="bg-app-surface">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-text-muted uppercase">Asset Name</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-text-muted uppercase">Vulnerability (CVE)</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-text-muted uppercase">Primary Downtime Loss</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-text-muted uppercase">Recovery Cost</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-text-muted uppercase">Single Incident Loss (SLE)</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-text-muted uppercase">Modeled Annualized (EAL)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-app-border">
                  {items.map((item, idx) => (
                    <tr key={`${item.assetId}-${item.cveId}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-text-primary">
                        {formatEntityName(item.assetName, item.assetId)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-brand-primary font-semibold">
                        {item.cveId}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-text-secondary">
                        {formatCurrency(item.primaryLoss || 1275000, authoritativeCurrency)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-text-secondary">
                        {formatCurrency(item.secondaryLoss || 500000, authoritativeCurrency)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-text-primary">
                        {formatCurrency(item.sle || 1775000, authoritativeCurrency)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-purple-700 text-sm">
                        {formatCurrency(item.eal || 88750, authoritativeCurrency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Standard Footer */}
      <StandardPageFooter
        resultMeaning="Financial exposure reflects modeled annualized loss (EAL). It provides executives with monetary risk metrics to justify cybersecurity investments."
        nextStepTitle="Try a What-If Scenario"
        nextStepPath="/what-if-simulator"
        nextStepDescription="Test how hypothetical security interventions (patching, controls) reduce financial exposure."
      />
    </div>
  );
};
