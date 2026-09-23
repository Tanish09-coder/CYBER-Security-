import React from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

const getTitleFromPath = (pathname: string): string => {
  const path = pathname.split('/')[1];
  if (!path) return 'Overview';
  
  const titles: Record<string, string> = {
    'integrations': 'Telemetry & Feeds',
    'vulnerabilities': 'Vulnerabilities',
    'assets': 'Enterprise Assets',
    'controls': 'Security Controls',
    'threat-intel': 'Threat Intelligence',
  };
  
  return titles[path] || path.replace('-', ' ');
};

export const Header: React.FC = () => {
  const location = useLocation();
  const pageTitle = getTitleFromPath(location.pathname);

  return (
    <header className="h-16 bg-white border-b border-app-border px-8 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center space-x-4">
        <h2 className="text-base font-semibold text-text-primary capitalize">
          {pageTitle}
        </h2>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-app-secondary text-text-secondary font-mono">
          Live Evaluation
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Currency Context indicator */}
        <div className="text-right">
          <span className="text-[11px] text-text-secondary block">Valuation Currency</span>
          <span className="text-xs font-semibold text-text-primary">INR (₹ Lakhs & Crores)</span>
        </div>
        <div className="h-6 w-px bg-app-border" />
        <button className="p-2 text-text-secondary hover:text-text-primary rounded-md hover:bg-app-bg">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
