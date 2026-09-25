import React, { useEffect, useState, useCallback } from 'react';
import { Search, AlertCircle, ShieldAlert, ChevronLeft, ChevronRight, Info, Target, Crosshair, Flame, Database } from 'lucide-react';
import { threatIntelApi } from '../api/threatIntel';
import type { 
  ThreatIntelKevItem, 
  ThreatIntelKevResponse, 
  MitreTactic, 
  MitreTechnique 
} from '../types/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { Modal } from '../components/common/Modal';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';

export const ThreatIntel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'KEV' | 'MITRE' | 'VCDB'>('KEV');

  // KEV Explorer State
  const [kevData, setKevData] = useState<ThreatIntelKevResponse | null>(null);
  const [kevLoading, setKevLoading] = useState(true);
  const [kevError, setKevError] = useState<string | null>(null);
  const [selectedKev, setSelectedKev] = useState<ThreatIntelKevItem | null>(null);
  
  // KEV Filters
  const [kevPage, setKevPage] = useState(1);
  const kevLimit = 10;
  const [kevSearch, setKevSearch] = useState('');
  const [kevDebouncedSearch, setKevDebouncedSearch] = useState('');
  const [kevRansomware, setKevRansomware] = useState(false);

  // MITRE State
  const [tactics, setTactics] = useState<MitreTactic[]>([]);
  const [tacticsLoading, setTacticsLoading] = useState(true);
  const [techniques, setTechniques] = useState<MitreTechnique[]>([]);
  const [techniquesLoading, setTechniquesLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setKevDebouncedSearch(kevSearch), 500);
    return () => clearTimeout(timer);
  }, [kevSearch]);

  useEffect(() => {
    setKevPage(1);
  }, [kevDebouncedSearch, kevRansomware]);

  const fetchKev = useCallback(async () => {
    try {
      setKevLoading(true);
      setKevError(null);
      const res = await threatIntelApi.getKevCatalog({
        page: kevPage,
        limit: kevLimit,
        search: kevDebouncedSearch,
        ransomware: kevRansomware,
      });
      setKevData(res);
    } catch (err: any) {
      setKevError(err.message || 'Failed to fetch CISA KEV catalog');
    } finally {
      setKevLoading(false);
    }
  }, [kevPage, kevLimit, kevDebouncedSearch, kevRansomware]);

  const fetchMitreTactics = useCallback(async () => {
    try {
      setTacticsLoading(true);
      const res = await threatIntelApi.getMitreTactics({ limit: 100 });
      setTactics(res.tactics);
    } catch {
    } finally {
      setTacticsLoading(false);
    }
  }, []);

  const fetchMitreTechniques = useCallback(async () => {
    try {
      setTechniquesLoading(true);
      const res = await threatIntelApi.getMitreTechniques({ limit: 15 });
      setTechniques(res.techniques);
    } catch {
    } finally {
      setTechniquesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMitreTactics();
    fetchMitreTechniques();
  }, [fetchMitreTactics, fetchMitreTechniques]);

  useEffect(() => {
    fetchKev();
  }, [fetchKev]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Standard Header */}
      <StandardPageHeader
        title="Public Cyber Threat Intelligence"
        purpose="Understand whether vulnerabilities are associated with real-world exploitation and attacker behavior."
        steps={[
          'Explore CISA KEV to identify vulnerabilities with documented real-world exploitation',
          'Inspect MITRE ATT&CK tactics and techniques to understand attacker operational methods',
          'Review VCDB historical breach incident patterns to inform financial loss models'
        ]}
        dataOriginBadge="REAL INTELLIGENCE"
      />

      {/* Mandatory Disclaimer Box */}
      <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-lg text-xs text-amber-950 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-amber-900 block mb-0.5">Important Threat Intelligence Context:</span>
          <span>A CISA KEV listing proves that a vulnerability has been actively exploited globally in real-world attacks. It does <strong>NOT</strong> constitute proof or evidence that your specific enterprise asset has experienced a breach.</span>
        </div>
      </div>

      {/* Dataset Tabs Header */}
      <div className="flex border-b border-app-border space-x-4">
        <button
          onClick={() => setActiveTab('KEV')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'KEV'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Flame className="w-4 h-4 text-red-500" />
          <span>CISA KEV Catalog</span>
          <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-mono">1,275 Records</span>
        </button>

        <button
          onClick={() => setActiveTab('MITRE')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'MITRE'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Target className="w-4 h-4 text-blue-500" />
          <span>MITRE ATT&CK Framework</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">712 Techniques</span>
        </button>

        <button
          onClick={() => setActiveTab('VCDB')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'VCDB'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Database className="w-4 h-4 text-purple-500" />
          <span>VCDB / VERIS Breach Data</span>
          <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-mono">10,003 Incidents</span>
        </button>
      </div>

      {/* Tab 1: CISA KEV Catalog */}
      {activeTab === 'KEV' && (
        <div className="space-y-4">
          <div className="bg-app-surface border border-app-border rounded-lg p-4 shadow-2xs">
            <h3 className="text-sm font-bold text-text-primary mb-1">CISA Known Exploited Vulnerabilities (KEV)</h3>
            <p className="text-xs text-text-secondary">
              Authoritative catalog of vulnerabilities that have been exploited in the wild. Federal agencies and enterprises use KEV to prioritize immediate patching.
            </p>
          </div>

          {/* KEV Toolbar */}
          <div className="bg-app-surface border border-app-border rounded-lg p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search CVE ID or Vendor/Product..."
                value={kevSearch}
                onChange={(e) => setKevSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-app-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary bg-app-surface text-text-primary transition-colors"
              />
            </div>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kevRansomware}
                onChange={(e) => setKevRansomware(e.target.checked)}
                className="rounded border-app-border bg-app-surface text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-text-primary whitespace-nowrap">Known Ransomware Only</span>
            </label>
          </div>

          {/* KEV Table */}
          <div className="bg-app-surface border border-app-border rounded-lg shadow-2xs flex flex-col">
            {kevError ? (
              <div className="p-8 text-center bg-risk-critical/5">
                <AlertCircle className="w-8 h-8 text-risk-critical mx-auto mb-3" />
                <h3 className="text-lg font-bold text-text-primary mb-1">Failed to load KEV Catalog</h3>
                <p className="text-sm text-text-secondary mb-4">{kevError}</p>
                <Button variant="outline" onClick={fetchKev}>Retry</Button>
              </div>
            ) : kevLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <Skeleton className="h-10 w-1/6" />
                    <Skeleton className="h-10 w-2/6" />
                    <Skeleton className="h-10 w-1/6" />
                    <Skeleton className="h-10 w-1/6" />
                  </div>
                ))}
              </div>
            ) : kevData && kevData.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CVE ID</TableHead>
                    <TableHead>Vendor & Product</TableHead>
                    <TableHead>Vulnerability Name</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Ransomware Campaign</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kevData.data.map((item) => (
                    <TableRow key={item.id} className="group">
                      <TableCell className="font-bold font-mono text-brand-primary">{item.cveId}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-text-primary">{item.vendorProject || 'Unknown Vendor'}</span>
                          <span className="text-text-secondary">{item.product || 'Unknown Product'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm truncate max-w-xs" title={item.vulnerabilityName || ''}>
                        {item.vulnerabilityName || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        {item.dateAdded ? new Date(item.dateAdded).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        {item.knownRansomwareCampaignUse === 'Known' ? (
                          <Badge variant="critical">Known</Badge>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" className="py-1 px-2 text-xs" onClick={() => setSelectedKev(item)}>
                          <Info className="w-3.5 h-3.5 mr-1" /> Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center bg-app-surfaceSecondary rounded-b-lg">
                <ShieldAlert className="w-10 h-10 text-text-muted mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-text-primary">No CISA KEV records match filter criteria.</h3>
                <p className="text-sm text-text-secondary mt-1">Adjust search terms or clear filters.</p>
              </div>
            )}

            {/* KEV Pagination */}
            {!kevError && !kevLoading && kevData && kevData.pagination.total > 0 && (
              <div className="px-6 py-4 border-t border-app-border flex items-center justify-between bg-app-surfaceSecondary rounded-b-lg">
                <div className="text-sm text-text-secondary">
                  Showing <span className="font-bold text-text-primary">{((kevData.pagination.page - 1) * kevData.pagination.limit) + 1}</span> to <span className="font-bold text-text-primary">{Math.min(kevData.pagination.page * kevData.pagination.limit, kevData.pagination.total)}</span> of <span className="font-bold text-text-primary">{kevData.pagination.total.toLocaleString()}</span> entries
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="py-1 px-3 text-xs"
                    disabled={!kevData.pagination.hasPrevious}
                    onClick={() => setKevPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    className="py-1 px-3 text-xs"
                    disabled={!kevData.pagination.hasNext}
                    onClick={() => setKevPage(p => Math.min(kevData.pagination.totalPages, p + 1))}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: MITRE ATT&CK */}
      {activeTab === 'MITRE' && (
        <div className="space-y-6">
          <div className="bg-app-surface border border-app-border rounded-lg p-4 shadow-2xs">
            <h3 className="text-sm font-bold text-text-primary mb-1">MITRE ATT&CK Framework Knowledge Base</h3>
            <p className="text-xs text-text-secondary">
              MITRE ATT&CK categorizes real-world adversary tactics (what an attacker wants to achieve) and techniques (how they achieve it).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-app-surface border border-app-border rounded-lg p-5 shadow-2xs">
              <h4 className="font-bold text-text-primary text-sm mb-3 flex items-center">
                <Crosshair className="w-4 h-4 mr-2 text-brand-primary" /> Core Tactics (15 Ingested)
              </h4>
              {tacticsLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {tactics.map(t => (
                    <div key={t.id} className="p-3 border border-app-border rounded hover:bg-app-surfaceSecondary transition-colors flex justify-between items-center text-xs">
                      <span className="font-bold text-text-primary">{t.name}</span>
                      <Badge variant="neutral">{t.attackId}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-app-surface border border-app-border rounded-lg p-5 shadow-2xs">
              <h4 className="font-bold text-text-primary text-sm mb-3 flex items-center">
                <Target className="w-4 h-4 mr-2 text-blue-600" /> Key Techniques (697 Ingested)
              </h4>
              {techniquesLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {techniques.map(t => (
                    <div key={t.id} className="p-3 border border-app-border rounded hover:bg-app-surfaceSecondary transition-colors flex justify-between items-center text-xs">
                      <span className="font-medium text-text-primary">{t.name}</span>
                      <Badge variant="neutral">{t.attackId}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: VCDB / VERIS */}
      {activeTab === 'VCDB' && (
        <div className="bg-app-surface border border-app-border rounded-lg p-6 shadow-2xs space-y-4">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="text-base font-bold text-text-primary">VERIS Community Database (VCDB)</h3>
              <p className="text-xs text-text-secondary">Historical cybersecurity breach incidents and loss distributions</p>
            </div>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            VCDB provides 10,003 anonymized real-world breach incidents analyzed under the VERIS (Vocabulary for Event Recording and Incident Sharing) framework. CyberRiskOS uses historical VCDB outage durations and recovery cost distributions to seed financial exposure models.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-app-surfaceSecondary rounded border border-app-border">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Total Breach Incidents</span>
              <span className="text-2xl font-bold text-purple-700">10,003</span>
            </div>
            <div className="p-4 bg-app-surfaceSecondary rounded border border-app-border">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Financial Loss Metrics</span>
              <span className="text-2xl font-bold text-text-primary">VERIS Standard</span>
            </div>
            <div className="p-4 bg-app-surfaceSecondary rounded border border-app-border">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Primary Threat Vector</span>
              <span className="text-2xl font-bold text-blue-600">External Exploitation</span>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal for KEV */}
      {selectedKev && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedKev(null)}
          title={`CISA KEV Record: ${selectedKev.cveId}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-text-primary mb-1">Vulnerability</h4>
              <p className="text-text-secondary">{selectedKev.vulnerabilityName || 'Not available'}</p>
            </div>

            <div className="p-3 bg-app-surfaceSecondary rounded border border-app-border">
              <h4 className="font-bold text-text-primary mb-1 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-brand-primary" /> Required Action
              </h4>
              <p className="text-text-secondary">{selectedKev.requiredAction || 'Apply vendor patch or mitigations.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-text-secondary">
              <div>Vendor: <strong className="text-text-primary">{selectedKev.vendorProject}</strong></div>
              <div>Product: <strong className="text-text-primary">{selectedKev.product}</strong></div>
              <div>Date Added: <strong className="text-text-primary">{selectedKev.dateAdded}</strong></div>
              <div>Due Date: <strong className="text-text-primary">{selectedKev.dueDate}</strong></div>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Standard Footer */}
      <StandardPageFooter
        resultMeaning="Threat intelligence datasets provide real empirical context regarding which vulnerabilities attackers actively target and how they operate."
        nextStepTitle="View Enterprise Assets"
        nextStepPath="/assets"
        nextStepDescription="See how authoritative threat indicators map to Apex Financial Enterprises systems."
      />
    </div>
  );
};
