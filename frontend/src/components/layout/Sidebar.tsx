import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Radio,
  Bug,
  Server,
  ShieldAlert,
  Flame,
  Lock,
  Building2
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { key: 'integrations', label: 'Integrations', icon: Radio, to: '/integrations' },
    { key: 'vulnerabilities', label: 'Vulnerabilities', icon: Bug, to: '/vulnerabilities' },
    { key: 'assets', label: 'Assets', icon: Server, to: '/assets' },
    { key: 'controls', label: 'Security Controls', icon: ShieldAlert, to: '/controls' },
    { key: 'threat-intel', label: 'Threat Intelligence', icon: Flame, to: '/threat-intel' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-app-border flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-app-border space-x-3">
          <div className="w-8 h-8 rounded bg-brand-primary flex items-center justify-center text-white font-bold text-sm">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-text-primary">CyberRiskOS</h1>
            <p className="text-[11px] text-text-secondary">SIH 2026 Enterprise</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.key}
                to={item.to}
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-app-secondary text-brand-primary'
                      : 'text-text-secondary hover:bg-app-bg hover:text-text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 mr-2.5 ${isActive ? 'text-brand-primary' : 'text-text-muted'}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User / Org Bottom Status */}
      <div className="p-3 border-t border-app-border bg-white">
        <div className="flex items-center space-x-2 px-2 py-1.5 rounded bg-app-bg border border-app-border">
          <Building2 className="w-4 h-4 text-text-secondary" />
          <div className="overflow-hidden">
            <p className="text-[11px] font-medium text-text-primary truncate">BharatFin Demo Corp</p>
            <p className="text-[10px] text-text-secondary">Role: CISO / Risk Officer</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
