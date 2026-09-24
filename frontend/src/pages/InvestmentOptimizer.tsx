import React, { useState } from 'react';
import { AlertCircle, Loader2, Play, CheckCircle, TrendingUp, ShieldAlert, BarChart3 } from 'lucide-react';
import { OptimizerResponse, SecurityInitiative, OptimizerRequest } from '../types/risk';
import { riskApi } from '../api/risk';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

const DEFAULT_CANDIDATE_INITIATIVES: SecurityInitiative[] = [
  { initiative_id: 'INIT-001', name: 'Deploy EDR on all Tier 1 Servers', cost: 150000, affected_asset_ids: ['ASSET-1', 'ASSET-2'], target_control_code: 'CTL-EDR', target_control_status: 'IMPLEMENTED' },
  { initiative_id: 'INIT-002', name: 'Network Segmentation for PCI Zone', cost: 200000, affected_asset_ids: ['ASSET-3'], target_control_code: 'CTL-SEG', target_control_status: 'IMPLEMENTED' },
  { initiative_id: 'INIT-003', name: 'MFA Enforcement across VPN', cost: 50000, affected_asset_ids: ['ASSET-ALL'], target_control_code: 'CTL-MFA', target_control_status: 'IMPLEMENTED' },
  { initiative_id: 'INIT-004', name: 'Patch Critical CVEs on DB Cluster', cost: 25000, affected_asset_ids: ['ASSET-2'], target_control_code: 'CTL-PTC', target_control_status: 'IMPLEMENTED' },
];

export const InvestmentOptimizer: React.FC = () => {
  const [budget, setBudget] = useState<number>(300000);
  const [selectedInitiatives, setSelectedInitiatives] = useState<Set<string>>(new Set(DEFAULT_CANDIDATE_INITIATIVES.map(i => i.initiative_id)));
  
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
        organization_id: 'org-default',
        available_budget: budget,
        baseline_request: {
          organization_id: 'org-default',
          financial_parameters: { 
            hourly_downtime_cost: 0, 
            hourly_recovery_rate: 0, 
            cost_per_sensitive_record: 0, 
            regulatory_breach_penalty: 0, 
            daily_transaction_volume: 0 
          },
          assets: [] 
        },
        candidate_initiatives: DEFAULT_CANDIDATE_INITIATIVES.filter(i => selectedInitiatives.has(i.initiative_id))
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
        Allocate your cybersecurity budget efficiently by identifying the optimal combination of security initiatives to maximize Return on Security Investment (ROSI).
      </p>

      {/* 1. OPTIMIZER INPUTS */}
      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-app-border bg-surface-secondary">
          <h3 className="text-sm font-semibold text-text-primary">Optimization Constraints</h3>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-2">Available Budget (INR)</label>
            <input 
              type="number" 
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full md:w-1/3 px-3 py-2 border border-app-border rounded-md text-sm text-text-primary focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-2">Candidate Initiatives</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DEFAULT_CANDIDATE_INITIATIVES.map(initiative => (
                <div 
                  key={initiative.initiative_id}
                  onClick={() => toggleInitiative(initiative.initiative_id)}
                  className={`p-3 border rounded-md cursor-pointer flex items-start transition-colors ${selectedInitiatives.has(initiative.initiative_id) ? 'border-brand-primary bg-blue-50/30' : 'border-app-border bg-white hover:bg-gray-50'}`}
                >
                  <div className="mt-0.5 mr-3">
                    {selectedInitiatives.has(initiative.initiative_id) ? (
                      <CheckCircle className="w-4 h-4 text-brand-primary" />
                    ) : (
                      <div className="w-4 h-4 border border-gray-300 rounded-full" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">{initiative.name}</h4>
                    <p className="text-xs text-text-muted mt-1">Cost: INR {initiative.cost.toLocaleString()}</p>
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
            {loading ? "Calculating..." : "Run Optimizer"}
          </button>
        </div>
      </div>

      {/* 2. RESULTS CONTAINER */}
      
      {/* LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-4" />
          <p className="text-sm font-medium text-text-secondary">Simulating thousands of investment combinations...</p>
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-red-900 mb-2">Optimizer Unavailable</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* POPULATED STATE */}
      {data && !loading && !error && (
        <div className="space-y-8">
          
          <div>
             <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
               <ShieldAlert className="w-5 h-5 mr-2 text-text-secondary" /> 
               Recommended Strategies
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.strategies.map((strategy, idx) => (
                  <div key={idx} className={`bg-app-surface border rounded-lg shadow-sm overflow-hidden flex flex-col ${idx === 0 ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-app-border'}`}>
                    <div className={`px-4 py-3 border-b ${idx === 0 ? 'bg-blue-50 border-brand-primary/20' : 'bg-surface-secondary border-app-border'}`}>
                      <h4 className="text-sm font-bold text-text-primary">{strategy.strategy_label}</h4>
                    </div>
                    <div className="p-4 flex-grow space-y-4">
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Cost</p>
                        <p className="text-xl font-semibold text-text-primary">INR {strategy.total_cost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Risk Reduction</p>
                        <p className="text-xl font-semibold text-green-600">INR {strategy.modeled_exposure_reduction.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">ROSI</p>
                        <p className="text-xl font-bold text-brand-primary">{strategy.rosi_percentage.toFixed(1)}%</p>
                      </div>
                      <div className="pt-2 border-t border-app-border">
                        <p className="text-xs font-medium text-text-primary mb-2">Included Initiatives:</p>
                        <ul className="text-xs text-text-secondary space-y-1">
                          {strategy.selected_initiative_ids.map(id => {
                            const init = DEFAULT_CANDIDATE_INITIATIVES.find(i => i.initiative_id === id);
                            return <li key={id}>• {init ? init.name : id}</li>;
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {data.diminishing_returns_curve && data.diminishing_returns_curve.length > 0 && (
            <div className="bg-app-surface border border-app-border rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-bold text-text-primary mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-text-secondary" />
                Diminishing Returns Curve (Cost vs Risk Reduction)
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.diminishing_returns_curve}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="cost" 
                      tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
                      style={{ fontSize: '12px', fill: '#6B7280' }}
                    />
                    <YAxis 
                      tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
                      style={{ fontSize: '12px', fill: '#6B7280' }}
                    />
                    <RechartsTooltip 
                      formatter={(value: number) => [`INR ${value.toLocaleString()}`, '']}
                      labelFormatter={(label: number) => `Cost: INR ${label.toLocaleString()}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="reduction" 
                      name="Exposure Reduction" 
                      stroke="#2563EB" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#2563EB' }}
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
};
