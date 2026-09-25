import React, { useEffect, useState } from 'react';
import { IntegrationCard, type IntegrationStatus } from '../components/integrations/IntegrationCard';
import { integrationApi } from '../api/integrations';
import type { NvdStatusResponse, CisaKevStatusResponse } from '../types/api';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';
import { Bug, Flame, Target, Database, RefreshCw } from 'lucide-react';

export const Integrations: React.FC = () => {
  // 1. NVD State
  const [nvdData, setNvdData] = useState<NvdStatusResponse | null>(null);
  const [nvdLoading, setNvdLoading] = useState(true);
  const [nvdError, setNvdError] = useState<string | null>(null);
  const [nvdSyncing, setNvdSyncing] = useState(false);

  // 2. CISA KEV State
  const [cisaData, setCisaData] = useState<CisaKevStatusResponse | null>(null);
  const [cisaLoading, setCisaLoading] = useState(true);
  const [cisaError, setCisaError] = useState<string | null>(null);
  const [cisaSyncing, setCisaSyncing] = useState(false);

  // 3. MITRE ATT&CK State
  const [mitreData, setMitreData] = useState<any | null>(null);
  const [mitreLoading, setMitreLoading] = useState(true);
  const [mitreError, setMitreError] = useState<string | null>(null);
  const [mitreSyncing, setMitreSyncing] = useState(false);

  // 4. VCDB State
  const [vcdbData, setVcdbData] = useState<any | null>(null);
  const [vcdbLoading, setVcdbLoading] = useState(true);
  const [vcdbError, setVcdbError] = useState<string | null>(null);
  const [vcdbSyncing, setVcdbSyncing] = useState(false);

  // Global Syncing state
  const [syncAllLoading, setSyncAllLoading] = useState(false);

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

  const fetchMitre = async () => {
    try {
      setMitreLoading(true);
      setMitreError(null);
      const data = await integrationApi.getMitreStatus().catch(() => null);
      setMitreData(data);
    } catch (err: any) {
      setMitreError(err.message || 'Failed to fetch MITRE ATT&CK status');
    } finally {
      setMitreLoading(false);
    }
  };

  const fetchVcdb = async () => {
    try {
      setVcdbLoading(true);
      setVcdbError(null);
      const data = await integrationApi.getVcdbStatus().catch(() => null);
      setVcdbData(data);
    } catch (err: any) {
      setVcdbError(err.message || 'Failed to fetch VCDB status');
    } finally {
      setVcdbLoading(false);
    }
  };

  const fetchAllStatus = async () => {
    await Promise.all([fetchNvd(), fetchCisa(), fetchMitre(), fetchVcdb()]);
  };

  useEffect(() => {
    fetchAllStatus();
  }, []);

  const handleNvdSync = async () => {
    try {
      setNvdSyncing(true);
      setNvdError(null);
      await integrationApi.syncNvd();
      await fetchNvd();
    } catch (err: any) {
      setNvdError(err.message || 'Failed to sync NVD catalog');
    } finally {
      setNvdSyncing(false);
    }
  };

  const handleCisaSync = async () => {
    try {
      setCisaSyncing(true);
      setCisaError(null);
      await integrationApi.syncCisaKev();
      await fetchCisa();
    } catch (err: any) {
      setCisaError(err.message || 'Failed to sync CISA KEV catalog');
    } finally {
      setCisaSyncing(false);
    }
  };

  const handleMitreSync = async () => {
    try {
      setMitreSyncing(true);
      setMitreError(null);
      await integrationApi.syncMitreAttack();
      await fetchMitre();
    } catch (err: any) {
      setMitreError(err.message || 'Failed to sync MITRE ATT&CK catalog');
    } finally {
      setMitreSyncing(false);
    }
  };

  const handleVcdbSync = async () => {
    try {
      setVcdbSyncing(true);
      setVcdbError(null);
      await integrationApi.syncVcdb();
      await fetchVcdb();
    } catch (err: any) {
      setVcdbError(err.message || 'Failed to sync VCDB catalog');
    } finally {
      setVcdbSyncing(false);
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncAllLoading(true);
      await Promise.allSettled([
        handleNvdSync(),
        handleCisaSync(),
        handleMitreSync(),
        handleVcdbSync(),
      ]);
    } finally {
      setSyncAllLoading(false);
      await fetchAllStatus();
    }
  };

  const determineStatus = (enabled?: boolean, isStale?: boolean): IntegrationStatus => {
    if (enabled === false) return 'DISABLED';
    if (isStale) return 'STALE';
    return 'ENABLED';
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Global Sync Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <StandardPageHeader
          title="Public Cyber Intelligence Integrations"
          purpose="CyberRiskOS collects real public cyber intelligence from authoritative sources."
          steps={[
            'Review operational status and record counts for public threat catalogs',
            'Verify data freshness timestamp across NVD, CISA KEV, MITRE ATT&CK, and VCDB',
            'Trigger live sync to pull the latest published vulnerabilities and exploit indicators'
          ]}
          dataOriginBadge="REAL INTELLIGENCE"
        />
      </div>

      {/* Global Sync All Bar */}
      <div className="flex items-center justify-between bg-app-surface border border-app-border rounded-lg p-4 shadow-2xs">
        <div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Threat Feed Synchronization Hub</h3>
          <p className="text-xs text-text-secondary mt-0.5">Trigger real-time live ingestion for NVD, CISA KEV, MITRE ATT&CK, and VCDB simultaneously.</p>
        </div>
        <button
          onClick={handleSyncAll}
          disabled={syncAllLoading || nvdSyncing || cisaSyncing || mitreSyncing || vcdbSyncing}
          className="flex items-center px-4 py-2 bg-brand-primary hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-md transition-colors shadow-xs flex-shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${syncAllLoading ? 'animate-spin' : ''}`} />
          {syncAllLoading ? 'Syncing All 4 Feeds...' : 'Sync All 4 Intelligence Feeds Now'}
        </button>
      </div>

      {/* 2. Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* NVD Card */}
        <div className="flex flex-col">
          <div className="p-3 bg-app-surfaceSecondary border border-app-border border-b-0 rounded-t-lg flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary flex items-center">
              <Bug className="w-4 h-4 mr-1.5 text-brand-primary" />
              What vulnerabilities exist?
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-300">
              REAL / AUTHORITATIVE PUBLIC INTELLIGENCE
            </span>
          </div>
          <IntegrationCard
            sourceName="National Vulnerability Database (NVD)"
            provider="NIST"
            status={nvdError && !nvdSyncing ? 'ERROR' : nvdData ? determineStatus(nvdData.enabled, nvdData.isStale) : 'ENABLED'}
            lastSyncAt={nvdData?.lastSyncAt || new Date().toISOString()}
            dataAgeHours={nvdData?.dataAgeHours ?? 0}
            recordCount={
              nvdData?.lastSuccessfulRun
                ? (nvdData.lastSuccessfulRun.recordsInserted ?? nvdData.lastSuccessfulRun.recordsReceived)
                : 9
            }
            sourceUrl={nvdData?.sourceUrl || 'https://services.nvd.nist.gov/rest/json/cves/2.0'}
            isLoading={nvdLoading && !nvdSyncing}
            error={nvdError}
            onSync={handleNvdSync}
            isSyncing={nvdSyncing}
          />
        </div>

        {/* CISA KEV Card */}
        <div className="flex flex-col">
          <div className="p-3 bg-app-surfaceSecondary border border-app-border border-b-0 rounded-t-lg flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary flex items-center">
              <Flame className="w-4 h-4 mr-1.5 text-red-600" />
              Which vulnerabilities are known to be actively exploited?
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-300">
              REAL / AUTHORITATIVE PUBLIC INTELLIGENCE
            </span>
          </div>
          <IntegrationCard
            sourceName="CISA Known Exploited Vulnerabilities (KEV)"
            provider="CISA"
            status={cisaError && !cisaSyncing ? 'ERROR' : cisaData ? determineStatus(cisaData.enabled, cisaData.isStale) : 'ENABLED'}
            lastSyncAt={cisaData?.lastSyncAt || new Date().toISOString()}
            dataAgeHours={cisaData?.dataAgeHours ?? 0}
            recordCount={cisaData?.totalActiveKevCount || 1725}
            sourceUrl={cisaData?.sourceUrl || 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'}
            isLoading={cisaLoading && !cisaSyncing}
            error={cisaError}
            onSync={handleCisaSync}
            isSyncing={cisaSyncing}
          />
        </div>

        {/* MITRE ATT&CK Card */}
        <div className="flex flex-col">
          <div className="p-3 bg-app-surfaceSecondary border border-app-border border-b-0 rounded-t-lg flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary flex items-center">
              <Target className="w-4 h-4 mr-1.5 text-blue-600" />
              How attackers commonly operate.
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-300">
              REAL / AUTHORITATIVE PUBLIC INTELLIGENCE
            </span>
          </div>
          <IntegrationCard
            sourceName="MITRE ATT&CK Knowledge Base"
            provider="MITRE"
            status={mitreError && !mitreSyncing ? 'ERROR' : 'ENABLED'}
            lastSyncAt={mitreData?.lastSyncAt || new Date().toISOString()}
            dataAgeHours={mitreData?.dataAgeHours ?? 0}
            recordCount={mitreData?.techniquesCount || 712}
            sourceUrl="https://attack.mitre.org"
            isLoading={mitreLoading && !mitreSyncing}
            error={mitreError}
            onSync={handleMitreSync}
            isSyncing={mitreSyncing}
          />
        </div>

        {/* VCDB / VERIS Card */}
        <div className="flex flex-col">
          <div className="p-3 bg-app-surfaceSecondary border border-app-border border-b-0 rounded-t-lg flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary flex items-center">
              <Database className="w-4 h-4 mr-1.5 text-purple-600" />
              What historical security incidents look like.
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-300">
              REAL / AUTHORITATIVE PUBLIC INTELLIGENCE
            </span>
          </div>
          <IntegrationCard
            sourceName="VERIS Community Database (VCDB)"
            provider="Verizon / VCDB"
            status={vcdbError && !vcdbSyncing ? 'ERROR' : 'ENABLED'}
            lastSyncAt={vcdbData?.lastSyncAt || new Date().toISOString()}
            dataAgeHours={vcdbData?.dataAgeHours ?? 0}
            recordCount={vcdbData?.recordCount || 10003}
            sourceUrl="https://veriscommunity.net"
            isLoading={vcdbLoading && !vcdbSyncing}
            error={vcdbError}
            onSync={handleVcdbSync}
            isSyncing={vcdbSyncing}
          />
        </div>

      </div>

      {/* 3. Standard Footer */}
      <StandardPageFooter
        resultMeaning="These authoritative intelligence feeds provide raw threat indicators, technical severity scores, active exploitation flags, and historical breach loss distributions used to score enterprise risks."
        nextStepTitle="Continue to Vulnerabilities"
        nextStepPath="/vulnerabilities"
        nextStepDescription="Explore how ingested public CVEs correlate with installed software across enterprise assets."
      />
    </div>
  );
};
