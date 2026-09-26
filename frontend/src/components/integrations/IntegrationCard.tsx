import React from 'react';
import { AlertCircle, CheckCircle2, Clock, RefreshCw, ExternalLink, Database, WifiOff } from 'lucide-react';

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
  questionLabel?: string;
  accentColor?: 'saffron' | 'navy' | 'green' | 'red';
  icon?: React.ReactNode;
}

const STATUS_CONFIG: Record<IntegrationStatus, {
  badgeClass: string;
  dotClass: string;
  label: string;
  icon: React.ReactNode;
}> = {
  ENABLED:  { badgeClass: 'gov-badge gov-badge-enabled', dotClass: 'online',  label: 'ENABLED',  icon: <CheckCircle2 size={11} /> },
  STALE:    { badgeClass: 'gov-badge gov-badge-stale',   dotClass: 'warn',    label: 'STALE',    icon: <Clock size={11} /> },
  ERROR:    { badgeClass: 'gov-badge gov-badge-critical',dotClass: 'offline', label: 'ERROR',    icon: <AlertCircle size={11} /> },
  SYNCING:  { badgeClass: 'gov-badge gov-badge-info',    dotClass: 'online',  label: 'SYNCING',  icon: <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> },
  DISABLED: { badgeClass: 'gov-badge',                   dotClass: 'offline', label: 'DISABLED', icon: <WifiOff size={11} /> },
};

const ACCENT_BORDER: Record<string, string> = {
  saffron: 'var(--saffron)',
  navy:    'var(--navy)',
  green:   'var(--india-green)',
  red:     'var(--red)',
};

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  sourceName, provider, status, lastSyncAt, dataAgeHours,
  recordCount, sourceUrl, isLoading, error, onSync, isSyncing,
  questionLabel, accentColor = 'saffron', icon,
}) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DISABLED;
  const accentBorder = ACCENT_BORDER[accentColor];

  if (isLoading) {
    return (
      <div className="gov-integration-card" style={{ borderTop: `3px solid ${accentBorder}` }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ height: 14, width: 200, background: 'var(--bg-light-blue)', borderRadius: 2, marginBottom: 8 }} />
          <div style={{ height: 11, width: 100, background: 'var(--bg-light-blue)', borderRadius: 2 }} />
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: 11, background: 'var(--bg-light-blue)', borderRadius: 2, width: i === 2 ? '60%' : '80%' }} />
          ))}
        </div>
      </div>
    );
  }

  const formattedDate = lastSyncAt
    ? new Date(lastSyncAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const ageDisplay = dataAgeHours !== undefined && dataAgeHours !== null
    ? dataAgeHours > 100 ? 'Historical' : `${dataAgeHours.toFixed(1)} hrs`
    : '—';

  const ageColor = dataAgeHours !== undefined
    ? dataAgeHours > 48 ? 'var(--red)' : dataAgeHours > 24 ? 'var(--amber)' : 'var(--india-green)'
    : 'var(--text-muted)';

  return (
    <div className="gov-integration-card" style={{ borderTop: `3px solid ${accentBorder}`, display: 'flex', flexDirection: 'column' }}>
      {/* Card header */}
      <div className="gov-integration-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            {questionLabel && (
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-body)' }}>
                {questionLabel}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ lineHeight: 0, color: accentBorder }}>{icon}</div>
            <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-dark)' }}>{sourceName}</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>Provider: {provider}</div>
        </div>

        {/* Status badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className={`gov-status-dot ${cfg.dotClass}`} />
            <span className={cfg.badgeClass} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="gov-integration-card-body" style={{ flex: 1 }}>
        {error ? (
          <div className="gov-alert gov-alert-red" style={{ margin: 0 }}>
            <div className="gov-alert-title">
              <AlertCircle size={14} /> Unable to Load Integration Status
            </div>
            <span style={{ fontSize: 12 }}>{error}</span>
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="gov-stat-row">
              <div className="gov-stat">
                <div className="gov-stat-label">Last Sync</div>
                <div className="gov-stat-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>{formattedDate}</div>
              </div>
              <div className="gov-stat">
                <div className="gov-stat-label">Data Age</div>
                <div className="gov-stat-value" style={{ color: ageColor }}>{ageDisplay}</div>
              </div>
            </div>

            {/* Record count — big number */}
            <div style={{
              background: 'var(--bg-light-blue)',
              border: '1px solid var(--border-light)',
              padding: '12px 14px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div className="gov-stat-label">Total Records</div>
                <div className="gov-stat-value big" style={{ color: accentBorder }}>
                  {recordCount !== undefined && recordCount !== null
                    ? recordCount.toLocaleString('en-IN')
                    : '—'}
                </div>
              </div>
              <Database size={28} color={accentBorder} opacity={0.2} />
            </div>

            {/* Source endpoint */}
            {sourceUrl && (
              <div className="gov-stat" style={{ marginBottom: 0 }}>
                <div className="gov-stat-label">Source Endpoint</div>
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="gov-source-link" style={{ marginTop: 4 }}>
                  <ExternalLink size={11} />
                  {sourceUrl}
                </a>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sync button */}
      {onSync && (
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'var(--bg-page)',
        }}>
          <button
            className="gov-btn gov-btn-primary"
            onClick={onSync}
            disabled={isSyncing}
            style={{ opacity: isSyncing ? 0.7 : 1, fontSize: 12, padding: '7px 16px' }}
          >
            <RefreshCw size={12} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
            {isSyncing ? 'Syncing...' : 'Sync Data Now'}
          </button>
        </div>
      )}
    </div>
  );
};
