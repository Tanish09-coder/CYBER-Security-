import React from 'react';
import { Badge, type BadgeVariant } from '../common/Badge';
import { Button } from '../common/Button';
import { Skeleton } from '../common/Skeleton';
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

export type IntegrationStatus = 'ENABLED' | 'STALE' | 'SYNCING' | 'ERROR' | 'DISABLED';

export interface IntegrationCardProps {
  sourceName: string;
  provider: string;
  status: IntegrationStatus;
  lastSyncAt?: string | null;
  dataAgeHours?: number;
  recordCount?: number;
  sourceUrl?: string;
  isLoading?: boolean;
  error?: string | null;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  sourceName,
  provider,
  status,
  lastSyncAt,
  dataAgeHours,
  recordCount,
  sourceUrl,
  isLoading,
  error,
  onSync,
  isSyncing
}) => {
  if (isLoading) {
    return (
      <div className="bg-app-surface border border-app-border rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  const getStatusConfig = (s: IntegrationStatus): { variant: BadgeVariant; icon: React.ReactNode } => {
    switch (s) {
      case 'ENABLED': return { variant: 'success', icon: <CheckCircle2 className="w-3 h-3 mr-1" /> };
      case 'STALE': return { variant: 'warning', icon: <Clock className="w-3 h-3 mr-1" /> };
      case 'ERROR': return { variant: 'critical', icon: <AlertCircle className="w-3 h-3 mr-1" /> };
      case 'SYNCING': return { variant: 'info', icon: <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> };
      case 'DISABLED':
      default:
        return { variant: 'neutral', icon: null };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <div className="bg-app-surface border border-app-border rounded-lg p-6 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-text-primary">{sourceName}</h3>
          <p className="text-sm text-text-secondary">Provider: {provider}</p>
        </div>
        <Badge variant={statusConfig.variant}>
          {statusConfig.icon}
          {status}
        </Badge>
      </div>

      {error ? (
        <div className="flex-1 bg-risk-critical/5 border border-risk-critical/20 rounded p-4 text-sm text-risk-critical">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Unable to load integration status</p>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Last Sync</span>
              <span className="text-sm text-text-primary font-mono">
                {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'Never synced'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Data Age</span>
              <span className="text-sm text-text-primary">
                {dataAgeHours !== undefined && dataAgeHours !== null
                  ? `${dataAgeHours} hours`
                  : (!lastSyncAt ? 'Never synced' : '—')}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Total Records</span>
              <span className="text-sm text-text-primary font-mono">
                {recordCount !== undefined && recordCount !== null
                  ? recordCount.toLocaleString()
                  : (!lastSyncAt ? 'Never synced' : 'Not provided')}
              </span>
            </div>
          </div>

          {sourceUrl && (
            <div className="pt-2">
              <span className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Source Endpoint</span>
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-primary hover:underline break-all">
                {sourceUrl}
              </a>
            </div>
          )}
        </div>
      )}

      {onSync && (
        <div className="mt-6 pt-4 border-t border-app-border flex justify-end">
          <Button 
            variant="primary" 
            onClick={onSync} 
            disabled={isSyncing || status === 'SYNCING'}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              'Sync Data Now'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
