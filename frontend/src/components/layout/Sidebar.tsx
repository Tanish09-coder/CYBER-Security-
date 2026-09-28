import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Radio, Bug, Server, ShieldAlert, Flame,
  Building2, DollarSign, TrendingUp,
  Sparkles, LayoutDashboard, FileBarChart2,
  GitBranch, Shield, Activity, ShieldCheck
} from 'lucide-react';

import { fetchApi } from '../../api/client';
import { useWorkspace } from '../../context/WorkspaceContext';

const navSections = [
  {
    title: 'Overview',
    items: [
      { to: '/integrations', label: 'Integrations', icon: <Radio size={15} /> },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { to: '/vulnerabilities', label: 'Vulnerabilities', icon: <Bug size={15} /> },
      { to: '/threat-intel', label: 'Threat Intelligence', icon: <Flame size={15} /> },
      { to: '/breach-containment', label: 'Breach Containment AI', icon: <ShieldAlert size={15} /> },
    ],
  },
  {
    title: 'Environment',
    items: [
      { to: '/assets', label: 'Assets', icon: <Server size={15} /> },
      { to: '/controls', label: 'Security Controls', icon: <ShieldAlert size={15} /> },
    ],
  },
  {
    title: 'Financial Risk',
    items: [
      { to: '/risk-overview', label: 'Risk Overview', icon: <Activity size={15} /> },
      { to: '/financial-exposure', label: 'Financial Exposure', icon: <DollarSign size={15} /> },
      { to: '/investment-optimizer', label: 'Investment Analysis', icon: <TrendingUp size={15} /> },
      { to: '/what-if-simulator', label: 'What-If Simulator', icon: <GitBranch size={15} /> },
    ],
  },
  {
    title: 'Reporting & AI',
    items: [
      { to: '/executive-dashboard', label: 'Executive Dashboard', icon: <LayoutDashboard size={15} /> },
      { to: '/compliance', label: 'Compliance', icon: <FileBarChart2 size={15} /> },
      { to: '/attack-path', label: 'Attack Path Topology', icon: <Shield size={15} /> },
      { to: '/ai-assistant', label: 'AI Assistant', icon: <Sparkles size={15} /> },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { activeOrg } = useWorkspace();
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const r = await fetchApi<{ status: string }>('/api/health').catch(() => null);
        if (mounted) setIsOnline(r?.status === 'ok');
      } catch { if (mounted) setIsOnline(false); }
    };
    check();
    const t = setInterval(check, 10000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  return (
    <aside className="gov-sidebar">
      {/* Brand */}
      <div className="gov-brand" style={{ padding: '18px 18px 16px' }}>
        {/* Sleek Enterprise Cyber Shield Emblem */}
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(2,132,199,0.35)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <ShieldCheck size={22} color="#FFFFFF" />
        </div>

        <div className="gov-brand-text">
          <h1>CyberRiskOS</h1>
          <div className="tagline" style={{ color: '#38BDF8', letterSpacing: '0.1em' }}>
            Enterprise Defense
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="gov-nav-section">{section.title}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `gov-nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon" style={{ opacity: 0.8, lineHeight: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="gov-sidebar-footer">
        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <span className={`gov-status-dot ${isOnline ? 'online' : 'offline'}`} />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isOnline ? '#16A34A' : '#DC2626'
          }}>
            {isOnline ? 'Gateway Online' : 'Gateway Offline'}
          </span>
        </div>

        {/* Org */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            background: '#F1F5F9', border: '1px solid #E2E8F0',
            borderRadius: 6, padding: 6, lineHeight: 0
          }}>
            <Building2 size={14} color="#0284C7" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeOrg.name}
            </div>
            <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 1 }}>
              Enterprise Operations
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
