import React from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, RefreshCw } from 'lucide-react';

const getTitleFromPath = (pathname: string): string => {
  const path = pathname.split('/')[1];
  if (!path) return 'Overview';
  
  const titles: Record<string, string> = {
    'integrations': 'Integrations',
    'vulnerabilities': 'Vulnerability Intelligence',
    'assets': 'Enterprise Assets',
    'controls': 'Security Control Posture',
    'threat-intel': 'Threat Intelligence',
  };
  
  return titles[path] || path.replace('-', ' ');
};

export const Header: React.FC = () => {
  const location = useLocation();
  const pageTitle = getTitleFromPath(location.pathname);

  return (
    <header className="h-16 bg-app-surface border-b border-app-border px-8 flex items-center justify-between flex-shrink-0 z-20 relative">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-bold text-text-primary capitalize tracking-tight">
          {pageTitle}
        </h2>
      </div>

      <div className="flex items-center space-x-6">
        {/* System Status */}
        <div className="flex items-center text-xs font-medium text-text-secondary">
          <span className="flex h-2 w-2 relative mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-success opacity-20"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-success"></span>
          </span>
          SYSTEM OPERATIONAL
        </div>

        <div className="h-4 w-px bg-app-border" />

        {/* Sync Status */}
        <div className="flex items-center text-xs text-text-muted">
          <RefreshCw className="w-3 h-3 mr-1.5 opacity-70" />
          Last sync: 2 min ago
        </div>
        
        <div className="h-4 w-px bg-app-border" />
        
        <button className="p-2 text-text-muted hover:text-brand-primary rounded-md hover:bg-app-surfaceSecondary transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
