import React, { useState } from 'react';
import { AlertCircle, Loader2, Play, CheckCircle, TrendingUp, ShieldAlert } from 'lucide-react';
import { OptimizerResponse, RemediationCandidateActionDTO, OptimizerRequest } from '../types/risk';
import { riskApi } from '../api/risk';

const DEFAULT_CANDIDATE_INITIATIVES: RemediationCandidateActionDTO[] = [
  { actionId: 'INIT-001', title: 'Deploy EDR on all Tier 1 Servers', cost: 150000, targetAssetId: 'ASSET-1', actionType: 'IMPLEMENT_CONTROL', controlCode: 'CTL-EDR', estimatedRiskReduction: 15.5, estimatedEalReduction: 500000 },
  { actionId: 'INIT-002', title: 'Network Segmentation for PCI Zone', cost: 200000, targetAssetId: 'ASSET-3', actionType: 'ISOLATE_ASSET', estimatedRiskReduction: 8.2, estimatedEalReduction: 300000 },
  { actionId: 'INIT-003', title: 'MFA Enforcement across VPN', cost: 50000, targetAssetId: 'ASSET-ALL', actionType: 'IMPLEMENT_CONTROL', controlCode: 'CTL-MFA', estimatedRiskReduction: 10.0, estimatedEalReduction: 800000 },
  { actionId: 'INIT-004', title: 'Patch Critical CVEs on DB Cluster', cost: 25000, targetAssetId: 'ASSET-2', actionType: 'PATCH_VULNERABILITY', targetCveId: 'CVE-2023-1234', estimatedRiskReduction: 12.0, estimatedEalReduction: 250000 },
];

export const InvestmentOptimizer: React.FC = () => {
  const [budget, setBudget] = useState<number>(300000);
  const [objective, setObjective] = useState<'MAX_MODELED_RISK_REDUCTION' | 'MAX_MODELED_EAL_REDUCTION' | 'MAX_ROSI'>('MAX_ROSI');
  const [selectedInitiatives, setSelectedInitiatives] = useState<Set<string>>(new Set(DEFAULT_CANDIDATE_INITIATIVES.map(i => i.actionId)));
  
  const [data, setData] = useState<OptimizerResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInitiative = (id: string) => {
    const newSet = new Set(selectedInitiatives);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedInitiatives(newSet);
  };

  const handleOptimize = async () => {
    if (selectedInitiatives.size === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      setData(null);

      const request: OptimizerRequest = {
        budgetLimit: budget,
        objective: objective,
        candidateActions: DEFAULT_CANDIDATE_INITIATIVES.filter(i => selectedInitiatives.has(i.actionId))
      };

      const response = await riskApi.optimizeBudget(request);
      setData(response);
    } catch (err: any) {
      setError(err.message || "Failed to execute optimizer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-text-primary flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-brand-primary" />
          Investment Optimizer
        </h2>
      </div>
      <p className="text-xs text-text-secondary mb-6">
        Allocate your cybersecurity budget efficiently by identifying the optimal combination of security initiatives to maximize your chosen objective.
      </p>

      {/* 1. OPTIMIZER INPUTS */}
      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-app-border bg-surface-secondary">
          <h3 className="text-sm font-semibold text-text-primary">Optimization Constraints & Objectives</h3>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-primary mb-2">Available Budget (INR)</label>
              <input 
                type="number" 
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-3 py-2 border border-app-border rounded-md text-sm text-text-primary focus:outline-none focus:border-brand-primary"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-primary mb-2">Optimization Objective</label>
              <select 
                value={objective}
                onChange={(e) => setObjective(e.target.value as any)}
                className="w-full px-3 py-2 border border-app-border rounded-md text-sm text-text-primary bg-white focus:outline-none focus:border-brand-primary"
              >
                <option value="MAX_ROSI">Maximize Return on Security Investment (ROSI)</option>
                <option value="MAX_MODELED_EAL_REDUCTION">Maximize Financial Exposure (EAL) Reduction</option>
                <option value="MAX_MODELED_RISK_REDUCTION">Maximize Enterprise Risk Score Reduction</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-2">Candidate Actions</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DEFAULT_CANDIDATE_INITIATIVES.map(initiative => (
                <div 
                  key={initiative.actionId}
                  onClick={() => toggleInitiative(initiative.actionId)}
                  className={`p-3 border rounded-md cursor-pointer flex items-start transition-colors ${selectedInitiatives.has(initiative.actionId) ? 'border-brand-primary bg-blue-50/30' : 'border-app-border bg-white hover:bg-gray-50'}`}
                >
                  <div className="mt-0.5 mr-3">
                    {selectedInitiatives.has(initiative.actionId) ? (
                      <CheckCircle className="w-4 h-4 text-brand-primary" />
                    ) : (
                      <div className="w-4 h-4 border border-gray-300 rounded-full" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">{initiative.title}</h4>
                    <p className="text-xs text-text-muted mt-1">Cost: INR {initiative.cost.toLocaleString()}</p>
                    <p className="text-xs text-brand-primary mt-1">
                       Est. Risk Red: -{initiative.estimatedRiskReduction} | Est. EAL Red: INR {(initiative.estimatedEalReduction/1000).toFixed(0)}k
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleOptimize}
            disabled={selectedInitiatives.size === 0 || loading || budget <= 0}
            className="w-full md:w-auto flex justify-center items-center px-6 py-3 bg-brand-primary text-white rounded-md text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            {loading ? "Solving Knapsack..." : "Run Optimizer"}
          </button>
        </div>
      </div>

      {/* 2. RESULTS CONTAINER */}
      
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-4" />
          <p className="text-sm font-medium text-text-secondary">Simulating thousands of investment combinations...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-red-900 mb-2">Optimizer Unavailable</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {data && !loading && !error && (
        <div className="space-y-8">
          
          <div>
             <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
               <ShieldAlert className="w-5 h-5 mr-2 text-text-secondary" /> 
               Recommended Strategies (Model v{data.modelVersion})
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.strategies.map((strategy, idx) => (
                  <div key={idx} className={`bg-app-surface border rounded-lg shadow-sm overflow-hidden flex flex-col ${idx === 0 ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-app-border'}`}>
                    <div className={`px-4 py-3 border-b ${idx === 0 ? 'bg-blue-50 border-brand-primary/20' : 'bg-surface-secondary border-app-border'}`}>
                      <h4 className="text-sm font-bold text-text-primary">{strategy.strategyName}</h4>
                      <p className="text-xs text-text-muted mt-1">{strategy.description}</p>
                    </div>
                    <div className="p-4 flex-grow space-y-4">
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Cost / Budget</p>
                        <p className="text-xl font-semibold text-text-primary">
                          {data.currency} {strategy.totalCost.toLocaleString()} / {data.budgetLimit.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Risk Score Reduction</p>
                        <p className="text-xl font-semibold text-brand-primary">
                          -{strategy.totalRiskReduction.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">EAL Reduction</p>
                        <p className="text-xl font-semibold text-purple-600">
                          {data.currency} {strategy.totalEalReduction.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">ROSI</p>
                        <p className="text-xl font-bold text-green-600">
                          {strategy.rosiPct !== null && strategy.rosiPct !== undefined ? `${strategy.rosiPct.toFixed(1)}%` : 'N/A'}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-app-border">
                        <p className="text-xs font-medium text-text-primary mb-2">Included Actions ({strategy.actionCount}):</p>
                        <ul className="text-xs text-text-secondary space-y-1">
                          {strategy.selectedActions.map(act => (
                            <li key={act.actionId}>• {act.title}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
          
        </div>
      )}
    </div>
  );
};
