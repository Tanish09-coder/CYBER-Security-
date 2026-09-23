import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { assetApi, GetAssetsParams } from '../api/assets';
import type { AssetResponse } from '../types/api';
import { Search, Filter, HardDrive, Globe, Server, User, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';

export const Assets: React.FC = () => {
  const [assets, setAssets] = useState<AssetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination / Filter State
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: GetAssetsParams = {
        page,
        limit,
      };
      
      if (debouncedSearch) params.search = debouncedSearch;
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
  }, [page, limit, debouncedSearch, assetTypeFilter, criticalityFilter, internetFacingFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const getCriticalityBadge = (level: number) => {
    // 1-5 scale, mapping to generic UI variants
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
          <h1 className="text-2xl font-bold text-text-primary">Enterprise Asset Explorer</h1>
          <p className="text-sm text-text-secondary mt-1">Manage and monitor organizational assets</p>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="bg-white border border-app-border rounded-lg shadow-sm p-4 mb-6">
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
              className="block w-full pl-10 pr-3 py-2 border border-app-border rounded-md leading-5 bg-app-bg text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-brand-primary sm:text-sm"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-text-secondary" />
              <select
                value={assetTypeFilter}
                onChange={(e) => { setAssetTypeFilter(e.target.value); setPage(1); }}
                className="block w-full pl-3 pr-10 py-2 text-base border-app-border focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
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
              className="block w-full pl-3 pr-10 py-2 text-base border-app-border focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
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
              className="block w-full pl-3 pr-10 py-2 text-base border-app-border focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
            >
              <option value="">Any Exposure</option>
              <option value="true">Internet-Facing</option>
              <option value="false">Internal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-app-border rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[400px]">
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
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-app-bg/30">
            <HardDrive className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No enterprise assets found.</h3>
            <p className="text-sm text-text-secondary max-w-md">
              Asset inventory data will appear here once assets are registered.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-app-border">
              <thead className="bg-app-bg">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Asset</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Hostname / IP</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Asset Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Environment</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Criticality</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Exposure</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Owner</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-app-border">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-app-bg/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Server className="w-4 h-4 text-text-secondary mr-2" />
                        <span className="text-sm font-medium text-text-primary">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-secondary font-mono">
                        {asset.hostname || asset.ipAddress || 'Not available'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-text-primary capitalize">{asset.assetType.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-text-secondary">{asset.environment}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCriticalityBadge(asset.businessCriticality)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {asset.isInternetFacing ? (
                        <Badge variant="warning" className="border-orange-200">
                          <Globe className="w-3 h-3 mr-1" />
                          Internet-facing
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Internal</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary flex items-center">
                      <User className="w-4 h-4 mr-1 text-text-muted" />
                      {asset.owner || 'Not available'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && !error && assets.length > 0 && (
          <div className="px-6 py-4 border-t border-app-border bg-white flex items-center justify-between mt-auto">
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
