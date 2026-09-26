import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, RefreshCw, Building2 } from 'lucide-react';
import { fetchApi } from '../../api/client';
import { useWorkspace } from '../../context/WorkspaceContext';

const getTitleFromPath = (pathname: string): string => {
  const path = pathname.split('/')[1];
  if (!path) return 'Overview';
  
  const titles: Record<string, string> = {
    'integrations': 'Integrations',
    'vulnerabilities': 'Vulnerability Intelligence',
    'assets': 'Enterprise Assets',
    'controls': 'Security Control Posture',
    'threat-intel': 'Threat Intelligence',
    'risk-overview': 'Risk Overview',
    'financial-exposure': 'Financial Exposure',
    'what-if-simulator': 'What-If Simulator',
    'investment-optimizer': 'Investment Optimizer',
    'executive-dashboard': 'Executive Dashboard',
    'compliance': 'Compliance Posture',
    'attack-path': 'Attack Path Analysis',
    'ai-assistant': 'AI Explanation Assistant',
  };
  
  return titles[path] || path.replace(/-/g, ' ');
};

export const Header: React.FC = () => {
  const location = useLocation();
  const pageTitle = getTitleFromPath(location.pathname);
  const { activeOrg, setShowFirstTimeTour } = useWorkspace();

  const [healthStatus, setHealthStatus] = useState<'HEALTHY' | 'DEGRADED' | 'DISCONNECTED'>('HEALTHY');
  const [serverTimestamp, setServerTimestamp] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkBackendHealth = async () => {
      try {
        const res = await fetchApi<{ status: string; timestamp?: string }>('/api/health');
        if (isMounted) {
          if (res?.status === 'ok') {
            setHealthStatus('HEALTHY');
            if (res.timestamp) setServerTimestamp(res.timestamp);
          } else {
            setHealthStatus('DEGRADED');
          }
        }
      } catch {
        if (isMounted) {
          setHealthStatus('DISCONNECTED');
        }
      }
    };

    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="h-16 bg-app-surface border-b border-app-border px-8 flex items-center justify-between flex-shrink-0 z-20 relative">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-bold text-text-primary capitalize tracking-tight">
          {pageTitle}
        </h2>

        <div className="hidden md:flex items-center space-x-2 bg-app-surfaceSecondary px-3 py-1 rounded-md border border-app-border text-xs text-text-secondary">
          <Building2 className="w-3.5 h-3.5 text-brand-primary" />
          <span className="font-semibold text-text-primary">{activeOrg.name}</span>
          <span className="text-[10px] text-text-muted font-mono uppercase">({activeOrg.currency || 'INR'})</span>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* Real System Status */}
        <div className="flex items-center text-xs font-medium text-text-secondary">
          {healthStatus === 'HEALTHY' ? (
            <>
              <span className="flex h-2 w-2 relative mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-success opacity-20"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-success"></span>
              </span>
              CONNECTED
            </>
          ) : (
            <>
              <span className="flex h-2 w-2 relative mr-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              {healthStatus}
            </>
          )}
        </div>

        {serverTimestamp && (
          <>
            <div className="h-4 w-px bg-app-border" />
            <div className="flex items-center text-xs text-text-muted">
              <RefreshCw className="w-3 h-3 mr-1.5 opacity-70" />
              Verified: {new Date(serverTimestamp).toLocaleTimeString()}
            </div>
          </>
        )}
        
        <div className="h-4 w-px bg-app-border" />
        
        <button 
          onClick={() => setShowFirstTimeTour(true)}
          title="Open Product Tour"
          className="p-2 text-text-muted hover:text-brand-primary rounded-md hover:bg-app-surfaceSecondary transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
