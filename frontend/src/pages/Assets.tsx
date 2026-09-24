import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { assetApi, GetAssetsParams } from '../api/assets';
import { organizationApi, OrganizationResponse } from '../api/organizations';
import type { AssetResponse } from '../types/api';
import { Search, Filter, HardDrive, Globe, Server, User, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/common/Table';

export const Assets: React.FC = () => {
  const [assets, setAssets] = useState<AssetResponse[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination / Filter State
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState('');
  const [internetFacingFilter, setInternetFacingFilter] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    organizationApi.getOrganizations()
      .then(res => setOrganizations(res.data))
      .catch(console.error);
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: GetAssetsParams = {
        page,
        limit,
      };
      
      if (debouncedSearch) params.search = debouncedSearch;
      if (organizationFilter) params.organizationId = organizationFilter;
      if (assetTypeFilter) params.assetType = assetTypeFilter;
      if (criticalityFilter) params.businessCriticality = parseInt(criticalityFilter, 10);
      if (internetFacingFilter === 'true') params.isInternetFacing = true;
      if (internetFacingFilter === 'false') params.isInternetFacing = false;

      const res = await assetApi.getAssets(params);
      
      setAssets(res.data);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, organizationFilter, assetTypeFilter, criticalityFilter, internetFacingFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const getCriticalityBadge = (level: number) => {
    if (level === 5) return <Badge variant="critical">Level 5</Badge>;
    if (level === 4) return <Badge variant="warning">Level 4</Badge>;
    if (level === 3) return <Badge variant="info">Level 3</Badge>;
    return <Badge variant="neutral">Level {level}</Badge>;
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Enterprise Asset Environment</h1>
          <p className="text-sm text-text-secondary mt-1">Manage and monitor organizational assets</p>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="bg-app-surface border border-app-border rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-app-border rounded-md leading-5 bg-app-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary sm:text-sm transition-colors"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-text-secondary" />
              <select
                value={organizationFilter}
                onChange={(e) => { setOrganizationFilter(e.target.value); setPage(1); }}
                className="block w-full pl-3 pr-10 py-2 text-sm border-app-border bg-app-surface text-text-primary focus:outline-none focus:ring-brand-primary focus:border-brand-primary rounded-md transition-colors border"
              >
                <option value="">All Organizations</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={assetTypeFilter}
                onChange={(e) => { setAssetTypeFilter(e.target.value); setPage(1); }}
                className="block w-full pl-3 pr-10 py-2 text-sm border-app-border bg-app-surface text-text-primary focus:outline-none focus:ring-brand-primary focus:border-brand-primary rounded-md transition-colors border"
              >
                <option value="">All Asset Types</option>
                <option value="server">Server</option>
                <option value="workstation">Workstation</option>
                <option value="network_appliance">Network Appliance</option>
                <option value="cloud_instance">Cloud Instance</option>
                <option value="database_server">Database Server</option>
              </select>
            </div>
            
            <select
              value={criticalityFilter}
              onChange={(e) => { setCriticalityFilter(e.target.value); setPage(1); }}
              className="block w-full pl-3 pr-10 py-2 text-sm border-app-border bg-app-surface text-text-primary focus:outline-none focus:ring-brand-primary focus:border-brand-primary rounded-md transition-colors border"
            >
              <option value="">Any Criticality</option>
              <option value="5">Level 5 (Highest)</option>
              <option value="4">Level 4</option>
              <option value="3">Level 3</option>
              <option value="2">Level 2</option>
              <option value="1">Level 1 (Lowest)</option>
            </select>

            <select
              value={internetFacingFilter}
              onChange={(e) => { setInternetFacingFilter(e.target.value); setPage(1); }}
              className="block w-full pl-3 pr-10 py-2 text-sm border-app-border bg-app-surface text-text-primary focus:outline-none focus:ring-brand-primary focus:border-brand-primary rounded-md transition-colors border"
            >
              <option value="">Any Exposure</option>
              <option value="true">Internet-Facing</option>
              <option value="false">Internal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-app-surface border border-app-border rounded-lg overflow-hidden flex flex-col min-h-[400px] shadow-sm">
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="w-12 h-12 text-risk-critical mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">Error Loading Assets</h3>
            <p className="text-sm text-text-secondary mb-6">{error}</p>
            <Button variant="outline" onClick={fetchAssets}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex space-x-4 items-center">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-app-surfaceSecondary">
            <HardDrive className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No enterprise assets found.</h3>
            <p className="text-sm text-text-secondary max-w-md">
              Asset inventory data will appear here once assets are registered.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Hostname / IP</TableHead>
                <TableHead>Asset Type</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead>Exposure</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Server className="w-4 h-4 text-text-secondary mr-2 group-hover:text-brand-primary transition-colors" />
                      <span className="font-medium">{asset.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-text-secondary">
                      {asset.hostname || asset.ipAddress || 'Not available'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{asset.assetType.replace(/_/g, ' ')}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-text-secondary">{asset.environment}</span>
                  </TableCell>
                  <TableCell>
                    {getCriticalityBadge(asset.businessCriticality)}
                  </TableCell>
                  <TableCell>
                    {asset.isInternetFacing ? (
                      <Badge variant="warning">
                        <Globe className="w-3 h-3 mr-1" />
                        Internet-facing
                      </Badge>
                    ) : (
                      <Badge variant="neutral">Internal</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1 text-text-muted" />
                      {asset.owner || 'Not available'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {/* Pagination */}
        {!loading && !error && assets.length > 0 && (
          <div className="px-6 py-4 border-t border-app-border bg-app-surfaceSecondary flex items-center justify-between mt-auto">
            <div className="text-sm text-text-secondary">
              Showing <span className="font-medium text-text-primary">{(page - 1) * limit + 1}</span> to <span className="font-medium text-text-primary">{Math.min(page * limit, total)}</span> of <span className="font-medium text-text-primary">{total}</span> results
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

    </PageContainer>
  );
};
