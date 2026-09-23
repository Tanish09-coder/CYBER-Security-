import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ShieldAlert, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { vulnerabilityApi } from '../api/vulnerabilities';
import type { VulnerabilityListResponse } from '../types/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';

export const Vulnerabilities: React.FC = () => {
  const [data, setData] = useState<VulnerabilityListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [kevOnly, setKevOnly] = useState(false);
  const [ransomwareOnly, setRansomwareOnly] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 25; // default as per new API contract

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
        ransomwareOnly
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vulnerabilities');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, severity, kevOnly, ransomwareOnly]);

  useEffect(() => {
    fetchVulnerabilities();
  }, [fetchVulnerabilities]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, severity, kevOnly, ransomwareOnly]);

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
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary">Vulnerability Explorer</h2>
        <p className="text-text-secondary mt-1">
          Searchable catalog of CVEs with CVSS severity and CISA KEV exploitation indicators.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-app-border rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search CVE ID or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-app-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="py-2 pl-3 pr-8 border border-app-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
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
              className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-sm text-text-primary whitespace-nowrap">CISA KEV Only</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ransomwareOnly}
              onChange={(e) => setRansomwareOnly(e.target.checked)}
              className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-sm text-text-primary whitespace-nowrap">Ransomware Only</span>
          </label>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-app-border rounded-lg shadow-sm flex flex-col">
        {error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-8 h-8 text-risk-critical mx-auto mb-3" />
            <h3 className="text-lg font-medium text-text-primary mb-1">Error Loading Data</h3>
            <p className="text-sm text-text-secondary">{error}</p>
          </div>
        ) : loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-10 w-1/6" />
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
                <TableHead>CVE ID</TableHead>
                <TableHead>CVSS Score</TableHead>
                <TableHead>CISA KEV</TableHead>
                <TableHead>Ransomware</TableHead>
                <TableHead>Attack Vector</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Published</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((vuln) => (
                <TableRow key={vuln.cveId}>
                  <TableCell className="font-medium">
                    <Link to={`/vulnerabilities/${vuln.cveId}`} className="text-brand-primary hover:underline">
                      {vuln.cveId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {vuln.cvss ? (
                      <Badge variant={getSeverityBadgeVariant(vuln.cvss.severity)}>
                        {vuln.cvss.baseScore.toFixed(1)} {vuln.cvss.severity}
                      </Badge>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {vuln.knownExploited ? (
                      <Badge variant="critical" className="font-bold border-red-300">
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        KEV
                      </Badge>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {vuln.ransomwareCampaignUse === 'Known' ? (
                      <Badge variant="critical">Known</Badge>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize text-text-secondary text-sm">
                    {vuln.cvss?.attackVector?.toLowerCase() || '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {vuln.source.provider || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {vuln.publishedAt ? new Date(vuln.publishedAt).toLocaleDateString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center">
            <ShieldAlert className="w-10 h-10 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary">No vulnerabilities found</h3>
            <p className="text-sm text-text-secondary mt-1">Adjust your filters or search criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {!error && !loading && data && data.pagination.total > 0 && (
          <div className="px-6 py-4 border-t border-app-border flex items-center justify-between bg-app-bg/50 rounded-b-lg">
            <div className="text-sm text-text-secondary">
              Showing <span className="font-medium text-text-primary">{((data.pagination.page - 1) * data.pagination.limit) + 1}</span> to <span className="font-medium text-text-primary">{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)}</span> of <span className="font-medium text-text-primary">{data.pagination.total.toLocaleString()}</span> entries
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
    </div>
  );
};
