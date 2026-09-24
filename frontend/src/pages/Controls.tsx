import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { controlsApi } from '../api/controls';
import type { ControlsSummaryResponse } from '../types/api';
import { Shield, ShieldAlert, CheckCircle, HelpCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';

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
  const isZeroAssets = totalAssetsAssigned === 0 && catalogCount > 0;

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Security Controls</h1>
          <p className="text-sm text-text-secondary mt-1">
            Control catalog coverage and implementation status based on backend assessment data.
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-app-surface border border-app-border rounded-lg flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
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
        <div className="bg-app-surfaceSecondary border border-app-border rounded-lg flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
          <ShieldAlert className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No security controls are currently available.</h3>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Summary Section */}
          <div className="bg-app-surface border border-app-border shadow-sm rounded-lg p-6 flex flex-col md:flex-row gap-8">
            <div>
              <p className="text-sm font-bold text-text-muted uppercase tracking-widest mb-1">Catalog Size</p>
              <p className="text-3xl font-bold text-text-primary">{catalogCount} <span className="text-xl font-normal text-text-secondary">controls</span></p>
            </div>
            <div>
              <p className="text-sm font-bold text-text-muted uppercase tracking-widest mb-1">Asset Assignments</p>
              <p className="text-3xl font-bold text-text-primary">{totalAssetsAssigned} <span className="text-xl font-normal text-text-secondary">assets</span></p>
            </div>
          </div>

          {/* Zero Asset Notice */}
          {isZeroAssets && (
            <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-4 flex items-start shadow-sm">
              <Shield className="w-5 h-5 text-brand-primary mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-brand-primary">Coverage Pending Asset Assignment</h4>
                <p className="text-sm text-text-secondary mt-1">
                  No assets are currently assigned to these controls. Coverage will populate as control assessments are associated with enterprise assets.
                </p>
              </div>
            </div>
          )}

          {/* Control Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data?.controls.map((control) => (
              <div key={control.code} className="bg-app-surface border border-app-border rounded-lg overflow-hidden flex flex-col shadow-sm hover:border-brand-primary/30 transition-colors">
                <div className="p-6 border-b border-app-border relative">
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{control.name}</h3>
                      <p className="text-xs font-mono text-text-secondary mt-1">{control.code} • {control.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-text-primary">{control.coveragePercentage}%</span>
                      <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Coverage</p>
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
                      <span className="text-sm text-text-secondary">Implemented: <span className="font-medium text-text-primary">{control.implementedCount}</span></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-risk-warning" />
                      <span className="text-sm text-text-secondary">Partial: <span className="font-medium text-text-primary">{control.partialCount}</span></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-risk-critical" />
                      <span className="text-sm text-text-secondary">Not Implemented: <span className="font-medium text-text-primary">{control.notImplementedCount}</span></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <HelpCircle className="w-4 h-4 text-text-muted" />
                      <span className="text-sm text-text-secondary">Unknown: <span className="font-medium text-text-primary">{control.unknownCount}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </PageContainer>
  );
};
