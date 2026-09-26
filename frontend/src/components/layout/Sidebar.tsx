import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Radio,
  Bug,
  Server,
  ShieldAlert,
  Flame,
  Lock,
  Building2,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { fetchApi } from '../../api/client';
import { useWorkspace } from '../../context/WorkspaceContext';

export const Sidebar: React.FC = () => {
  const { activeOrg } = useWorkspace();
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const healthRes = await fetchApi<{ status: string }>('/api/health').catch(() => null);
        if (isMounted) {
          setIsOnline(healthRes?.status === 'ok');
        }
      } catch {
        if (isMounted) {
          setIsOnline(false);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);
  return (
    <aside className="w-64 bg-app-surface border-r border-app-border flex flex-col justify-between select-none z-10 relative">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-app-border space-x-3 bg-app-surface">
          <div className="w-8 h-8 rounded bg-brand-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-text-primary">CyberRiskOS</h1>
            <p className="text-[10px] text-text-muted font-medium tracking-wide uppercase">Cyber Risk Intelligence</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-hide mt-2">

          {/* OVERVIEW */}
          <div>
            <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
              Overview
            </div>
            <NavLink
              to="/integrations"
              className={({ isActive }) =>
                `w-full flex items-center px-3 py-2 text-xs font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-app-surfaceSecondary text-brand-primary font-semibold'
                    : 'text-text-secondary hover:bg-app-surfaceSecondary hover:text-text-primary'
                }`
              }
            >
              <Radio className="w-4 h-4 mr-3" />
              <span>Integrations</span>
            </NavLink>
          </div>

          {/* INTELLIGENCE */}
          <div>
            <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
              Intelligence
            </div>
            <NavLink
              to="/vulnerabilities"
              className={({ isActive }) =>
                `w-full flex items-center px-3 py-2 text-xs font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-app-surfaceSecondary text-brand-primary font-semibold'
                    : 'text-text-secondary hover:bg-app-surfaceSecondary hover:text-text-primary'
                }`
              }
            >
              <Bug className="w-4 h-4 mr-3" />
              <span>Vulnerabilities</span>
            </NavLink>
            <NavLink
              to="/threat-intel"
              className={({ isActive }) =>
                `w-full flex items-center px-3 py-2 text-xs font-medium rounded transition-colors mt-1 ${
                  isActive
                    ? 'bg-app-surfaceSecondary text-brand-primary font-semibold'
                    : 'text-text-secondary hover:bg-app-surfaceSecondary hover:text-text-primary'
                }`
              }
            >
              <Flame className="w-4 h-4 mr-3" />
              <span>Threat Intelligence</span>
            </NavLink>
            <NavLink
              to="/breach-containment"
              className={({ isActive }) =>
                `w-full flex items-center px-3 py-2 text-xs font-medium rounded transition-colors mt-1 ${
                  isActive
                    ? 'bg-red-950/40 text-red-400 font-semibold border-l-2 border-red-500'
                    : 'text-text-secondary hover:bg-app-surfaceSecondary hover:text-red-400'
                }`
              }
            >
              <ShieldAlert className="w-4 h-4 mr-3 text-red-400 animate-pulse" />
              <span className="font-semibold text-red-400">Breach Containment AI</span>
            </NavLink>
          </div>


          {/* ENVIRONMENT */}
          <div>
            <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
              Environment
            </div>
            <NavLink
              to="/assets"
              className={({ isActive }) =>
                `w-full flex items-center px-3 py-2 text-xs font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-app-surfaceSecondary text-brand-primary font-semibold'
                    : 'text-text-secondary hover:bg-app-surfaceSecondary hover:text-text-primary'
                }`
              }
            >
              <Server className="w-4 h-4 mr-3" />
              <span>Assets</span>
            </NavLink>
            <NavLink
              to="/controls"
              className={({ isActive }) =>
                `w-full flex items-center px-3 py-2 text-xs font-medium rounded transition-colors mt-1 ${
                  isActive
                    ? 'bg-app-surfaceSecondary text-brand-primary font-semibold'
                    : 'text-text-secondary hover:bg-app-surfaceSecondary hover:text-text-primary'
                }`
              }
            >
              <ShieldAlert className="w-4 h-4 mr-3" />
              <span>Security Controls</span>
            </NavLink>
          </div>

          {/* FINANCIAL RISK */}
          <div>
            <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
              Financial Risk
            </div>
            <NavLink
              to="/risk-overview"
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-app-surfaceSecondary text-brand-primary font-semibold'
                    : 'text-text-secondary hover:bg-app-surfaceSecondary hover:text-text-primary'
                }`
              }
            >
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-3" />
                <span>Risk Overview</span>
              </div>
            </NavLink>
            <NavLink
              to="/financial-exposure"
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors mt-1 ${
                  isActive
                    ? 'bg-app-surfaceSecondary text-brand-primary font-semibold'
                    : 'text-text-secondary hover:bg-app-surfaceSecondary hover:text-text-primary'
                }`
              }
            >
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-3" />
                <span>Financial Exposure</span>
              </div>
            </NavLink>
            <NavLink
              to="/investment-optimizer"
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors mt-1 ${
                  isActive
                    ? 'bg-app-surfaceSecondary text-brand-primary font-semibold'
                    : 'text-text-secondary hover:bg-app-surfaceSecondary hover:text-text-primary'
                }`
              }
            >
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-3" />
                <span>Investment Analysis</span>
              </div>
            </NavLink>
            <NavLink
              to="/what-if-simulator"
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors mt-1 ${
                  isActive
                    ? 'bg-app-surfaceSecondary text-brand-primary font-semibold'
                    : 'text-text-secondary hover:bg-app-surfaceSecondary hover:text-text-primary'
                }`
              }
            >
              <div className="flex items-center">
                <Bug className="w-4 h-4 mr-3" />
                <span>What-If Simulator</span>
              </div>
            </NavLink>
          </div>

          {/* BOARDROOM & REPORTING */}
          <div>
            <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 mt-3">
              Reporting
            </div>
            <NavLink
              to="/executive-dashboard"
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-app-surfaceSecondary text-brand-primary font-semibold'
                    : 'text-text-secondary hover:bg-app-surfaceSecondary hover:text-text-primary'
                }`
              }
            >
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-3" />
                <span>Executive Dashboard</span>
              </div>
            </NavLink>
            <NavLink
              to="/compliance"
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors mt-1 ${
                  isActive
                    ? 'bg-app-surfaceSecondary text-brand-primary font-semibold'
                    : 'text-text-secondary hover:bg-app-surfaceSecondary hover:text-text-primary'
                }`
              }
            >
              <div className="flex items-center">
                <ShieldAlert className="w-4 h-4 mr-3" />
                <span>Compliance</span>
              </div>
            </NavLink>
            <NavLink
              to="/attack-path"
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors mt-1 ${
                  isActive
                    ? 'bg-app-surfaceSecondary text-brand-primary font-semibold'
                    : 'text-text-secondary hover:bg-app-surfaceSecondary hover:text-text-primary'
                }`
              }
            >
              <div className="flex items-center">
                <Flame className="w-4 h-4 mr-3" />
                <span>Attack Path</span>
              </div>
            </NavLink>
            <NavLink
              to="/ai-assistant"
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors mt-1 ${
                  isActive
                    ? 'bg-app-surfaceSecondary text-brand-primary font-semibold'
                    : 'text-text-secondary hover:bg-app-surfaceSecondary hover:text-text-primary'
                }`
              }
            >
              <div className="flex items-center">
                <Radio className="w-4 h-4 mr-3" />
                <span>AI Assistant</span>
              </div>
            </NavLink>
          </div>
        </nav>
      </div>

      {/* User / Org Bottom Status */}
      <div className="border-t border-app-border bg-app-surface">
        <div className="p-3 border-b border-app-border">
          <div className="flex items-center text-[10px] font-medium text-text-secondary">
            {isOnline ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-risk-success mr-1.5" />
                GATEWAY ONLINE
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-red-500 mr-1.5" />
                GATEWAY OFFLINE
              </>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-md bg-app-surfaceSecondary border border-app-border">
              <Building2 className="w-4 h-4 text-text-secondary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-text-primary truncate" title={activeOrg.name}>
                {activeOrg.name}
              </p>
              <p className="text-[10px] text-text-secondary font-medium">Role: CISO / Risk Officer</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
