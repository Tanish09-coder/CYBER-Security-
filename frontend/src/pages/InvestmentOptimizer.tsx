import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Play, CheckCircle, TrendingUp, ShieldAlert, Layers } from 'lucide-react';
import { OptimizerResponse, RemediationCandidateActionDTO, OptimizerRequest } from '../types/risk';
import { riskApi } from '../api/risk';
import { fetchApi } from '../api/client';
import { formatCurrency } from '../utils/currency';

export const InvestmentOptimizer: React.FC = () => {
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; currency: string }>>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [initiatives, setInitiatives] = useState<RemediationCandidateActionDTO[]>([]);
  const [budget, setBudget] = useState<number>(0);
  // Currency is authoritative from org context; do NOT default to 'USD'
  const [currency, setCurrency] = useState<string>('');
  const [objective, setObjective] = useState<'MAX_MODELED_RISK_REDUCTION' | 'MAX_MODELED_EAL_REDUCTION' | 'MAX_ROSI'>('MAX_ROSI');
  const [selectedInitiatives, setSelectedInitiatives] = useState<Set<string>>(new Set());

  const [loadingContext, setLoadingContext] = useState<boolean>(true);
  const [data, setData] = useState<OptimizerResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Authoritative Organizations and Remediation Context
  useEffect(() => {
    const fetchEnterpriseContext = async () => {
      try {
        setLoadingContext(true);
        const orgRes = await fetchApi<{ data: Array<{ id: string; name: string; currency: string }> }>('/v1/organizations');
        const orgs = orgRes.data || [];
        setOrganizations(orgs);

        if (orgs.length > 0) {
          const activeOrg = orgs[0];
          setSelectedOrgId(activeOrg.id);
          // Only set currency if authoritative value is present; do not invent 'USD'
          if (activeOrg.currency) setCurrency(activeOrg.currency);
          await loadOrganizationCandidates(activeOrg.id);
        } else {
          setLoadingContext(false);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load enterprise context for investment optimization.');
        setLoadingContext(false);
      }
    };

    fetchEnterpriseContext();
  }, []);

  const loadOrganizationCandidates = async (orgId: string) => {
    try {
      setLoadingContext(true);
      setError(null);
      setData(null);

      const candidateData = await riskApi.getOptimizationCandidates(orgId);
      const adapted = candidateData.data || candidateData;

      const actions: RemediationCandidateActionDTO[] = adapted.candidateActions || [];
      setInitiatives(actions);
      setSelectedInitiatives(new Set(actions.map((a) => a.actionId)));

      if (adapted.budgetLimit !== undefined && adapted.budgetLimit !== null) {
        setBudget(adapted.budgetLimit);
      }
      if (adapted.currency) {
        setCurrency(adapted.currency);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load authoritative remediation candidate actions.');
    } finally {
      setLoadingContext(false);
    }
  };

  const handleOrgChange = async (newOrgId: string) => {
    setSelectedOrgId(newOrgId);
    const org = organizations.find((o) => o.id === newOrgId);
    if (org && org.currency) setCurrency(org.currency);
    await loadOrganizationCandidates(newOrgId);
  };

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

      const selectedActions = initiatives.filter((i) => selectedInitiatives.has(i.actionId));

      const request: OptimizerRequest = {
        organizationId: selectedOrgId,
        budgetLimit: budget,
        currency: currency,
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

  if (loadingContext) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-sm font-medium text-text-secondary">Loading authoritative enterprise remediation context...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-text-primary flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-brand-primary" />
          Investment Optimizer
        </h2>
        {organizations.length > 1 && (
          <div className="flex items-center space-x-2">
            <label className="text-xs text-text-muted font-medium">Organization:</label>
            <select
              value={selectedOrgId}
              onChange={(e) => handleOrgChange(e.target.value)}
              className="px-2 py-1 text-xs border border-app-border rounded bg-white text-text-primary focus:outline-none"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <p className="text-xs text-text-secondary mb-6">
        Allocate enterprise cybersecurity resources efficiently by evaluating feasible strategy alternatives across modeled risk reduction, financial exposure savings, and Return on Security Investment (ROSI).
      </p>

      {/* 1. OPTIMIZER INPUTS */}
      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-app-border bg-surface-secondary">
          <h3 className="text-sm font-semibold text-text-primary">Optimization Constraints & Objectives</h3>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Available Budget{currency ? ` (${currency})` : ''}
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                min={0}
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text-primary">
                Authoritative Remediation Actions ({initiatives.length})
              </label>
              <span className="text-xs text-text-muted">
                {selectedInitiatives.size} of {initiatives.length} candidate actions selected
              </span>
            </div>

            {initiatives.length === 0 ? (
              <div className="bg-app-surface border border-dashed border-app-border p-8 rounded-lg text-center">
                <Layers className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <h4 className="text-sm font-bold text-text-primary mb-1">No Planned Remediation Actions Found</h4>
                <p className="text-xs text-text-secondary max-w-md mx-auto">
                  Authoritative remediation actions for this organization have not been registered yet. Add planned remediation actions or integrate enterprise controls to unlock portfolio optimization.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {initiatives.map((initiative) => (
                  <div
                    key={initiative.actionId}
                    onClick={() => toggleInitiative(initiative.actionId)}
                    className={`p-3 border rounded-md cursor-pointer flex items-start transition-colors ${
                      selectedInitiatives.has(initiative.actionId)
                        ? 'border-brand-primary bg-blue-50/30'
                        : 'border-app-border bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="mt-0.5 mr-3">
                      {selectedInitiatives.has(initiative.actionId) ? (
                        <CheckCircle className="w-4 h-4 text-brand-primary" />
                      ) : (
                        <div className="w-4 h-4 border border-gray-300 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-text-primary truncate">{initiative.title}</h4>
                      <p className="text-xs text-text-muted mt-0.5">
                        Cost: {currency ? `${currency} ` : ''}{initiative.cost.toLocaleString()}
                        {initiative.targetCveId ? ` Â· ${initiative.targetCveId}` : ''}
                      </p>
                      <p className="text-xs text-brand-primary mt-1">
                        Est. Risk Red: -{initiative.estimatedRiskReduction.toFixed(2)} | Est. EAL Red: {currency ? `${currency} ` : ''}{(initiative.estimatedEalReduction / 1000).toFixed(1)}k
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleOptimize}
            disabled={selectedInitiatives.size === 0 || loading || budget <= 0}
            className="w-full md:w-auto flex justify-center items-center px-6 py-3 bg-brand-primary text-white rounded-md text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            {loading ? 'Evaluating Feasible Strategies...' : 'Run Investment Optimizer'}
          </button>
        </div>
      </div>

      {/* 2. RESULTS CONTAINER */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-4" />
          <p className="text-sm font-medium text-text-secondary">Evaluating feasible investment strategy alternatives...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-red-900 mb-2">Optimizer Execution Blocked</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {data && !loading && !error && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2 text-text-secondary" />
                Feasible Strategies (Model v{data.modelVersion})
              </h3>
              {data.optimizationResultId && (
                <span className="text-xs font-mono text-text-muted">
                  ID: {data.optimizationResultId}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.strategies.map((strategy, idx) => (
                <div
                  key={strategy.strategyId || idx}
                  className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="px-4 py-3 border-b bg-surface-secondary border-app-border">
                    <h4 className="text-sm font-bold text-text-primary">{strategy.strategyName}</h4>
                    <p className="text-xs text-text-muted mt-1">{strategy.description}</p>
                  </div>
                  <div className="p-4 flex-grow space-y-4">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Cost / Budget</p>
                      <p className="text-xl font-semibold text-text-primary">
                        {formatCurrency(strategy.totalCost, data.currency ?? null)} / {formatCurrency(data.budgetLimit, data.currency ?? null)}
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
                        {formatCurrency(strategy.totalEalReduction, data.currency ?? null)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">ROSI</p>
                      <p className="text-xl font-bold text-green-600">
                        {strategy.rosiPct !== null && strategy.rosiPct !== undefined
                          ? `${strategy.rosiPct.toFixed(1)}%`
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-app-border">
                      <p className="text-xs font-medium text-text-primary mb-2">
                        Included Actions ({strategy.actionCount}):
                      </p>
                      <ul className="text-xs text-text-secondary space-y-1">
                        {strategy.selectedActions.map((act) => (
                          <li key={act.actionId} className="truncate">â€¢ {act.title}</li>
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
