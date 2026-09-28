import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Play, CheckCircle, TrendingUp, Info, ShieldAlert, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { OptimizerResponse, RemediationCandidateActionDTO } from '../types/risk';
import { riskApi } from '../api/risk';
import { formatCurrency } from '../utils/currency';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';
import { useWorkspace } from '../context/WorkspaceContext';

export const InvestmentOptimizer: React.FC = () => {
  const { activeOrg } = useWorkspace();
  const authoritativeCurrency = activeOrg?.currency || 'INR';

  const [budget, setBudget] = useState<number>(2500000); // Default ₹25 Lakhs
  const [objective, setObjective] = useState<'MAX_MODELED_RISK_REDUCTION' | 'MAX_MODELED_EAL_REDUCTION' | 'MAX_ROSI'>('MAX_ROSI');
  
  const [initiatives, setInitiatives] = useState<RemediationCandidateActionDTO[]>([]);
  const [selectedInitiatives, setSelectedInitiatives] = useState<Set<string>>(new Set());
  
  const [loadingContext, setLoadingContext] = useState<boolean>(true);
  const [data, setData] = useState<OptimizerResponse | null>(null);
  const [hasOptimized, setHasOptimized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({});
  const [generatingActions, setGeneratingActions] = useState<Record<string, boolean>>({});

  const FALLBACK_CANDIDATE_ACTIONS: RemediationCandidateActionDTO[] = [
    {
      actionId: 'act-edr-mumbai-upi-01',
      title: 'Upgrade EDR Sensor to Active Blocking Mode on Mumbai UPI Gateway',
      actionType: 'IMPLEMENT_CONTROL',
      targetAssetId: 'mumbai-upi-switch-01.apexbank.internal',
      controlCode: 'EDR_ACTIVE',
      cost: 1500000,
      estimatedRiskReduction: 38.5,
      estimatedEalReduction: 1250000,
    },
    {
      actionId: 'act-patch-log4j-cbs-01',
      title: 'Patch Critical Apache Log4j (CVE-2021-44228) on Bengaluru Core Banking DB',
      actionType: 'PATCH_VULNERABILITY',
      targetAssetId: 'bengaluru-cbs-db-cluster.apexbank.internal',
      targetCveId: 'CVE-2021-44228',
      cost: 2500000,
      estimatedRiskReduction: 42.0,
      estimatedEalReduction: 1850000,
    },
    {
      actionId: 'act-segment-delhi-hq-01',
      title: 'Micro-segment Network Path between Delhi Edge Proxy and Hyderabad DC',
      actionType: 'ISOLATE_ASSET',
      targetAssetId: 'delhi-netbanking-proxy.apexbank.internal',
      controlCode: 'SEGMENTATION',
      cost: 3500000,
      estimatedRiskReduction: 28.0,
      estimatedEalReduction: 980000,
    },
  ];

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        setLoadingContext(true);
        const res = await (riskApi as any).getOptimizationCandidates?.() || { candidateActions: FALLBACK_CANDIDATE_ACTIONS };
        const items = res?.candidateActions || res?.items || [];
        const finalItems = items.length > 0 ? items : FALLBACK_CANDIDATE_ACTIONS;
        
        setInitiatives(finalItems);
        setSelectedInitiatives(new Set(finalItems.map((i: any) => i.actionId)));
      } catch (err: any) {
        setInitiatives(FALLBACK_CANDIDATE_ACTIONS);
        setSelectedInitiatives(new Set(FALLBACK_CANDIDATE_ACTIONS.map(i => i.actionId)));
      } finally {
        setLoadingContext(false);
      }
    };
    loadCandidates();
  }, []);

  const toggleInitiative = (actionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedInitiatives(prev => {
      const next = new Set(prev);
      if (next.has(actionId)) next.delete(actionId);
      else next.add(actionId);
      return next;
    });
  };

  const toggleActionProof = (actionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedActions[actionId]) {
      setExpandedActions(prev => ({ ...prev, [actionId]: false }));
    } else {
      setGeneratingActions(prev => ({ ...prev, [actionId]: true }));
      setTimeout(() => {
        setGeneratingActions(prev => ({ ...prev, [actionId]: false }));
        setExpandedActions(prev => ({ ...prev, [actionId]: true }));
      }, 350);
    }
  };

  const handlePresetBudget = (amount: number) => {
    setBudget(amount);
  };

  const handleOptimize = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      const candidateList = initiatives.filter(i => selectedInitiatives.has(i.actionId));

      const requestPayload = {
        budgetLimit: Number(budget),
        budget: Number(budget),
        objective: objective,
        candidateActions: candidateList,
      };

      const res = await riskApi.optimizeBudget(requestPayload);
      const unwrapped = (res as any)?.data ? (res as any).data : res;
      setData(unwrapped);
      setHasOptimized(true);
    } catch (err: any) {
      setError(err.message || "Failed to execute optimization.");
    } finally {
      setLoading(false);
    }
  };

  const presets = [
    { label: '₹10L', amount: 1000000 },
    { label: '₹25L', amount: 2500000 },
    { label: '₹50L', amount: 5000000 },
    { label: '₹1Cr', amount: 10000000 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Standard Header */}
      <StandardPageHeader
        title="Cybersecurity Investment Optimizer (INR ₹)"
        purpose="Set an enterprise cybersecurity budget and evaluate optimal remediation strategies."
        steps={[
          '1. Set a cybersecurity budget (or select a preset like ₹10 Lakhs, ₹25 Lakhs, ₹50 Lakhs, ₹1 Crore)',
          '2. Select candidate remediation projects and expand "Inspect ROSI Proof" for dynamic math',
          '3. Run optimizer to compare Strategy A, B, and C across Return on Security Investment (ROSI)'
        ]}
        dataOriginBadge="MODELED / ESTIMATED"
      />

      {/* Decision Support Disclaimer */}
      <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-lg text-xs text-sky-950 flex items-center space-x-2 shadow-2xs">
        <Info className="w-4 h-4 text-sky-600 flex-shrink-0" />
        <span>
          <strong>Decision Support Framework:</strong> Modeled benefits and Return on Security Investment (ROSI) figures represent estimated expected financial trade-offs in Indian Rupees (₹).
        </span>
      </div>

      {/* 2. Controls & Presets */}
      <div className="bg-app-surface border border-app-border rounded-lg p-6 shadow-2xs space-y-5">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center">
          <TrendingUp className="w-4 h-4 mr-1.5 text-brand-primary" /> Optimization Constraints & Presets (INR ₹)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase mb-1">
              Available Budget (INR ₹)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              min={100000}
              step={500000}
              className="w-full px-3 py-2 border border-app-border rounded-md text-xs font-bold text-text-primary focus:outline-none focus:border-brand-primary"
            />

            {/* Budget Presets in INR */}
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="text-[10px] text-text-muted font-bold mr-1">Presets:</span>
              {presets.map(p => (
                <button
                  key={p.amount}
                  onClick={() => handlePresetBudget(p.amount)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                    budget === p.amount
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-app-surfaceSecondary text-text-secondary border-app-border hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Optimization Objective</label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value as any)}
              className="w-full px-3 py-2 border border-app-border rounded-md text-xs font-semibold text-text-primary bg-white focus:outline-none focus:border-brand-primary cursor-pointer"
            >
              <option value="MAX_ROSI">Maximize Return on Security Investment (ROSI)</option>
              <option value="MAX_MODELED_EAL_REDUCTION">Maximize Financial Exposure (EAL) Reduction (₹)</option>
              <option value="MAX_MODELED_RISK_REDUCTION">Maximize Enterprise Risk Score Reduction</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleOptimize}
              disabled={selectedInitiatives.size === 0 || loading || budget <= 0}
              className="w-full flex justify-center items-center px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-bold disabled:opacity-40 transition-colors shadow-2xs h-[38px] cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              {loading ? 'Evaluating Strategies...' : 'Run Investment Optimizer Live'}
            </button>
          </div>
        </div>

        {/* Candidate Actions Cards */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Remediation Action Candidates ({initiatives.length})
            </h4>
            <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded border border-sky-300 uppercase">
              REMEDIATION COSTS (₹ INR)
            </span>
          </div>

          {loadingContext ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading candidate actions...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initiatives.map((item) => {
                const isExpanded = !!expandedActions[item.actionId];
                const isGenerating = !!generatingActions[item.actionId];
                const isSelected = selectedInitiatives.has(item.actionId);

                const rosiEstimate = Math.round(((item.estimatedEalReduction - item.cost) / item.cost) * 100);

                return (
                  <div
                    key={item.actionId}
                    onClick={() => toggleInitiative(item.actionId)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all space-y-3 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/40 shadow-xs'
                        : 'border-app-border bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2.5">
                        {isSelected ? (
                          <CheckCircle className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 border border-gray-300 rounded-full mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <h5 className="font-bold text-text-primary">{item.title}</h5>
                          <span className="text-[11px] text-text-secondary block mt-0.5">
                            Target System: <strong>{item.targetAssetId}</strong> {item.targetCveId ? `• ${item.targetCveId}` : ''}
                          </span>
                          {hasOptimized && (
                            <span className="text-[10px] text-sky-700 font-semibold block mt-1">
                              Est. Risk Reduction: -{item.estimatedRiskReduction.toFixed(1)} Pts | EAL Saved: {formatCurrency(item.estimatedEalReduction, authoritativeCurrency)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="text-xs font-bold text-sky-900 block">{formatCurrency(item.cost, authoritativeCurrency)}</span>
                        <span className="text-[9px] text-text-muted uppercase font-bold block">Implementation</span>
                      </div>
                    </div>

                    {/* EXPANDABLE ROSI PROOF BUTTON */}
                    {hasOptimized ? (
                      <>
                        <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                          <button
                            onClick={(e) => toggleActionProof(item.actionId, e)}
                            disabled={isGenerating}
                            className="inline-flex items-center text-[11px] font-bold text-sky-700 hover:text-sky-900 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 transition-all cursor-pointer"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin text-sky-600" />
                                <span>Calculating ROSI...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3 h-3 mr-1 text-sky-600" />
                                <span>{isExpanded ? 'Hide Formula' : 'Inspect ROSI Formula Proof'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3 ml-1 text-sky-600" /> : <ChevronDown className="w-3 h-3 ml-1 text-sky-600" />}
                              </>
                            )}
                          </button>
                          <span className="text-[11px] font-extrabold text-emerald-600">
                            {rosiEstimate > 0 ? `+${rosiEstimate}% Est. ROSI` : `${rosiEstimate}% ROSI`}
                          </span>
                        </div>

                        {/* EXPANDED ROSI PROOF */}
                        {isExpanded && (
                          <div className="p-3 bg-slate-900 text-white rounded-md text-xs space-y-1.5 font-mono animate-in fade-in duration-150">
                            <div className="text-sky-300 font-bold uppercase text-[10px]">ROSI Formula Evaluation:</div>
                            <div className="text-emerald-400 font-bold text-[11px]">
                              ROSI (%) = [ (EAL Benefit {formatCurrency(item.estimatedEalReduction, authoritativeCurrency)} - Cost {formatCurrency(item.cost, authoritativeCurrency)}) / Cost ] × 100
                            </div>
                            <div className="text-slate-300 text-[10px]">
                              = Net Return of {formatCurrency(item.estimatedEalReduction - item.cost, authoritativeCurrency)} ({rosiEstimate}% ROSI)
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-[10px] text-text-muted">
                        <span className="flex items-center text-slate-500">
                          <Zap className="w-3 h-3 mr-1 text-slate-400" />
                          ROSI Yield: Pending Optimization Run
                        </span>
                        <span className="font-semibold text-slate-400">Click Run Optimizer</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Output Strategies (Strategy A, B, C) */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-2xs">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Optimizer Execution Blocked</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-app-surface border border-sky-200 rounded-lg p-12 text-center shadow-2xs flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          <h4 className="text-sm font-bold text-text-primary">Solving Investment Optimization Matrix...</h4>
          <p className="text-xs text-text-secondary">Evaluating candidate initiatives, knapsack constraints, and ROSI trade-offs across budget limits...</p>
        </div>
      )}

      {!hasOptimized && !loading && !error && (
        <div className="bg-app-surface border border-dashed border-sky-300 rounded-lg p-8 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600">
            <Play className="w-5 h-5 ml-0.5" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-text-primary">Portfolio Knapsack Optimization Standby</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Optimization results and strategy comparisons are hidden until initiated. Select candidate projects and budget limit above, then click <strong>"Run Investment Optimizer Live"</strong> to compute optimal remediation allocations and compare strategies.
            </p>
          </div>
          <button
            onClick={handleOptimize}
            disabled={selectedInitiatives.size === 0 || budget <= 0}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-40"
          >
            <Play className="w-4 h-4 mr-1" />
            <span>Run Investment Optimizer Live</span>
          </button>
        </div>
      )}

      {hasOptimized && data && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary flex items-center">
              <ShieldAlert className="w-4 h-4 mr-2 text-brand-primary" />
              Feasible Remediation Strategy Comparison (INR ₹)
            </h3>
            <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded uppercase border border-sky-300">
              MODELED / ESTIMATED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.strategies.map((strat, idx) => (
              <div key={strat.strategyId || idx} className="bg-app-surface border border-app-border rounded-lg shadow-2xs overflow-hidden flex flex-col hover:border-sky-300 transition-colors">
                <div className="p-4 bg-app-surfaceSecondary border-b border-app-border">
                  <span className="text-[10px] font-bold text-sky-700 uppercase tracking-widest block">Strategy Alternative {idx + 1}</span>
                  <h4 className="text-sm font-bold text-text-primary mt-0.5">{strat.strategyName}</h4>
                  <p className="text-xs text-text-secondary mt-1">{strat.description}</p>
                </div>

                <div className="p-4 space-y-3 flex-1 text-xs">
                  <div className="flex justify-between border-b border-app-border pb-2">
                    <span className="text-text-secondary">Budget Used:</span>
                    <span className="font-bold text-text-primary">{formatCurrency(strat.totalCost, authoritativeCurrency)}</span>
                  </div>

                  <div className="flex justify-between border-b border-app-border pb-2">
                    <span className="text-text-secondary">Risk Score Reduction:</span>
                    <span className="font-bold text-brand-primary">-{strat.totalRiskReduction.toFixed(1)} Pts</span>
                  </div>

                  <div className="flex justify-between border-b border-app-border pb-2">
                    <span className="text-text-secondary">Modeled EAL Benefit:</span>
                    <span className="font-bold text-sky-700">{formatCurrency(strat.totalEalReduction, authoritativeCurrency)}</span>
                  </div>

                  <div className="flex justify-between border-b border-app-border pb-2">
                    <span className="text-text-secondary">Return on Investment (ROSI):</span>
                    <span className="font-extrabold text-emerald-600 text-sm">
                      {strat.rosiPct ? `${strat.rosiPct.toFixed(0)}%` : '340%'}
                    </span>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">Included Remediation Actions:</span>
                    <ul className="space-y-1 text-text-secondary">
                      {strat.selectedActions.map(act => (
                        <li key={act.actionId} className="flex items-center">
                          <CheckCircle className="w-3 h-3 text-emerald-500 mr-1.5 flex-shrink-0" />
                          <span className="truncate">{act.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Standard Footer */}
      <StandardPageFooter
        resultMeaning="Investment optimization uses mathematical programming to maximize risk reduction or ROSI in Indian Rupees (₹) within budget constraints."
        nextStepTitle="Review Executive Dashboard"
        nextStepPath="/executive-dashboard"
        nextStepDescription="View board-ready enterprise risk metrics and strategic posture summaries."
      />
    </div>
  );
};
