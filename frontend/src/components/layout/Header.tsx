import React from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

const routeTitles: Record<string, string> = {
  'integrations':        'Data Integrations',
  'vulnerabilities':     'Vulnerability Intelligence',
  'assets':              'Enterprise Assets',
  'controls':            'Security Control Posture',
  'threat-intel':        'Threat Intelligence',
  'risk-overview':       'Risk Overview',
  'financial-exposure':  'Financial Exposure',
  'what-if-simulator':   'What-If Simulator',
  'investment-optimizer':'Investment Analysis',
  'executive-dashboard': 'Executive Dashboard',
  'compliance':          'Compliance',
  'attack-path':         'Attack Path Analysis',
  'ai-assistant':        'AI Assistant',
};

export const Header: React.FC = () => {
  const location = useLocation();
  const segment = location.pathname.split('/')[1];
  const pageTitle = routeTitles[segment] || 'Overview';

  return (
    <header
      className="flex-shrink-0 z-20 relative"
      style={{
        background: '#003087',
        borderBottom: '3px solid #FF6200',
      }}
    >
      {/* Top tricolor strip */}
      <div className="flex h-1 w-full">
        <div className="flex-1" style={{ background: '#FF6200' }} />
        <div className="flex-1" style={{ background: '#FFFFFF' }} />
        <div className="flex-1" style={{ background: '#138808' }} />
      </div>

      <div className="h-12 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 border border-white/30 text-white/60"
            style={{ letterSpacing: '0.12em' }}
          >
            NIC-CERT
          </span>
          <div className="h-3.5 w-px bg-white/20" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            {pageTitle}
          </h2>
        </div>

        <div className="flex items-center space-x-5">
          {/* Live status indicator */}
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40" style={{ background: '#5DFF5D' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#138808' }} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              OPERATIONAL
            </span>
          </div>

          <div className="h-3 w-px bg-white/20" />

          <div className="flex items-center text-[10px] text-white/50">
            <RefreshCw className="w-3 h-3 mr-1.5 opacity-60" />
            Last sync: 2 min ago
          </div>
        </div>
      </div>
    </header>
  );
};
