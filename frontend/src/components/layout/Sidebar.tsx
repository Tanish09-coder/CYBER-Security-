import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
<<<<<<< HEAD
  Radio, Bug, Server, ShieldAlert, Flame, Lock,
  Building2, DollarSign, TrendingUp, CheckCircle2,
  AlertCircle, Sparkles, LayoutDashboard, FileBarChart2,
  GitBranch, Shield, Activity
=======
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
>>>>>>> harsh/main
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
    title: 'Reporting',
    items: [
      { to: '/executive-dashboard', label: 'Executive Dashboard', icon: <LayoutDashboard size={15} /> },
      { to: '/compliance', label: 'Compliance', icon: <FileBarChart2 size={15} /> },
      { to: '/attack-path', label: 'Attack Path', icon: <Shield size={15} /> },
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
      {/* Tiranga bar */}
      <div className="tiranga-bar" />

      {/* Brand */}
      <div className="gov-brand">
        {/* Ashoka Chakra–style emblem */}
        <div className="gov-emblem">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" opacity="0.4"/>
            <circle cx="12" cy="12" r="4" fill="white" opacity="0.9"/>
            {/* Spokes */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15 * Math.PI) / 180;
              const x1 = 12 + 5 * Math.cos(angle);
              const y1 = 12 + 5 * Math.sin(angle);
              const x2 = 12 + 9.5 * Math.cos(angle);
              const y2 = 12 + 9.5 * Math.sin(angle);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="0.7" opacity="0.7"/>;
            })}
          </svg>
        </div>

        <div className="gov-brand-text">
          <h1>CyberRiskOS</h1>
          <div className="tagline">Cyber Risk Intelligence</div>
          <div className="hindi">भारत सरकार · Govt. of India</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="gov-nav-section">{section.title}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `gov-nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon" style={{ opacity: 0.75, lineHeight: 0 }}>{item.icon}</span>
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
            color: isOnline ? 'rgba(134,239,172,0.9)' : 'rgba(252,165,165,0.9)'
          }}>
            {isOnline ? 'Gateway Online' : 'Gateway Offline'}
          </span>
        </div>

        {/* Org */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 4, padding: 6, lineHeight: 0
          }}>
            <Building2 size={13} color="rgba(253,186,116,0.85)" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeOrg.name}
            </div>
            <div style={{ fontSize: 9.5, color: 'rgba(147,197,253,0.7)', marginTop: 1 }}>
              CISO / Risk Officer
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
