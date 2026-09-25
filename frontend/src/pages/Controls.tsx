import React, { useState, useEffect, useCallback } from 'react';
import { controlsApi } from '../api/controls';
import type { ControlsSummaryResponse } from '../types/api';
import { Shield, ShieldAlert, CheckCircle, HelpCircle, XCircle, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';

export const Controls: React.FC = () => {
  const [data, setData] = useState<ControlsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchControls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await controlsApi.getControlsSummary();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Unable to load security controls.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchControls();
  }, [fetchControls]);

  // Derived state
  const totalAssetsAssigned = data && data.controls.length > 0 
    ? Math.max(...data.controls.map(c => c.totalAssetsAssigned)) 
    : 0;
  const catalogCount = data?.totalCatalogControls || 0;

  return (
    <div className="space-y-6">
      {/* 1. Standard Header */}
      <StandardPageHeader
        title="Security Control Posture"
        purpose="Security controls describe which protections are implemented on each asset."
        steps={[
          'Review control catalog implementation status across enterprise assets',
          'Understand control assessment coverage percentages and implementation breakdowns',
          'Distinguish verified protections (Implemented) from unassessed posture (Unknown)'
        ]}
        dataOriginBadge="DEMO ENTERPRISE DATA"
      />

      {/* Inline Status Explanation Bar */}
      <div className="bg-app-surface border border-app-border rounded-lg p-4 shadow-2xs">
        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2 flex items-center">
          <Info className="w-4 h-4 mr-1.5 text-brand-primary" /> Control Status Definitions
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900">
            <span className="font-bold block flex items-center">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mr-1" /> IMPLEMENTED
            </span>
            <span className="text-emerald-800 text-[11px]">Verified present and fully operational on the asset.</span>
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900">
            <span className="font-bold block flex items-center">
              <Shield className="w-3.5 h-3.5 text-amber-600 mr-1" /> PARTIAL
            </span>
            <span className="text-amber-800 text-[11px]">Only partly implemented or partially effective.</span>
          </div>

          <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-900">
            <span className="font-bold block flex items-center">
              <XCircle className="w-3.5 h-3.5 text-red-600 mr-1" /> NOT IMPLEMENTED
            </span>
            <span className="text-red-800 text-[11px]">Assessed and verified to be missing or absent.</span>
          </div>

          <div className="p-2.5 bg-slate-100 border border-slate-300 rounded text-slate-900">
            <span className="font-bold block flex items-center text-slate-700">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 mr-1" /> UNKNOWN
            </span>
            <span className="text-slate-700 text-[11px]">Not yet assessed. <em>(Note: Unknown ≠ Not Implemented)</em>.</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-app-surface border border-app-border rounded-lg flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
          <AlertCircle className="w-12 h-12 text-risk-critical mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">Error Loading Controls</h3>
          <p className="text-sm text-text-secondary mb-6">{error}</p>
          <Button variant="outline" onClick={fetchControls}>
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        </div>
      ) : catalogCount === 0 ? (
        <div className="bg-app-surfaceSecondary border border-app-border rounded-lg flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
          <ShieldAlert className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-text-primary mb-2">No security controls found.</h3>
          <p className="text-sm text-text-secondary max-w-md mb-2">
            Why it is empty: Security control catalog definitions have not been registered.
          </p>
          <p className="text-xs text-brand-primary font-semibold">
            What to do next: Verify backend control seeding or reload.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Summary Section */}
          <div className="bg-app-surface border border-app-border shadow-2xs rounded-lg p-6 flex flex-col md:flex-row gap-8">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Catalog Size</p>
              <p className="text-3xl font-bold text-text-primary">{catalogCount} <span className="text-base font-normal text-text-secondary">controls</span></p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Asset Assignments</p>
              <p className="text-3xl font-bold text-text-primary">{totalAssetsAssigned} <span className="text-base font-normal text-text-secondary">assets</span></p>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Control Assessment Coverage Explanation</p>
              <p className="text-xs text-text-secondary max-w-md mt-1">
                Coverage represents the percentage of evaluated assets where the control is assessed as <strong>IMPLEMENTED</strong> or <strong>PARTIAL</strong>.
              </p>
            </div>
          </div>

          {/* Control Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data?.controls.map((control) => (
              <div key={control.code} className="bg-app-surface border border-app-border rounded-lg overflow-hidden flex flex-col shadow-2xs hover:border-brand-primary/30 transition-colors">
                <div className="p-6 border-b border-app-border relative">
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{control.name}</h3>
                      <p className="text-xs font-mono text-text-secondary mt-1">{control.code} • {control.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-text-primary">{control.coveragePercentage}%</span>
                      <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Assessed Coverage</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4 relative z-10">
                    <div className="w-full bg-app-surfaceSecondary rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-brand-primary h-2.5 rounded-full" 
                        style={{ width: `${control.coveragePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-app-surfaceSecondary p-6 flex-1">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Implementation Breakdown</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-risk-success" />
                      <span className="text-xs text-text-secondary">Implemented: <span className="font-bold text-text-primary">{control.implementedCount}</span></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-risk-warning" />
                      <span className="text-xs text-text-secondary">Partial: <span className="font-bold text-text-primary">{control.partialCount}</span></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-risk-critical" />
                      <span className="text-xs text-text-secondary">Not Implemented: <span className="font-bold text-text-primary">{control.notImplementedCount}</span></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <HelpCircle className="w-4 h-4 text-text-muted" />
                      <span className="text-xs text-text-secondary">Unknown (Unassessed): <span className="font-bold text-text-primary">{control.unknownCount}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 3. Standard Footer */}
      <StandardPageFooter
        resultMeaning="Security controls reduce risk scores when implemented. UNKNOWN controls provide zero mitigation credit but are tracked separately from verified NOT IMPLEMENTED gaps."
        nextStepTitle="Continue to Risk Overview"
        nextStepPath="/risk-overview"
        nextStepDescription="See how asset criticality, technical vulnerability severity, and control states combine into modeled risk scores."
      />
    </div>
  );
};
