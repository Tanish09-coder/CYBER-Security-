import React, { useState } from 'react';
import { AlertCircle, Loader2, Play, Plus, X, ShieldAlert, ArrowRight, Activity } from 'lucide-react';
import { WhatIfSimulationResponse, ScenarioActionDTO, WhatIfSimulationRequest } from '../types/risk';
import { riskApi } from '../api/risk';
import { formatCurrency, formatCurrencyCompact } from '../utils/currency';

export const WhatIfSimulator: React.FC = () => {
  const [actions, setActions] = useState<ScenarioActionDTO[]>([]);
  
  // Current action builder state
  const [actionType, setActionType] = useState<'PATCH_VULNERABILITY' | 'IMPLEMENT_CONTROL' | 'ISOLATE_ASSET' | 'DECOMMISSION_ASSET'>('PATCH_VULNERABILITY');
  const [targetAssetId, setTargetAssetId] = useState('');
  const [targetCveId, setTargetCveId] = useState('');
  const [controlCode, setControlCode] = useState('');

  const [data, setData] = useState<WhatIfSimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddAction = () => {
    if (!targetAssetId.trim()) return;
    
    const newAction: ScenarioActionDTO = {
      actionType: actionType,
      targetAssetId: targetAssetId,
    };

    if (actionType === 'PATCH_VULNERABILITY') newAction.targetCveId = targetCveId;
    if (actionType === 'IMPLEMENT_CONTROL') newAction.controlCode = controlCode;
    
    setActions([...actions, newAction]);
    setTargetAssetId('');
    setTargetCveId('');
    setControlCode('');
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
        scenarioName: 'Custom UI Scenario',
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-text-primary flex items-center">
          <ShieldAlert className="w-6 h-6 mr-2 text-brand-primary" />
          What-If Simulator
        </h2>
      </div>
      <p className="text-xs text-text-secondary mb-6">
        Stage hypothetical interventions to model their impact on enterprise risk score and financial exposure.
      </p>

      {/* 1. SCENARIO BUILDER */}
      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-app-border bg-surface-secondary flex justify-between items-center">
          <h3 className="text-sm font-semibold text-text-primary">Scenario Builder</h3>
          <button 
            onClick={handleReset}
            className="text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            Reset Sandbox
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-start">
            <select 
              value={actionType}
              onChange={(e) => setActionType(e.target.value as any)}
              className="px-3 py-2 border border-app-border rounded-md text-sm text-text-primary bg-white focus:outline-none focus:border-brand-primary"
            >
              <option value="PATCH_VULNERABILITY">Patch CVE</option>
              <option value="IMPLEMENT_CONTROL">Implement Control</option>
              <option value="ISOLATE_ASSET">Isolate Asset</option>
              <option value="DECOMMISSION_ASSET">Decommission Asset</option>
            </select>
            
            <input 
              type="text" 
              placeholder="Target Asset ID"
              value={targetAssetId}
              onChange={(e) => setTargetAssetId(e.target.value)}
              className="flex-1 px-3 py-2 border border-app-border rounded-md text-sm text-text-primary focus:outline-none focus:border-brand-primary"
            />

            {actionType === 'PATCH_VULNERABILITY' && (
              <input 
                type="text" 
                placeholder="CVE ID (e.g. CVE-2023-1234)"
                value={targetCveId}
                onChange={(e) => setTargetCveId(e.target.value)}
                className="flex-1 px-3 py-2 border border-app-border rounded-md text-sm text-text-primary focus:outline-none focus:border-brand-primary"
              />
            )}

            {actionType === 'IMPLEMENT_CONTROL' && (
              <input 
                type="text" 
                placeholder="Control Code (e.g. AC-1)"
                value={controlCode}
                onChange={(e) => setControlCode(e.target.value)}
                className="flex-1 px-3 py-2 border border-app-border rounded-md text-sm text-text-primary focus:outline-none focus:border-brand-primary"
              />
            )}
            
            <button 
              onClick={handleAddAction}
              disabled={!targetAssetId.trim() || (actionType === 'PATCH_VULNERABILITY' && !targetCveId.trim()) || (actionType === 'IMPLEMENT_CONTROL' && !controlCode.trim())}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors h-[38px]"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Action
            </button>
          </div>

          <div className="space-y-2 mb-6">
            {actions.length === 0 ? (
              <p className="text-xs text-text-muted italic">No interventions staged. Add an action above.</p>
            ) : (
              actions.map((act, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <div className="text-sm">
                    <span className="font-semibold text-blue-900">{act.actionType.replace(/_/g, ' ')}</span>
                    <span className="text-blue-700 ml-2">Asset: {act.targetAssetId}</span>
                    {act.targetCveId && <span className="text-blue-700 ml-2">| CVE: {act.targetCveId}</span>}
                    {act.controlCode && <span className="text-blue-700 ml-2">| Control: {act.controlCode}</span>}
                  </div>
                  <button onClick={() => handleRemoveAction(idx)} className="text-blue-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <button 
            onClick={handleSimulate}
            disabled={actions.length === 0 || loading}
            className="w-full md:w-auto flex justify-center items-center px-6 py-3 bg-brand-primary text-white rounded-md text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            {loading ? "Simulating..." : "Run Simulation"}
          </button>
        </div>
      </div>

      {/* 2. RESULTS CONTAINER */}
      
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-4" />
          <p className="text-sm font-medium text-text-secondary">Evaluating interventions across enterprise graph...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-red-900 mb-2">Simulation Blocked</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {data && !loading && !error && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
             <h3 className="text-xl font-bold text-text-primary">Simulation Results</h3>
             <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded border border-green-200">
                Model v{data.modelVersion}
             </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Risk Score Delta */}
            <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-blue-600"/>
                  Enterprise Risk Score
                </h3>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xs text-text-muted uppercase mb-1">Baseline</p>
                  <p className="text-2xl font-bold text-text-primary line-through opacity-70">
                    {data.baselineAvgRiskScore !== null && data.baselineAvgRiskScore !== undefined
                      ? data.baselineAvgRiskScore.toFixed(2)
                      : 'N/A'}
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-300 mx-4" />
                <div className="text-center">
                  <p className="text-xs text-text-muted uppercase mb-1">Simulated</p>
                  <p className="text-2xl font-bold text-green-700">
                    {data.simulatedAvgRiskScore !== null && data.simulatedAvgRiskScore !== undefined
                      ? data.simulatedAvgRiskScore.toFixed(2)
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-app-border flex justify-between">
                <div>
                  <p className="text-xs text-text-muted">Reduction</p>
                  <p className="text-sm font-bold text-brand-primary">
                    {data.riskScoreDelta !== null && data.riskScoreDelta !== undefined
                      ? `-${data.riskScoreDelta.toFixed(2)}`
                      : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">% Improved</p>
                  <p className="text-sm font-bold text-green-600">
                    {data.riskReductionPct !== null && data.riskReductionPct !== undefined
                      ? `${data.riskReductionPct.toFixed(1)}%`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial EAL Delta */}
            <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center">
                  <ShieldAlert className="w-4 h-4 mr-2 text-purple-600"/>
                  Annualized Loss Expectancy (EAL)
                </h3>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xs text-text-muted uppercase mb-1">Baseline</p>
                  <p className="text-2xl font-bold text-text-primary line-through opacity-70">
                    {data.baselineTotalEal !== null && data.baselineTotalEal !== undefined
                      ? formatCurrencyCompact(data.baselineTotalEal, data.currency ?? null)
                      : 'NOT_AVAILABLE'}
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-300 mx-4" />
                <div className="text-center">
                  <p className="text-xs text-text-muted uppercase mb-1">Simulated</p>
                  <p className="text-2xl font-bold text-green-700">
                    {data.simulatedTotalEal !== null && data.simulatedTotalEal !== undefined
                      ? formatCurrencyCompact(data.simulatedTotalEal, data.currency ?? null)
                      : 'NOT_AVAILABLE'}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-app-border flex justify-between">
                <div>
                  <p className="text-xs text-text-muted">Saved Exposure</p>
                  <p className="text-sm font-bold text-brand-primary">
                    {data.ealDelta !== null && data.ealDelta !== undefined
                      ? formatCurrency(data.ealDelta, data.currency ?? null)
                      : 'NOT_AVAILABLE'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">% Improved</p>
                  <p className="text-sm font-bold text-green-600">
                    {data.ealReductionPct !== null && data.ealReductionPct !== undefined
                      ? `${data.ealReductionPct.toFixed(1)}%`
                      : 'NOT_AVAILABLE'}
                  </p>
                </div>
              </div>
            </div>

          </div>
          
          {/* Action Impacts Table */}
          {data.actionImpacts && data.actionImpacts.length > 0 && (
             <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden mt-6">
               <div className="px-6 py-4 border-b border-app-border bg-surface-secondary">
                 <h3 className="text-sm font-semibold text-text-primary">Impact Breakdown per Action</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-app-border">
                   <thead className="bg-app-surface">
                     <tr>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Action</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Asset</th>
                       <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Risk Score â¬‡</th>
                       <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">EAL â¬‡</th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-app-border">
                     {data.actionImpacts.map((impact, idx) => (
                       <tr key={idx} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                           {impact.summary}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                           {impact.targetAssetId}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-primary font-medium text-right">
                           {impact.riskScoreReduction !== null && impact.riskScoreReduction !== undefined
                             ? `-${impact.riskScoreReduction.toFixed(2)}`
                             : 'N/A'}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-700 font-medium text-right">
                           {impact.ealReduction !== null && impact.ealReduction !== undefined
                             ? `${impact.currency} ${impact.ealReduction.toLocaleString()}`
                             : 'NOT_AVAILABLE'}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}
        </div>
      )}

    </div>
  );
};
