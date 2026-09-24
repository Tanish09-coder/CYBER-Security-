import React, { useState } from 'react';
import { AlertCircle, Loader2, Play, Plus, X, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';
import { WhatIfSimulationResponse, SimulationIntervention, WhatIfSimulationRequest } from '../types/risk';
import { riskApi } from '../api/risk';

export const WhatIfSimulator: React.FC = () => {
  const [interventions, setInterventions] = useState<SimulationIntervention[]>([]);
  
  // Current intervention builder state
  const [actionType, setActionType] = useState('PATCH_CVE');
  const [targetId, setTargetId] = useState('');

  const [data, setData] = useState<WhatIfSimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddIntervention = () => {
    if (!targetId.trim()) return;
    
    const newIntervention: SimulationIntervention = {
      action_type: actionType,
    };

    if (actionType === 'PATCH_CVE') newIntervention.target_cve_id = targetId;
    else if (actionType === 'ENABLE_CONTROL') newIntervention.target_control_code = targetId;
    else if (actionType === 'SEGMENT_NETWORK') newIntervention.target_asset_id = targetId;
    
    setInterventions([...interventions, newIntervention]);
    setTargetId('');
  };

  const handleRemoveIntervention = (index: number) => {
    setInterventions(interventions.filter((_, i) => i !== index));
  };

  const handleSimulate = async () => {
    if (interventions.length === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      setData(null);

      const request: WhatIfSimulationRequest = {
        organization_id: 'org-default',
        baseline_request: {
          organization_id: 'org-default',
          financial_parameters: { 
            hourly_downtime_cost: 0, 
            hourly_recovery_rate: 0, 
            cost_per_sensitive_record: 0, 
            regulatory_breach_penalty: 0, 
            daily_transaction_volume: 0 
          },
          assets: [] // Baseline uses current real assets in a real implementation
        },
        interventions: interventions
      };

      const response = await riskApi.simulateWhatIf(request);
      setData(response);
    } catch (err: any) {
      setError(err.message || "Failed to execute simulation.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInterventions([]);
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
        Stage hypothetical interventions to model their impact on enterprise financial exposure.
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
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <select 
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="px-3 py-2 border border-app-border rounded-md text-sm text-text-primary bg-white focus:outline-none focus:border-brand-primary"
            >
              <option value="PATCH_CVE">Patch CVE</option>
              <option value="ENABLE_CONTROL">Enable Security Control</option>
              <option value="SEGMENT_NETWORK">Segment Asset</option>
            </select>
            
            <input 
              type="text" 
              placeholder={actionType === 'PATCH_CVE' ? "Enter CVE-ID (e.g. CVE-2023-1234)" : "Enter Target ID"}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="flex-1 px-3 py-2 border border-app-border rounded-md text-sm text-text-primary focus:outline-none focus:border-brand-primary"
            />
            
            <button 
              onClick={handleAddIntervention}
              disabled={!targetId.trim()}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Intervention
            </button>
          </div>

          <div className="space-y-2 mb-6">
            {interventions.length === 0 ? (
              <p className="text-xs text-text-muted italic">No interventions staged. Add an action above.</p>
            ) : (
              interventions.map((inv, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <div className="text-sm">
                    <span className="font-semibold text-blue-900">{inv.action_type.replace('_', ' ')}</span>
                    <span className="text-blue-700 ml-2">Target: {inv.target_cve_id || inv.target_control_code || inv.target_asset_id}</span>
                  </div>
                  <button onClick={() => handleRemoveIntervention(idx)} className="text-blue-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <button 
            onClick={handleSimulate}
            disabled={interventions.length === 0 || loading}
            className="w-full md:w-auto flex justify-center items-center px-6 py-3 bg-brand-primary text-white rounded-md text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            {loading ? "Simulating..." : "Run Simulation"}
          </button>
        </div>
      </div>

      {/* 2. RESULTS CONTAINER */}
      
      {/* LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-4" />
          <p className="text-sm font-medium text-text-secondary">Evaluating interventions across enterprise graph...</p>
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-red-900 mb-2">Simulation Blocked</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* POPULATED STATE (includes INCOMPLETE DATA banner) */}
      {data && !loading && !error && (
        <div className="space-y-6">
          
          {/* INCOMPLETE DATA BANNER */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md shadow-sm">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">Incomplete Data: Risk Score Delta Missing</h3>
                <p className="text-xs text-amber-800 mt-1">
                  The backend contract provides financial exposure deltas, but the required <strong>enterprise risk score delta</strong> is missing from <code>WhatIfSimulationResponse</code>. Consequently, only financial impact is displayed. (See dependency request <strong>NISHIT-007</strong>).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-app-surface border border-app-border p-6 rounded-lg shadow-sm text-center">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Baseline Exposure</h3>
              <p className="text-3xl font-bold text-text-primary line-through opacity-70">
                {data.organization_id ? "INR " : ""}{data.baseline_exposure.toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center justify-center">
              <ArrowRight className="w-10 h-10 text-gray-300" />
            </div>
            
            <div className="bg-app-surface border border-green-200 bg-green-50/30 p-6 rounded-lg shadow-sm text-center">
              <h3 className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-2">Simulated Exposure</h3>
              <p className="text-3xl font-bold text-green-700">
                {data.organization_id ? "INR " : ""}{data.simulated_exposure.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Modeled Risk Reduction</h3>
              <p className="text-2xl font-bold text-text-primary text-brand-primary">
                INR {data.modeled_risk_reduction.toLocaleString()}
              </p>
            </div>
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Reduction Percentage</h3>
              <p className="text-2xl font-bold text-text-primary">
                {data.modeled_reduction_percentage.toFixed(1)}%
              </p>
            </div>
          </div>
          
          {data.affected_assets.length > 0 && (
             <div className="bg-app-surface border border-app-border rounded-lg shadow-sm p-5">
               <h3 className="text-sm font-semibold text-text-primary mb-3">Affected Assets</h3>
               <div className="flex flex-wrap gap-2">
                 {data.affected_assets.map(assetId => (
                   <span key={assetId} className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-medium text-gray-700">
                     {assetId}
                   </span>
                 ))}
               </div>
             </div>
          )}
        </div>
      )}

    </div>
  );
};

