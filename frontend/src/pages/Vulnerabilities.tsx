import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ShieldAlert, ChevronLeft, ChevronRight, AlertCircle, Info } from 'lucide-react';
import { vulnerabilityApi } from '../api/vulnerabilities';
import type { VulnerabilityListResponse } from '../types/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';

export const Vulnerabilities: React.FC = () => {
  const [data, setData] = useState<VulnerabilityListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [kevOnly, setKevOnly] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchVulnerabilities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await vulnerabilityApi.getVulnerabilities({
        page,
        limit,
        search: debouncedSearch,
        severity,
        kevOnly,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vulnerabilities');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, severity, kevOnly]);

  useEffect(() => {
    fetchVulnerabilities();
  }, [fetchVulnerabilities]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, severity, kevOnly]);

  const getSeverityBadgeVariant = (sev?: string | null) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL': return 'critical';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Standard Header */}
      <StandardPageHeader
        title="Software Vulnerability Intelligence"
        purpose="Explore known software security vulnerabilities collected from NVD."
        steps={[
          'Search for specific CVE identifiers or software product names',
          'Filter by CVSS severity rating (Critical, High, Medium, Low)',
          'Identify whether vulnerabilities are actively exploited (CISA KEV)'
        ]}
        dataOriginBadge="REAL INTELLIGENCE"
      />

      {/* Concept Helper Box */}
      <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-3.5 flex items-center space-x-3 text-xs text-text-secondary">
        <Info className="w-4 h-4 text-brand-primary flex-shrink-0" />
        <div>
          <span className="font-bold text-brand-primary mr-1">Quick Terminology Guide:</span>
          <span><strong>CVE</strong> (Common Vulnerabilities and Exposures) uniquely identifies a flaw. <strong>CVSS</strong> (Common Vulnerability Scoring System 0–10) describes its technical severity.</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-app-surface border border-app-border rounded-lg p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search CVE ID or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-app-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary bg-app-surface text-text-primary placeholder-text-muted transition-colors"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="py-2 pl-3 pr-8 border border-app-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary bg-app-surface text-text-primary transition-colors"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={kevOnly}
              onChange={(e) => setKevOnly(e.target.checked)}
              className="rounded border-app-border bg-app-surface text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-sm text-text-primary whitespace-nowrap">CISA KEV Only</span>
          </label>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-app-surface rounded-lg shadow-2xs flex flex-col border border-app-border">
        {error ? (
          <div className="p-8 text-center bg-risk-critical/5">
            <AlertCircle className="w-8 h-8 text-risk-critical mx-auto mb-3" />
            <h3 className="text-lg font-bold text-text-primary mb-1">Error Loading Vulnerability Intelligence</h3>
            <p className="text-sm text-text-secondary mb-4">{error}</p>
            <Button variant="outline" onClick={fetchVulnerabilities}>Retry</Button>
          </div>
        ) : loading ? (
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
        ) : data && data.data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CVE Identifier</TableHead>
                <TableHead>CVSS Score</TableHead>
                <TableHead>Technical Severity</TableHead>
                <TableHead>CISA KEV Status</TableHead>
                <TableHead>Attack Vector</TableHead>
                <TableHead>Published Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((vuln) => (
                <TableRow key={vuln.cveId} className="group hover:bg-gray-50/50">
                  <TableCell className="font-bold">
                    <Link to={`/vulnerabilities/${vuln.cveId}`} className="text-brand-primary hover:underline font-mono">
                      {vuln.cveId}
                    </Link>
                  </TableCell>
                  <TableCell className="font-bold">
                    {vuln.cvss?.baseScore != null ? vuln.cvss.baseScore.toFixed(1) : '—'}
                  </TableCell>
                  <TableCell>
                    {vuln.cvss ? (
                      <Badge variant={getSeverityBadgeVariant(vuln.cvss.severity)}>
                        {vuln.cvss.severity}
                      </Badge>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {vuln.knownExploited ? (
                      <Badge variant="critical" className="font-bold">
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        ACTIVELY EXPLOITED
                      </Badge>
                    ) : (
                      <span className="text-text-muted text-xs">Not Listed</span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize text-text-secondary text-sm">
                    {vuln.cvss?.attackVector?.toLowerCase() || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {vuln.publishedAt ? new Date(vuln.publishedAt).toLocaleDateString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center bg-app-surfaceSecondary rounded-b-lg">
            <ShieldAlert className="w-10 h-10 text-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-text-primary">No vulnerabilities match your filter criteria.</h3>
            <p className="text-sm text-text-secondary mt-1">To view data: adjust search keywords or uncheck filter boxes.</p>
          </div>
        )}

        {/* Pagination */}
        {!error && !loading && data && data.pagination.total > 0 && (
          <div className="px-6 py-4 border-t border-app-border flex items-center justify-between bg-app-surfaceSecondary rounded-b-lg">
            <div className="text-sm text-text-secondary">
              Showing <span className="font-bold text-text-primary">{((data.pagination.page - 1) * data.pagination.limit) + 1}</span> to <span className="font-bold text-text-primary">{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}</span> of <span className="font-bold text-text-primary">{data.pagination.total.toLocaleString()}</span> entries
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="py-1 px-3 text-xs"
                disabled={!data.pagination.hasPrevious}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                className="py-1 px-3 text-xs"
                disabled={!data.pagination.hasNext}
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Standard Footer */}
      <StandardPageFooter
        resultMeaning="Each CVE describes a technical software flaw documented by NIST NVD. High CVSS scores indicate high potential technical severity, but business impact depends on asset criticality and control implementation."
        nextStepTitle="View Affected Enterprise Assets"
        nextStepPath="/assets"
        nextStepDescription="See how these software vulnerabilities affect Apex Financial Enterprises demo assets."
      />
    </div>
  );
};
