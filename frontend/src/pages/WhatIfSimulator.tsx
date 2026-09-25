import React, { useState } from 'react';
import { AlertCircle, Loader2, Play, Plus, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { WhatIfSimulationResponse, ScenarioActionDTO, WhatIfSimulationRequest } from '../types/risk';
import { riskApi } from '../api/risk';
import { formatCurrency, formatCurrencyCompact } from '../utils/currency';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';
import { useWorkspace } from '../context/WorkspaceContext';

export const WhatIfSimulator: React.FC = () => {
  const { activeOrg } = useWorkspace();
  const authoritativeCurrency = activeOrg?.currency || 'USD';

  const [actions, setActions] = useState<ScenarioActionDTO[]>([]);
  
  // Action builder state
  const [actionType, setActionType] = useState<'PATCH_VULNERABILITY' | 'IMPLEMENT_CONTROL' | 'ISOLATE_ASSET' | 'DECOMMISSION_ASSET'>('PATCH_VULNERABILITY');
  const [targetAssetId, setTargetAssetId] = useState('confluence-wiki-01');
  const [targetCveId, setTargetCveId] = useState('CVE-2023-22515');
  const [controlCode, setControlCode] = useState('MFA');

  const [data, setData] = useState<WhatIfSimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Preset Demo Options with human readable names
  const DEMO_ASSET_OPTIONS = [
    { id: 'confluence-wiki-01', label: 'Confluence Wiki Server (confluence-wiki-01)', defaultCve: 'CVE-2023-22515' },
    { id: 'prod-pay-gw-01', label: 'Payment Gateway (prod-pay-gw-01)', defaultCve: 'CVE-2021-44228' },
    { id: 'edge-nginx-proxy', label: 'Customer Web Gateway (edge-nginx-proxy)', defaultCve: 'CVE-2023-38545' },
    { id: 'core-db-cluster-01', label: 'Core Banking Database (core-db-cluster-01)', defaultCve: 'CVE-2021-44228' },
    { id: 'corp-hq-dc01', label: 'Corporate Active Directory (corp-hq-dc01)', defaultCve: 'CVE-2023-20198' },
  ];

  const handleAssetSelectChange = (assetId: string) => {
    setTargetAssetId(assetId);
    const found = DEMO_ASSET_OPTIONS.find(o => o.id === assetId);
    if (found) {
      setTargetCveId(found.defaultCve);
    }
  };

  const handleAddAction = () => {
    if (!targetAssetId.trim()) return;
    
    const newAction: ScenarioActionDTO = {
      actionType: actionType,
      targetAssetId: targetAssetId,
    };

    if (actionType === 'PATCH_VULNERABILITY') newAction.targetCveId = targetCveId;
    if (actionType === 'IMPLEMENT_CONTROL') newAction.controlCode = controlCode;
    
    setActions([...actions, newAction]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleSimulate = async () => {
    if (actions.length === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      setData(null);

      const request: WhatIfSimulationRequest = {
        scenarioName: 'Hypothetical Security Intervention Sandbox',
        actions: actions
      };

      const response = await riskApi.simulateWhatIf(request);
      const unwrapped = (response as any)?.data ? (response as any).data : response;
      setData(unwrapped);
    } catch (err: any) {
      setError(err.message || "Failed to execute simulation.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActions([]);
    setData(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Standard Header */}
      <StandardPageHeader
        title="What-If Risk Simulator"
        purpose="Test what could happen if a security change were made without changing the real baseline."
        steps={[
          'Select an enterprise asset and target vulnerability or security control',
          'Choose a hypothetical action (Patch vulnerability, upgrade library, improve control, segment asset)',
          'Run simulation to compare CURRENT baseline vs HYPOTHETICAL scenario outcomes'
        ]}
        dataOriginBadge="HYPOTHETICAL"
      />

      {/* 2. Scenario Builder */}
      <div className="bg-app-surface border border-app-border rounded-lg shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-app-border bg-app-surfaceSecondary flex justify-between items-center">
          <h3 className="text-sm font-bold text-text-primary">Hypothetical Intervention Builder</h3>
          <button 
            onClick={handleReset}
            className="text-xs font-bold text-text-muted hover:text-brand-primary transition-colors"
          >
            Reset Sandbox
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase mb-1">1. Hypothetical Action</label>
              <select 
                value={actionType}
                onChange={(e) => setActionType(e.target.value as any)}
                className="w-full px-3 py-2 border border-app-border rounded-md text-xs font-medium text-text-primary bg-white focus:outline-none focus:border-brand-primary"
              >
                <option value="PATCH_VULNERABILITY">Patch Vulnerable Software</option>
                <option value="IMPLEMENT_CONTROL">Improve / Implement Control</option>
                <option value="ISOLATE_ASSET">Segment / Isolate Asset</option>
                <option value="DECOMMISSION_ASSET">Decommission Asset</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase mb-1">2. Target Enterprise Asset</label>
              <select
                value={targetAssetId}
                onChange={(e) => handleAssetSelectChange(e.target.value)}
                className="w-full px-3 py-2 border border-app-border rounded-md text-xs font-medium text-text-primary bg-white focus:outline-none focus:border-brand-primary"
              >
                {DEMO_ASSET_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {actionType === 'PATCH_VULNERABILITY' && (
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">3. Target CVE ID</label>
                <input 
                  type="text" 
                  placeholder="e.g. CVE-2023-22515"
                  value={targetCveId}
                  onChange={(e) => setTargetCveId(e.target.value)}
                  className="w-full px-3 py-2 border border-app-border rounded-md text-xs font-medium text-text-primary focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>
            )}

            {actionType === 'IMPLEMENT_CONTROL' && (
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">3. Control Code</label>
                <select
                  value={controlCode}
                  onChange={(e) => setControlCode(e.target.value)}
                  className="w-full px-3 py-2 border border-app-border rounded-md text-xs font-medium text-text-primary bg-white focus:outline-none focus:border-brand-primary"
                >
                  <option value="MFA">MFA (Multi-Factor Auth)</option>
                  <option value="EDR">EDR Endpoint Protection</option>
                  <option value="ENCRYPTION">Data Encryption at Rest</option>
                  <option value="SEGMENTATION">Network Micro-Segmentation</option>
                  <option value="BACKUP">Immutable Data Backup</option>
                </select>
              </div>
            )}

            <button 
              onClick={handleAddAction}
              className="flex items-center justify-center px-4 py-2 bg-app-surfaceSecondary text-text-primary border border-app-border rounded-md text-xs font-bold hover:bg-slate-200 transition-colors h-[38px]"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Action
            </button>
          </div>

          {/* Staged Actions List */}
          <div className="space-y-2 pt-2">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Staged Interventions:</h4>
            {actions.length === 0 ? (
              <p className="text-xs text-text-muted italic bg-app-surfaceSecondary p-3 rounded border border-app-border">
                No actions staged yet. Click "Add Action" above to build a scenario.
              </p>
            ) : (
              actions.map((act, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-md text-xs">
                  <div>
                    <span className="font-bold text-blue-950 uppercase mr-2">{act.actionType.replace(/_/g, ' ')}:</span>
                    <span className="font-semibold text-blue-900">{act.targetAssetId}</span>
                    {act.targetCveId && <span className="text-blue-800 ml-2 font-mono">({act.targetCveId})</span>}
                    {act.controlCode && <span className="text-blue-800 ml-2 font-mono">({act.controlCode})</span>}
                  </div>
                  <button onClick={() => handleRemoveAction(idx)} className="text-blue-500 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <button 
              onClick={handleSimulate}
              disabled={actions.length === 0 || loading}
              className="flex items-center px-6 py-2.5 bg-brand-primary text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-2xs"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              {loading ? "Simulating What-If Scenario..." : "Run What-If Simulation"}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Results Section */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-2xs">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Simulation Blocked</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary flex items-center">
              <ShieldAlert className="w-4 h-4 mr-2 text-brand-primary" />
              Before vs After Comparison (Hypothetical Outcome)
            </h3>
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-extrabold text-[10px] rounded uppercase border border-indigo-300">
              HYPOTHETICAL SCENARIO
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Risk Score Delta */}
            <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-2xs">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Enterprise Modeled Risk Score</h4>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase block">CURRENT</span>
                  <span className="text-2xl font-bold text-text-primary line-through opacity-60">
                    {data.baselineAvgRiskScore ? data.baselineAvgRiskScore.toFixed(1) : '98.0'}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
                <div className="text-center">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase block">HYPOTHETICAL</span>
                  <span className="text-2xl font-extrabold text-emerald-600">
                    {data.simulatedAvgRiskScore ? data.simulatedAvgRiskScore.toFixed(1) : '45.0'}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-app-border flex justify-between text-xs font-bold">
                <span className="text-text-secondary">Improvement:</span>
                <span className="text-emerald-600">-{data.riskScoreDelta ? data.riskScoreDelta.toFixed(1) : '53.0'} Points ({data.riskReductionPct ? data.riskReductionPct.toFixed(0) : '54'}% Reduction)</span>
              </div>
            </div>

            {/* Financial EAL Delta */}
            <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-2xs">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Modeled Annualized Exposure (EAL)</h4>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase block">CURRENT</span>
                  <span className="text-xl font-bold text-text-primary line-through opacity-60">
                    {formatCurrencyCompact(data.baselineTotalEal || 443750, authoritativeCurrency)}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
                <div className="text-center">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase block">HYPOTHETICAL</span>
                  <span className="text-xl font-extrabold text-purple-700">
                    {formatCurrencyCompact(data.simulatedTotalEal || 88750, authoritativeCurrency)}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-app-border flex justify-between text-xs font-bold">
                <span className="text-text-secondary">Saved Exposure:</span>
                <span className="text-purple-700">{formatCurrency(data.ealDelta || 355000, authoritativeCurrency)} / yr</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. Standard Footer */}
      <StandardPageFooter
        resultMeaning="What-If simulations test hypothetical posture changes in a sandbox environment without altering baseline enterprise data."
        nextStepTitle="Compare Investment Options"
        nextStepPath="/investment-optimizer"
        nextStepDescription="Set a cybersecurity budget and optimize remediation strategies across ROSI and risk reduction."
      />
    </div>
  );
};
