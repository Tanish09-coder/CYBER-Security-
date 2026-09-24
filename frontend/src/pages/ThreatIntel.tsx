import React, { useEffect, useState, useCallback } from 'react';
import { Search, AlertCircle, ShieldAlert, ChevronLeft, ChevronRight, Info, Target, Crosshair, ExternalLink, Calendar } from 'lucide-react';
import { threatIntelApi } from '../api/threatIntel';
import type { 
  ThreatIntelSummaryResponse, 
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

export const ThreatIntel: React.FC = () => {
  // ==========================================
  // Summary State
  // ==========================================
  const [summary, setSummary] = useState<ThreatIntelSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // ==========================================
  // KEV Explorer State
  // ==========================================
  const [kevData, setKevData] = useState<ThreatIntelKevResponse | null>(null);
  const [kevLoading, setKevLoading] = useState(true);
  const [kevError, setKevError] = useState<string | null>(null);
  const [selectedKev, setSelectedKev] = useState<ThreatIntelKevItem | null>(null);
  
  // KEV Filters
  const [kevPage, setKevPage] = useState(1);
  const kevLimit = 15;
  const [kevSearch, setKevSearch] = useState('');
  const [kevDebouncedSearch, setKevDebouncedSearch] = useState('');
  const [kevRansomware, setKevRansomware] = useState(false);
  const [dateAddedFrom, setDateAddedFrom] = useState('');
  const [dateAddedTo, setDateAddedTo] = useState('');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');

  // ==========================================
  // MITRE State
  // ==========================================
  const [tactics, setTactics] = useState<MitreTactic[]>([]);
  const [tacticsLoading, setTacticsLoading] = useState(true);
  const [tacticsError, setTacticsError] = useState<string | null>(null);

  const [techniques, setTechniques] = useState<MitreTechnique[]>([]);
  const [techniquesLoading, setTechniquesLoading] = useState(true);
  const [techniquesError, setTechniquesError] = useState<string | null>(null);

  // ==========================================
  // Debounce Search
  // ==========================================
  useEffect(() => {
    const timer = setTimeout(() => setKevDebouncedSearch(kevSearch), 500);
    return () => clearTimeout(timer);
  }, [kevSearch]);

  // Reset page on filter change
  useEffect(() => {
    setKevPage(1);
  }, [kevDebouncedSearch, kevRansomware, dateAddedFrom, dateAddedTo, dueDateFrom, dueDateTo]);

  // ==========================================
  // Fetch Functions
  // ==========================================
  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const res = await threatIntelApi.getSummary();
      setSummary(res);
    } catch (err: any) {
      setSummaryError(err.message || 'Failed to fetch summary');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchKev = useCallback(async () => {
    try {
      setKevLoading(true);
      setKevError(null);
      const res = await threatIntelApi.getKevCatalog({
        page: kevPage,
        limit: kevLimit,
        search: kevDebouncedSearch,
        ransomware: kevRansomware,
        dateAddedFrom,
        dateAddedTo,
        dueDateFrom,
        dueDateTo
      });
      setKevData(res);
    } catch (err: any) {
      setKevError(err.message || 'Failed to fetch CISA KEV catalog');
    } finally {
      setKevLoading(false);
    }
  }, [kevPage, kevDebouncedSearch, kevRansomware, dateAddedFrom, dateAddedTo, dueDateFrom, dueDateTo]);

  const fetchMitreTactics = useCallback(async () => {
    try {
      setTacticsLoading(true);
      setTacticsError(null);
      const res = await threatIntelApi.getMitreTactics({ limit: 100 });
      setTactics(res.tactics);
    } catch (err: any) {
      setTacticsError(err.message || 'Failed to fetch MITRE Tactics');
    } finally {
      setTacticsLoading(false);
    }
  }, []);

  const fetchMitreTechniques = useCallback(async () => {
    try {
      setTechniquesLoading(true);
      setTechniquesError(null);
      const res = await threatIntelApi.getMitreTechniques({ limit: 15 });
      setTechniques(res.techniques);
    } catch (err: any) {
      setTechniquesError(err.message || 'Failed to fetch MITRE Techniques');
    } finally {
      setTechniquesLoading(false);
    }
  }, []);

  // ==========================================
  // Initial Load
  // ==========================================
  useEffect(() => {
    fetchSummary();
    fetchMitreTactics();
    fetchMitreTechniques();
  }, [fetchSummary, fetchMitreTactics, fetchMitreTechniques]);

  useEffect(() => {
    fetchKev();
  }, [fetchKev]);

  // ==========================================
  // Render Helpers
  // ==========================================
  const renderSummaryCard = (title: string, value: number | string | undefined, loading: boolean, error: string | null) => (
    <div className="bg-app-surface border border-app-border rounded-lg p-5 shadow-sm hover:border-brand-primary/30 transition-colors">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">{title}</h4>
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : error ? (
        <span className="text-sm text-risk-critical flex items-center"><AlertCircle className="w-4 h-4 mr-1"/> Error</span>
      ) : (
        <div className="text-3xl font-bold text-text-primary">{value ?? '—'}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Threat Intelligence</h2>
        <p className="text-text-secondary mt-1 text-sm">
          Modeled and observed intelligence from trusted authoritative sources including CISA Known Exploited Vulnerabilities and MITRE ATT&CK.
        </p>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {renderSummaryCard('Active KEV', summary?.cisaKev.activeCount, summaryLoading, summaryError)}
        {renderSummaryCard('Ransomware KEV', summary?.cisaKev.knownRansomwareCount, summaryLoading, summaryError)}
        {renderSummaryCard('Overdue KEV', summary?.cisaKev.overdueCount, summaryLoading, summaryError)}
        {renderSummaryCard('ATT&CK Tactics', summary?.mitreAttack.tacticsCount, summaryLoading, summaryError)}
        {renderSummaryCard('ATT&CK Techniques', summary?.mitreAttack.techniquesCount, summaryLoading, summaryError)}
      </div>

      {/* CISA KEV Explorer Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-brand-primary" />
          <h3 className="text-lg font-bold text-text-primary">CISA Known Exploited Vulnerabilities</h3>
        </div>

        {/* KEV Filters */}
        <div className="bg-app-surface border border-app-border rounded-lg p-4 shadow-sm flex flex-col xl:flex-row xl:items-center space-y-4 xl:space-y-0 xl:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search CVE ID or Vendor/Product..."
              value={kevSearch}
              onChange={(e) => setKevSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-app-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary bg-app-surface text-text-primary placeholder-text-muted transition-colors"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kevRansomware}
                onChange={(e) => setKevRansomware(e.target.checked)}
                className="rounded border-app-border bg-app-surface text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-text-primary whitespace-nowrap">Known Ransomware Only</span>
            </label>

            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-text-muted" />
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">Added:</span>
              <input type="date" value={dateAddedFrom} onChange={(e) => setDateAddedFrom(e.target.value)} className="py-1 px-2 border border-app-border bg-app-surface text-text-primary rounded text-sm" />
              <span className="text-sm text-text-muted">-</span>
              <input type="date" value={dateAddedTo} onChange={(e) => setDateAddedTo(e.target.value)} className="py-1 px-2 border border-app-border bg-app-surface text-text-primary rounded text-sm" />
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-text-muted" />
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest whitespace-nowrap">Due:</span>
              <input type="date" value={dueDateFrom} onChange={(e) => setDueDateFrom(e.target.value)} className="py-1 px-2 border border-app-border bg-app-surface text-text-primary rounded text-sm" />
              <span className="text-sm text-text-muted">-</span>
              <input type="date" value={dueDateTo} onChange={(e) => setDueDateTo(e.target.value)} className="py-1 px-2 border border-app-border bg-app-surface text-text-primary rounded text-sm" />
            </div>

            {(kevSearch || kevRansomware || dateAddedFrom || dateAddedTo || dueDateFrom || dueDateTo) && (
              <Button variant="outline" className="py-1 px-3 text-xs" onClick={() => {
                setKevSearch('');
                setKevRansomware(false);
                setDateAddedFrom('');
                setDateAddedTo('');
                setDueDateFrom('');
                setDueDateTo('');
              }}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* KEV Table */}
        <div className="bg-app-surface border border-app-border rounded-lg shadow-sm flex flex-col">
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
                  <TableHead>Due Date</TableHead>
                  <TableHead>Ransomware</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kevData.data.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="font-bold">{item.cveId}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.vendorProject || 'Unknown Vendor'}</span>
                        <span className="text-xs text-text-secondary">{item.product || 'Unknown Product'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm truncate max-w-xs" title={item.vulnerabilityName || ''}>
                      {item.vulnerabilityName || '—'}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap text-text-secondary">
                      {item.dateAdded ? new Date(item.dateAdded).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap text-text-secondary">
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      {item.knownRansomwareCampaignUse === 'Known' ? (
                        <Badge variant="critical">Known</Badge>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" className="py-1 px-2 text-xs" onClick={() => setSelectedKev(item)}>
                        <Info className="w-3 h-3 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center bg-app-surfaceSecondary rounded-b-lg">
              <ShieldAlert className="w-10 h-10 text-text-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-text-primary">No CISA KEV records found</h3>
              <p className="text-sm text-text-secondary mt-1">Adjust filters or verify ingestion status.</p>
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
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="py-1 px-3 text-xs"
                  disabled={!kevData.pagination.hasNext}
                  onClick={() => setKevPage(p => Math.min(kevData.pagination.totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MITRE ATT&CK Section */}
      <div className="mt-12 space-y-6">
        <div className="flex items-center space-x-2 border-b border-app-border pb-2">
          <Target className="w-5 h-5 text-brand-primary" />
          <h3 className="text-lg font-bold text-text-primary">MITRE ATT&CK Knowledge Base</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tactics */}
          <div className="bg-app-surface border border-app-border rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-text-primary flex items-center">
                <Crosshair className="w-4 h-4 mr-2 text-brand-primary" /> Tactics
              </h4>
            </div>
            {tacticsError ? (
               <div className="text-sm text-risk-critical mb-2">{tacticsError}</div>
            ) : tacticsLoading ? (
               <div className="space-y-2">
                 <Skeleton className="h-6 w-full" />
                 <Skeleton className="h-6 w-full" />
                 <Skeleton className="h-6 w-3/4" />
               </div>
            ) : tactics.length > 0 ? (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                {tactics.map(t => (
                  <div key={t.id} className="p-3 border border-app-border rounded-md hover:bg-app-surfaceSecondary bg-app-surface transition-colors">
                    <div className="flex justify-between">
                      <span className="font-medium text-sm text-text-primary">{t.name}</span>
                      <Badge variant="neutral">{t.attackId}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-text-muted text-center py-4 bg-app-surfaceSecondary rounded">No tactics available.</div>
            )}
          </div>

          {/* Techniques */}
          <div className="bg-app-surface border border-app-border rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-text-primary flex items-center">
                <Target className="w-4 h-4 mr-2 text-brand-primary" /> Techniques (Preview)
              </h4>
            </div>
            {techniquesError ? (
               <div className="text-sm text-risk-critical mb-2">{techniquesError}</div>
            ) : techniquesLoading ? (
               <div className="space-y-2">
                 <Skeleton className="h-6 w-full" />
                 <Skeleton className="h-6 w-full" />
                 <Skeleton className="h-6 w-3/4" />
               </div>
            ) : techniques.length > 0 ? (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                {techniques.map(t => (
                  <div key={t.id} className="p-3 border border-app-border rounded-md hover:bg-app-surfaceSecondary bg-app-surface transition-colors">
                    <div className="flex justify-between">
                      <span className="font-medium text-sm text-text-primary">{t.name}</span>
                      <Badge variant="neutral">{t.attackId}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-text-muted text-center py-4 bg-app-surfaceSecondary rounded">No techniques available.</div>
            )}
          </div>
        </div>
      </div>

      {/* KEV Detail Modal */}
      {selectedKev && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedKev(null)}
          title={`CISA KEV Record: ${selectedKev.cveId}`}
        >
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-1">Vulnerability</h4>
              <p className="text-sm text-text-secondary">{selectedKev.vulnerabilityName || 'Not available'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">Vendor & Project</h4>
                <p className="text-sm text-text-secondary">{selectedKev.vendorProject || 'Not available'}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">Product</h4>
                <p className="text-sm text-text-secondary">{selectedKev.product || 'Not available'}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-1">Description</h4>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{selectedKev.shortDescription || 'Not available'}</p>
            </div>

            <div className="bg-app-surfaceSecondary p-4 rounded-md border border-app-border">
              <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-brand-primary" /> Required Action
              </h4>
              <p className="text-sm text-text-secondary">{selectedKev.requiredAction || 'Not available'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">Date Added</h4>
                <p className="text-sm text-text-secondary">{selectedKev.dateAdded || 'Not available'}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">Due Date</h4>
                <p className="text-sm text-text-secondary">{selectedKev.dueDate || 'Not available'}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-1">Ransomware Campaign Use</h4>
              <p className="text-sm text-text-secondary">
                {selectedKev.knownRansomwareCampaignUse === 'Known' ? (
                  <Badge variant="critical">Known</Badge>
                ) : (
                  <Badge variant="neutral">{selectedKev.knownRansomwareCampaignUse || 'Not available'}</Badge>
                )}
              </p>
            </div>

            {selectedKev.notes && (
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">Notes / References</h4>
                <div className="text-sm text-brand-primary break-all">
                  {selectedKev.notes.split(';').map((note, i) => {
                    const urlMatch = note.match(/https?:\/\/[^\s]+/);
                    return (
                      <div key={i} className="mb-1">
                        {urlMatch ? (
                          <a href={urlMatch[0]} target="_blank" rel="noreferrer" className="flex items-center hover:underline">
                            <ExternalLink className="w-3 h-3 mr-1" /> {urlMatch[0]}
                          </a>
                        ) : note.trim()}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t border-app-border pt-4">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Provenance</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                <div>Source: <span className="font-medium text-text-primary">{selectedKev.provenance?.sourceName || 'Not available'}</span></div>
                <div>Provider: <span className="font-medium text-text-primary">{selectedKev.provenance?.sourceProvider || 'Not available'}</span></div>
                <div>Ingested At: <span className="font-medium text-text-primary">{selectedKev.provenance?.ingestedAt ? new Date(selectedKev.provenance.ingestedAt).toLocaleString() : 'Not available'}</span></div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
