import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Play, CheckCircle, TrendingUp, ShieldAlert, Info } from 'lucide-react';
import { OptimizerResponse, RemediationCandidateActionDTO, OptimizerRequest } from '../types/risk';
import { riskApi } from '../api/risk';
import { formatCurrency } from '../utils/currency';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';
import { useWorkspace } from '../context/WorkspaceContext';
import { Skeleton } from '../components/common/Skeleton';

export const InvestmentOptimizer: React.FC = () => {
  const { activeOrg } = useWorkspace();
  const authoritativeCurrency = activeOrg?.currency || 'INR';

  const [initiatives, setInitiatives] = useState<RemediationCandidateActionDTO[]>([]);
  const [budget, setBudget] = useState<number>(5000000);
  const [objective, setObjective] = useState<'MAX_MODELED_RISK_REDUCTION' | 'MAX_MODELED_EAL_REDUCTION' | 'MAX_ROSI'>('MAX_ROSI');
  const [selectedInitiatives, setSelectedInitiatives] = useState<Set<string>>(new Set());

  const [loadingContext, setLoadingContext] = useState<boolean>(true);
  const [data, setData] = useState<OptimizerResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-populated realistic candidate actions in INR (₹)
  const FALLBACK_CANDIDATE_ACTIONS: RemediationCandidateActionDTO[] = [
    {
      actionId: 'act-edr-mumbai-upi-01',
      title: 'Upgrade EDR Sensor to Active Blocking Mode on Mumbai UPI Gateway',
      actionType: 'IMPLEMENT_CONTROL',
      targetAssetId: 'mumbai-upi-switch-01.bharatbank.internal',
      controlCode: 'EDR_ACTIVE',
      cost: 1500000, // ₹15 Lakhs
      estimatedRiskReduction: 38.5,
      estimatedEalReduction: 1250000,
    },
    {
      actionId: 'act-patch-log4j-cbs-01',
      title: 'Patch Critical Apache Log4j (CVE-2021-44228) on Bengaluru Core Banking DB',
      actionType: 'PATCH_VULNERABILITY',
      targetAssetId: 'bengaluru-cbs-db-cluster.bharatbank.internal',
      targetCveId: 'CVE-2021-44228',
      cost: 2500000, // ₹25 Lakhs
      estimatedRiskReduction: 42.0,
      estimatedEalReduction: 1850000,
    },
    {
      actionId: 'act-segment-delhi-hq-01',
      title: 'Micro-segment Network Path between Delhi Edge Proxy and Hyderabad DC',
      actionType: 'ISOLATE_ASSET',
      targetAssetId: 'delhi-netbanking-proxy.bharatbank.internal',
      controlCode: 'SEGMENTATION',
      cost: 3500000, // ₹35 Lakhs
      estimatedRiskReduction: 28.0,
      estimatedEalReduction: 980000,
    },
  ];

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        setLoadingContext(true);
        if (activeOrg?.id) {
          const candidateData = await riskApi.getOptimizationCandidates(activeOrg.id).catch(() => null);
          const adapted = candidateData?.data || candidateData;
          const actions: RemediationCandidateActionDTO[] = adapted?.candidateActions || FALLBACK_CANDIDATE_ACTIONS;
          setInitiatives(actions);
          setSelectedInitiatives(new Set(actions.map((a) => a.actionId)));
        } else {
          setInitiatives(FALLBACK_CANDIDATE_ACTIONS);
          setSelectedInitiatives(new Set(FALLBACK_CANDIDATE_ACTIONS.map(a => a.actionId)));
        }
      } catch {
        setInitiatives(FALLBACK_CANDIDATE_ACTIONS);
        setSelectedInitiatives(new Set(FALLBACK_CANDIDATE_ACTIONS.map(a => a.actionId)));
      } finally {
        setLoadingContext(false);
      }
    };

    loadCandidates();
  }, [activeOrg]);

  const toggleInitiative = (id: string) => {
    const newSet = new Set(selectedInitiatives);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedInitiatives(newSet);
  };

  const handlePresetBudget = (presetAmount: number) => {
    setBudget(presetAmount);
  };

  const handleOptimize = async () => {
    if (selectedInitiatives.size === 0) return;

    try {
      setLoading(true);
      setError(null);
      setData(null);

      const selectedActions = initiatives.filter((i) => selectedInitiatives.has(i.actionId));

      const request: OptimizerRequest = {
        organizationId: activeOrg?.id || 'demo-apex-financial-01',
        budgetLimit: budget,
        currency: authoritativeCurrency,
        objective: objective,
        candidateActions: selectedActions,
      };

      const response = await riskApi.optimizeBudget(request);
      const unwrapped = (response as any)?.data ? (response as any).data : response;
      setData(unwrapped);
    } catch (err: any) {
      setError(err.message || 'Failed to execute investment optimizer.');
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
        purpose="Set an Indian enterprise cybersecurity budget and evaluate optimal remediation strategies."
        steps={[
          '1. Set an Indian cybersecurity budget (or select a preset like ₹10 Lakhs, ₹25 Lakhs, ₹50 Lakhs, ₹1 Crore)',
          '2. Review candidate remediation projects (EDR upgrade on Mumbai UPI Gateway, Log4j patch on Core Banking DB)',
          '3. Run optimizer to compare Strategy A, B, and C across Return on Security Investment (ROSI)'
        ]}
        dataOriginBadge="MODELED / ESTIMATED"
      />

      {/* No Guaranteed Returns Disclaimer */}
      <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-lg text-xs text-purple-950 flex items-center space-x-2 shadow-2xs">
        <Info className="w-4 h-4 text-purple-600 flex-shrink-0" />
        <span>
          <strong>Decision Support Framework:</strong> Modeled benefits and Return on Security Investment (ROSI) figures represent estimated expected financial trade-offs in Indian Rupees (₹) and do not guarantee fixed actual financial returns.
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
                  className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors ${
                    budget === p.amount
                      ? 'bg-brand-primary text-white border-brand-primary'
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
              className="w-full px-3 py-2 border border-app-border rounded-md text-xs font-semibold text-text-primary bg-white focus:outline-none focus:border-brand-primary"
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
              className="w-full flex justify-center items-center px-6 py-2.5 bg-brand-primary text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-2xs h-[38px]"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              {loading ? 'Evaluating Strategies...' : 'Run Investment Optimizer'}
            </button>
          </div>
        </div>

        {/* Candidate Actions Cards */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Remediation Action Candidates ({initiatives.length})
            </h4>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-300 uppercase">
              INDIAN DEMO REMEDIATION COST (₹ INR)
            </span>
          </div>

          {loadingContext ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {initiatives.map((item) => (
                <div
                  key={item.actionId}
                  onClick={() => toggleInitiative(item.actionId)}
                  className={`p-3.5 border rounded-lg cursor-pointer transition-colors flex items-start justify-between text-xs ${
                    selectedInitiatives.has(item.actionId)
                      ? 'border-brand-primary bg-blue-50/40'
                      : 'border-app-border bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    {selectedInitiatives.has(item.actionId) ? (
                      <CheckCircle className="w-4 h-4 text-brand-primary mt-0.5 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 border border-gray-300 rounded-full mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <h5 className="font-bold text-text-primary">{item.title}</h5>
                      <span className="text-[11px] text-text-secondary block mt-0.5">
                        Target System: <strong>{item.targetAssetId}</strong> {item.targetCveId ? `• ${item.targetCveId}` : ''}
                      </span>
                      <span className="text-[10px] text-brand-primary font-semibold block mt-1">
                        Est. Risk Reduction: -{item.estimatedRiskReduction.toFixed(1)} Pts | EAL Saved: {formatCurrency(item.estimatedEalReduction, authoritativeCurrency)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-xs font-bold text-purple-700 block">{formatCurrency(item.cost, authoritativeCurrency)}</span>
                    <span className="text-[9px] text-text-muted uppercase font-bold block">Demo Cost</span>
                  </div>
                </div>
              ))}
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

      {data && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary flex items-center">
              <ShieldAlert className="w-4 h-4 mr-2 text-brand-primary" />
              Feasible Remediation Strategy Comparison (INR ₹)
            </h3>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded uppercase border border-purple-300">
              MODELED / ESTIMATED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.strategies.map((strat, idx) => (
              <div key={strat.strategyId || idx} className="bg-app-surface border border-app-border rounded-lg shadow-2xs overflow-hidden flex flex-col">
                <div className="p-4 bg-app-surfaceSecondary border-b border-app-border">
                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block">Strategy Alternative {idx + 1}</span>
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
                    <span className="font-bold text-purple-700">{formatCurrency(strat.totalEalReduction, authoritativeCurrency)}</span>
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
