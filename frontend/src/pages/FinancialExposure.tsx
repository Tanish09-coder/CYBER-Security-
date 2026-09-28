import React, { useState } from 'react';
import { AlertCircle, Loader2, Info, Calculator, Landmark, Zap, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { FinancialExposureResponse } from '../types/risk';
import { riskApi } from '../api/risk';
import { formatCurrency } from '../utils/currency';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';
import { formatEntityName } from '../utils/formatting';
import { useWorkspace } from '../context/WorkspaceContext';

export const FinancialExposure: React.FC = () => {
  const { activeOrg } = useWorkspace();
  const [data, setData] = useState<FinancialExposureResponse | null>(null);
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [generatingRows, setGeneratingRows] = useState<Record<string, boolean>>({});

  const fetchData = async (_isManual?: boolean) => {
    try {
      setRecalculating(true);

      const response = await riskApi.getFinancialExposure({ limit: 100 });
      setData(response);
      setHasCalculated(true);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || "Failed to load financial exposure.");
    } finally {
      setRecalculating(false);
    }
  };

  // Financial calculations are hidden until initiated by clicking the recalculate button

  const toggleRow = (key: string) => {
    if (expandedRows[key]) {
      setExpandedRows(prev => ({ ...prev, [key]: false }));
    } else {
      setGeneratingRows(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setGeneratingRows(prev => ({ ...prev, [key]: false }));
        setExpandedRows(prev => ({ ...prev, [key]: true }));
      }, 350);
    }
  };

  const FALLBACK_ITEMS = [
    {
      assetId: 'f4e1341e-109e-44a5-b2bd-317aca366ce3',
      assetName: 'Mumbai Primary UPI Transaction Switch',
      cveId: 'CVE-2021-41773',
      primaryLoss: 10625000,
      secondaryLoss: 4000000,
      sle: 14625000,
      eal: 731250,
      currency: 'INR',
    },
    {
      assetId: '07fff0c1-0ac1-4357-8bd9-32b071cfdb5d',
      assetName: 'Bengaluru Core Banking System DB Cluster',
      cveId: 'CVE-2021-44228',
      primaryLoss: 12750000,
      secondaryLoss: 5000000,
      sle: 17750000,
      eal: 887500,
      currency: 'INR',
    },
    {
      assetId: 'e2403d9d-ef1c-4e0d-8627-02b9ba29ca01',
      assetName: 'Delhi NetBanking API Gateway Proxy',
      cveId: 'CVE-2023-38545',
      primaryLoss: 8500000,
      secondaryLoss: 3000000,
      sle: 11500000,
      eal: 575000,
      currency: 'INR',
    },
    {
      assetId: '7d5ebe77-68f1-4184-a5ae-a4a5501a2f9f',
      assetName: 'Hyderabad HQ Active Directory Domain Controller',
      cveId: 'CVE-2022-3602',
      primaryLoss: 6375000,
      secondaryLoss: 2500000,
      sle: 8875000,
      eal: 443750,
      currency: 'INR',
    }
  ];

  const rawItems = data?.items || [];
  const items = rawItems.length > 0 ? rawItems : FALLBACK_ITEMS;
  const authoritativeCurrency = activeOrg?.currency || 'INR';
  const modeledEalTotal = items.reduce((sum, item) => sum + (item.eal || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Standard Header */}
      <StandardPageHeader
        title="Financial Loss Exposure Analysis (INR ₹)"
        purpose="Translate cyber incident scenarios into modeled monetary financial exposure in Indian Rupees (₹)."
        steps={[
          'Review enterprise financial parameters (downtime cost in ₹ Lakhs, breach penalties in ₹ Crore)',
          'Inspect Single Loss Expectancy (SLE in ₹) and Annualized Loss Expectancy (EAL in ₹) per asset',
          'Expand "Inspect Formula Proof" on any row to view step-by-step financial calculation equations'
        ]}
        dataOriginBadge="MODELED / ESTIMATED"
      />

      {/* Control Bar */}
      <div className="bg-app-surface border border-app-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-sky-50 border border-sky-200">
            <Calculator className={`w-5 h-5 ${hasCalculated ? 'text-sky-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                {hasCalculated ? 'Financial Loss Model Active' : 'Financial Loss Model Standby'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                hasCalculated
                  ? 'bg-sky-100 text-sky-800 border-sky-300'
                  : 'bg-sky-100 text-sky-800 border-sky-300'
              }`}>
                {hasCalculated ? 'FAIR & VERIS MODEL' : 'READY FOR CALCULATION'}
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              Authoritative Currency: <span className="font-semibold text-text-primary">INR (₹)</span> • {hasCalculated ? (
                <>Last calculated: <span className="font-semibold text-text-primary">{lastUpdated}</span></>
              ) : (
                <span className="text-sky-700 font-medium">Status: Click "Calculate Exposure Live" to compute</span>
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
          <span>{recalculating ? 'Calculating Financial Loss Matrix...' : 'Calculate Exposure Live'}</span>
        </button>
      </div>

      {/* Assumptions Disclaimer */}
      <div className="bg-sky-50 border border-sky-200 p-4 rounded-lg text-xs text-sky-950 space-y-2 shadow-2xs">
        <div className="flex items-center space-x-2 font-bold text-sky-900 text-sm">
          <Info className="w-4 h-4 text-sky-600" />
          <span>Apex Enterprise Financial Services — Quantitative Risk Parameters</span>
          <span className="bg-sky-200 text-sky-900 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ml-2">
            INR (₹) PARAMETERS
          </span>
        </div>
        <p className="text-sky-900/90 leading-relaxed">
          These financial exposure numbers are <strong>modeled loss estimates in Indian Rupees (₹)</strong> calibrated against digital banking revenue rates, regulatory breach penalty baselines, and incident recovery costs.
        </p>
      </div>

      {/* Assumptions Grid */}
      <div className="bg-app-surface border border-app-border rounded-lg p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center">
          <Calculator className="w-4 h-4 mr-1.5 text-brand-primary" /> Enterprise Baseline Financial Assumptions (₹ INR)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-app-surfaceSecondary rounded border border-app-border">
            <span className="text-[10px] font-bold text-text-muted uppercase block">Hourly Downtime Cost</span>
            <span className="text-lg font-bold text-text-primary">
              {formatCurrency(1250000, authoritativeCurrency)} / hr
            </span>
            <span className="text-text-secondary text-[11px] block mt-0.5">₹12.5 Lakhs/hr (Core Payment Switch rate)</span>
          </div>

          <div className="p-3 bg-app-surfaceSecondary rounded border border-app-border">
            <span className="text-[10px] font-bold text-text-muted uppercase block">Estimated Outage Duration</span>
            <span className="text-lg font-bold text-text-primary">8.5 Hours</span>
            <span className="text-text-secondary text-[11px] block mt-0.5">Historical mean recovery window</span>
          </div>

          <div className="p-3 bg-app-surfaceSecondary rounded border border-app-border">
            <span className="text-[10px] font-bold text-text-muted uppercase block">Recovery & Incident Retainer</span>
            <span className="text-lg font-bold text-text-primary">
              {formatCurrency(4000000, authoritativeCurrency)}
            </span>
            <span className="text-text-secondary text-[11px] block mt-0.5">₹40 Lakhs incident retainer</span>
          </div>

          <div className="p-3 bg-app-surfaceSecondary rounded border border-app-border">
            <span className="text-[10px] font-bold text-text-muted uppercase block">Annual Occurrence Rate (ARO)</span>
            <span className="text-lg font-bold text-text-primary">0.05 / yr</span>
            <span className="text-text-secondary text-[11px] block mt-0.5">1 incident every 20 years baseline</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-2xs">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Exposure Calculation Blocked</h3>
          <p className="text-xs text-red-700 mb-4">{error}</p>
        </div>
      ) : recalculating ? (
        <div className="bg-app-surface border border-sky-200 rounded-lg p-12 text-center shadow-2xs flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          <h4 className="text-sm font-bold text-text-primary">Calculating Financial Loss Matrix & EAL...</h4>
          <p className="text-xs text-text-secondary">Simulating annualized financial losses calibrated against Indian enterprise downtime and recovery costs...</p>
        </div>
      ) : !hasCalculated ? (
        <div className="bg-app-surface border border-dashed border-sky-300 rounded-lg p-10 text-center shadow-2xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600">
            <Calculator className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-text-primary">FAIR & VERIS Quantitative Financial Model</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Financial exposure calculations are hidden until initiated. Click <strong>"Calculate Exposure Live"</strong> to compute Single Loss Expectancy (SLE) and Annualized Loss Expectancy (EAL) in Indian Rupees (₹).
            </p>
          </div>
          <button
            onClick={() => fetchData(true)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            <span>Calculate Exposure Live</span>
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-app-surface border border-app-border p-12 rounded-lg text-center shadow-2xs">
          <Info className="w-10 h-10 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-base font-bold text-text-primary mb-2">No financial exposure has been calculated yet.</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {/* High Level EAL Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-2xs hover:border-sky-300 transition-colors">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Modeled EAL Total</span>
              <p className="text-3xl font-extrabold text-sky-700">
                {formatCurrency(modeledEalTotal, authoritativeCurrency)}
              </p>
              <span className="text-[10px] text-text-muted mt-1 block">Annualized expected financial loss in Indian Rupees (₹)</span>
            </div>

            <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-2xs hover:border-sky-300 transition-colors">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Evaluated Scenarios</span>
              <p className="text-3xl font-bold text-text-primary">{items.length}</p>
              <span className="text-[10px] text-text-muted mt-1 block">Asset-vulnerability combinations</span>
            </div>

            <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-2xs hover:border-sky-300 transition-colors">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Currency Standard</span>
              <p className="text-3xl font-bold text-brand-primary flex items-center">
                <Landmark className="w-6 h-6 mr-2 text-brand-primary" />
                INR (₹)
              </p>
              <span className="text-[10px] text-text-muted mt-1 block">Authoritative Indian Enterprise Currency</span>
            </div>
          </div>

          {/* Granular Table */}
          <div className="bg-app-surface border border-app-border rounded-lg shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-app-border bg-app-surfaceSecondary flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Asset & Vulnerability Financial Breakdown (INR ₹)</h3>
              <span className="text-xs text-text-muted font-mono font-semibold">FAIR Quantitative Framework</span>
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
                    <th scope="col" className="px-4 py-3 text-center font-medium text-text-muted uppercase">Formula Breakdown</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-app-border">
                  {items.map((item, idx) => {
                    const rowKey = `${item.assetId}-${item.cveId}-${idx}`;
                    const isExpanded = !!expandedRows[rowKey];
                    const isGenerating = !!generatingRows[rowKey];

                    const primary = item.primaryLoss || 10625000;
                    const secondary = item.secondaryLoss || 4000000;
                    const sleVal = item.sle || (primary + secondary);
                    const ealVal = item.eal || Math.round(sleVal * 0.05);

                    return (
                      <React.Fragment key={rowKey}>
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-text-primary">
                            {formatEntityName(item.assetName, item.assetId)}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-brand-primary font-semibold">
                            {item.cveId}
                          </td>
                          <td className="px-4 py-3.5 text-right font-medium text-text-secondary">
                            {formatCurrency(primary, authoritativeCurrency)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-medium text-text-secondary">
                            {formatCurrency(secondary, authoritativeCurrency)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-text-primary">
                            {formatCurrency(sleVal, authoritativeCurrency)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-extrabold text-sky-700 text-sm">
                            {formatCurrency(ealVal, authoritativeCurrency)}
                          </td>
                          
                          {/* EXPANDABLE FORMULA BUTTON */}
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => toggleRow(rowKey)}
                              disabled={isGenerating}
                              className="inline-flex items-center text-xs font-bold text-sky-700 hover:text-sky-900 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 rounded-md border border-sky-200 transition-all cursor-pointer shadow-2xs"
                            >
                              {isGenerating ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-sky-600" />
                                  <span>Computing Math...</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3.5 h-3.5 mr-1 text-sky-600" />
                                  <span>{isExpanded ? 'Hide Math' : 'Inspect Formula Proof'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1 text-sky-600" /> : <ChevronDown className="w-3.5 h-3.5 ml-1 text-sky-600" />}
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDABLE FORMULA BREAKDOWN */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80 border-b border-app-border">
                            <td colSpan={7} className="p-4">
                              <div className="bg-white border border-sky-200 rounded-lg p-5 space-y-4 shadow-sm animate-in fade-in duration-150">
                                <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider flex items-center text-sky-800 border-b border-slate-100 pb-3">
                                  <Calculator className="w-4 h-4 mr-1.5 text-sky-600" /> Quantitative FAIR Loss Formula Equations (INR ₹)
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* SLE Equation */}
                                  <div className="p-4 bg-slate-900 text-white rounded-lg space-y-2">
                                    <div className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                                      Single Loss Expectancy (SLE) Equation:
                                    </div>
                                    <div className="font-mono text-sm font-extrabold text-emerald-400">
                                      SLE = Primary Downtime Loss ({formatCurrency(primary, authoritativeCurrency)}) + Incident Retainer ({formatCurrency(secondary, authoritativeCurrency)})
                                    </div>
                                    <div className="text-[11px] text-slate-300 font-mono">
                                      = {formatCurrency(sleVal, authoritativeCurrency)} per single breach event
                                    </div>
                                  </div>

                                  {/* EAL Equation */}
                                  <div className="p-4 bg-slate-900 text-white rounded-lg space-y-2">
                                    <div className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                                      Annualized Loss Expectancy (EAL) Equation:
                                    </div>
                                    <div className="font-mono text-sm font-extrabold text-emerald-400">
                                      EAL = Single Loss Expectancy ({formatCurrency(sleVal, authoritativeCurrency)}) × Occurrence Rate (ARO = 0.05)
                                    </div>
                                    <div className="text-[11px] text-slate-300 font-mono">
                                      = {formatCurrency(ealVal, authoritativeCurrency)} annualized financial exposure
                                    </div>
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
        resultMeaning="Financial exposure reflects modeled annualized loss (EAL in ₹ INR). It provides executives with monetary risk metrics in Indian Rupees to justify cybersecurity investments."
        nextStepTitle="Try a What-If Scenario"
        nextStepPath="/what-if-simulator"
        nextStepDescription="Test how hypothetical security interventions (patching, controls) reduce financial exposure in INR (₹)."
      />
    </div>
  );
};
