import React, { useEffect, useState } from 'react';
import { integrationApi } from '../api/integrations';
import type { NvdStatusResponse, CisaKevStatusResponse } from '../types/api';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

type IntegrationStatus = 'ENABLED' | 'DISABLED' | 'STALE' | 'ERROR';

const StatusBadge: React.FC<{ status: IntegrationStatus }> = ({ status }) => {
  const map: Record<IntegrationStatus, { cls: string; label: string }> = {
    ENABLED:  { cls: 'gov-badge-green',  label: '● ENABLED' },
    DISABLED: { cls: 'gov-badge-red',    label: '● DISABLED' },
    STALE:    { cls: 'gov-badge-orange', label: '▲ STALE DATA' },
    ERROR:    { cls: 'gov-badge-red',    label: '✕ ERROR' },
  };
  const { cls, label } = map[status] || map.ERROR;
  return <span className={cls}>{label}</span>;
};

interface CardProps {
  sourceName: string;
  provider: string;
  status: IntegrationStatus;
  lastSyncAt?: string | null;
  dataAgeHours?: number | null;
  recordCount?: number | null;
  sourceUrl?: string | null;
  isLoading: boolean;
  error?: string;
  onSync?: () => void;
  isSyncing?: boolean;
}

const IntegrationCard: React.FC<CardProps> = ({
  sourceName, provider, status, lastSyncAt, dataAgeHours, recordCount,
  sourceUrl, isLoading, error, onSync, isSyncing
}) => (
  <div className="gov-panel">
    <div className="gov-panel-header">
      <div>
        <div className="gov-panel-title">{sourceName}</div>
        <div className="text-[10px] text-gov-textMuted mt-0.5">Provider: {provider}</div>
      </div>
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-gov-navy" />
      ) : (
        <StatusBadge status={status} />
      )}
    </div>

    <div className="p-4">
      {error && (
        <div className="gov-notice-error mb-3 flex items-center">
          <AlertCircle className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center space-x-2 text-gov-textMuted py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-[11px]">Fetching integration status...</span>
        </div>
      ) : (
        <table className="w-full text-[12px]" style={{ border: 'none' }}>
          <tbody>
            <tr>
              <td className="font-semibold text-gov-textMuted w-40 border-none py-1 px-0">Last Sync</td>
              <td className="border-none py-1 px-0">
                {lastSyncAt ? new Date(lastSyncAt).toLocaleString('en-IN') : <span className="text-gov-textMuted">—</span>}
              </td>
            </tr>
            <tr>
              <td className="font-semibold text-gov-textMuted border-none py-1 px-0">Data Age</td>
              <td className="border-none py-1 px-0">
                {dataAgeHours != null ? `${dataAgeHours.toFixed(1)} hours` : <span className="text-gov-textMuted">—</span>}
              </td>
            </tr>
            <tr>
              <td className="font-semibold text-gov-textMuted border-none py-1 px-0">Total Records</td>
              <td className="border-none py-1 px-0">
                {recordCount != null ? <strong>{recordCount.toLocaleString('en-IN')}</strong> : <span className="text-gov-textMuted">Not provided</span>}
              </td>
            </tr>
            {sourceUrl && (
              <tr>
                <td className="font-semibold text-gov-textMuted border-none py-1 px-0">Source Endpoint</td>
                <td className="border-none py-1 px-0">
                  <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
                     className="text-gov-navy underline text-[11px] break-all hover:text-gov-saffron">
                    {sourceUrl}
                  </a>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {onSync && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid #D0D7E3' }}>
          <button
            onClick={onSync}
            disabled={isSyncing || isLoading}
            className="gov-btn-primary flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Data Now'}
          </button>
        </div>
      )}
    </div>
  </div>
);

export const Integrations: React.FC = () => {
  const [nvdData, setNvdData] = useState<NvdStatusResponse | null>(null);
  const [nvdLoading, setNvdLoading] = useState(true);
  const [nvdError, setNvdError] = useState<string | null>(null);
  const [cisaData, setCisaData] = useState<CisaKevStatusResponse | null>(null);
  const [cisaLoading, setCisaLoading] = useState(true);
  const [cisaError, setCisaError] = useState<string | null>(null);
  const [cisaSyncing, setCisaSyncing] = useState(false);

  const fetchNvd = async () => {
    try { setNvdLoading(true); setNvdError(null); setNvdData(await integrationApi.getNvdStatus()); }
    catch (err: any) { setNvdError(err.message || 'Failed to fetch NVD status'); }
    finally { setNvdLoading(false); }
  };

  const fetchCisa = async () => {
    try { setCisaLoading(true); setCisaError(null); setCisaData(await integrationApi.getCisaKevStatus()); }
    catch (err: any) { setCisaError(err.message || 'Failed to fetch CISA KEV status'); }
    finally { setCisaLoading(false); }
  };

  const handleCisaSync = async () => {
    try { setCisaSyncing(true); setCisaError(null); await integrationApi.syncCisaKev(); await fetchCisa(); }
    catch (err: any) { setCisaError(err.message || 'Sync failed'); }
    finally { setCisaSyncing(false); }
  };

  useEffect(() => { fetchNvd(); fetchCisa(); }, []);

  const determineStatus = (enabled?: boolean, isStale?: boolean): IntegrationStatus => {
    if (enabled === false) return 'DISABLED';
    if (isStale) return 'STALE';
    if (enabled) return 'ENABLED';
    return 'ERROR';
  };

  return (
    <div>
      {/* Page heading */}
      <div className="mb-5 pb-3" style={{ borderBottom: '2px solid #003087' }}>
        <h2 className="text-[18px] font-bold text-gov-navy tracking-tight">Data Integrations</h2>
        <p className="text-[12px] text-gov-textMuted mt-1">
          Monitor the freshness and operational status of authoritative cybersecurity data sources.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <IntegrationCard
          sourceName="National Vulnerability Database (NVD)"
          provider="NIST"
          status={nvdError ? 'ERROR' : nvdData ? determineStatus(nvdData.enabled, nvdData.isStale) : 'ERROR'}
          lastSyncAt={nvdData?.lastSyncAt}
          dataAgeHours={nvdData?.dataAgeHours}
          recordCount={nvdData?.lastSuccessfulRun?.recordsInserted}
          sourceUrl={nvdData?.sourceUrl}
          isLoading={nvdLoading}
          error={nvdError ?? undefined}
        />
        <IntegrationCard
          sourceName="Known Exploited Vulnerabilities (KEV)"
          provider="CISA"
          status={cisaError && !cisaSyncing ? 'ERROR' : cisaData ? determineStatus(cisaData.enabled, cisaData.isStale) : 'ERROR'}
          lastSyncAt={cisaData?.lastSyncAt}
          dataAgeHours={cisaData?.dataAgeHours}
          recordCount={cisaData?.totalActiveKevCount}
          sourceUrl={cisaData?.sourceUrl}
          isLoading={cisaLoading && !cisaSyncing}
          error={cisaError ?? undefined}
          onSync={handleCisaSync}
          isSyncing={cisaSyncing}
        />
      </div>
    </div>
  );
};
