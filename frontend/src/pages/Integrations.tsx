import React, { useEffect, useState } from 'react';
import { IntegrationCard, type IntegrationStatus } from '../components/integrations/IntegrationCard';
import { integrationApi } from '../api/integrations';
import type { NvdStatusResponse, CisaKevStatusResponse } from '../types/api';

export const Integrations: React.FC = () => {
  const [nvdData, setNvdData] = useState<NvdStatusResponse | null>(null);
  const [nvdLoading, setNvdLoading] = useState(true);
  const [nvdError, setNvdError] = useState<string | null>(null);

  const [cisaData, setCisaData] = useState<CisaKevStatusResponse | null>(null);
  const [cisaLoading, setCisaLoading] = useState(true);
  const [cisaError, setCisaError] = useState<string | null>(null);
  const [cisaSyncing, setCisaSyncing] = useState(false);

  const fetchNvd = async () => {
    try {
      setNvdLoading(true);
      setNvdError(null);
      const data = await integrationApi.getNvdStatus();
      setNvdData(data);
    } catch (err: any) {
      setNvdError(err.message || 'Failed to fetch NVD status');
    } finally {
      setNvdLoading(false);
    }
  };

  const fetchCisa = async () => {
    try {
      setCisaLoading(true);
      setCisaError(null);
      const data = await integrationApi.getCisaKevStatus();
      setCisaData(data);
    } catch (err: any) {
      setCisaError(err.message || 'Failed to fetch CISA KEV status');
    } finally {
      setCisaLoading(false);
    }
  };

  useEffect(() => {
    fetchNvd();
    fetchCisa();
  }, []);

  const handleCisaSync = async () => {
    try {
      setCisaSyncing(true);
      setCisaError(null);
      await integrationApi.syncCisaKev();
      // On success, refetch status
      await fetchCisa();
    } catch (err: any) {
      setCisaError(err.message || 'Failed to sync CISA KEV catalog');
    } finally {
      setCisaSyncing(false);
    }
  };

  const determineStatus = (enabled?: boolean, isStale?: boolean): IntegrationStatus => {
    if (enabled === false) return 'DISABLED';
    if (isStale) return 'STALE';
    if (enabled) return 'ENABLED';
    return 'ERROR'; // Fallback
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Integrations</h2>
        <p className="text-text-secondary mt-1 text-sm">
          Monitor the freshness and operational status of authoritative cybersecurity data sources.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NVD Integration Card */}
        <IntegrationCard
          sourceName="National Vulnerability Database (NVD)"
          provider="NIST"
          status={nvdError ? 'ERROR' : nvdData ? determineStatus(nvdData.enabled, nvdData.isStale) : 'ERROR'}
          lastSyncAt={nvdData?.lastSyncAt}
          dataAgeHours={nvdData?.dataAgeHours}
          recordCount={nvdData?.lastSuccessfulRun?.recordsInserted}
          sourceUrl={nvdData?.sourceUrl}
          isLoading={nvdLoading}
          error={nvdError}
        />

        {/* CISA KEV Integration Card */}
        <IntegrationCard
          sourceName="Known Exploited Vulnerabilities (KEV)"
          provider="CISA"
          status={cisaError && !cisaSyncing ? 'ERROR' : cisaData ? determineStatus(cisaData.enabled, cisaData.isStale) : 'ERROR'}
          lastSyncAt={cisaData?.lastSyncAt}
          dataAgeHours={cisaData?.dataAgeHours}
          recordCount={cisaData?.totalActiveKevCount}
          sourceUrl={cisaData?.sourceUrl}
          isLoading={cisaLoading && !cisaSyncing}
          error={cisaError}
          onSync={handleCisaSync}
          isSyncing={cisaSyncing}
        />
      </div>
    </div>
  );
};
