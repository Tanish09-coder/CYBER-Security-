import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, RefreshCw, Building2, ShieldCheck } from 'lucide-react';
import { fetchApi } from '../../api/client';
import { useWorkspace } from '../../context/WorkspaceContext';

const PAGE_META: Record<string, { title: string }> = {
  'integrations':         { title: 'Public Cyber Intelligence Integrations' },
  'vulnerabilities':      { title: 'Vulnerability Intelligence' },
  'assets':               { title: 'Enterprise Assets & Attack Surface' },
  'controls':             { title: 'Security Control Posture' },
  'threat-intel':         { title: 'Threat Intelligence & Outage Records' },
  'risk-overview':        { title: 'Enterprise Risk Overview' },
  'financial-exposure':   { title: 'Financial Loss Exposure' },
  'what-if-simulator':    { title: 'Scenario Risk Simulator' },
  'investment-optimizer': { title: 'Security Investment Optimizer' },
  'executive-dashboard':  { title: 'Executive Risk & Financial Summary' },
  'compliance':           { title: 'Compliance Framework Posture' },
  'attack-path':          { title: 'Attack Path Topology & Choke Points' },
  'ai-assistant':         { title: 'CyberRiskOS AI Explanation Assistant' },
  'breach-containment':   { title: 'Active Breach Containment AI Agent' },
};

export const Header: React.FC = () => {
  const location = useLocation();
  const seg = location.pathname.split('/')[1] || '';
  const meta = PAGE_META[seg] ?? { title: seg.replace(/-/g, ' ') };
  const { activeOrg, setShowFirstTimeTour } = useWorkspace();

  const [status, setStatus] = useState<'HEALTHY' | 'DEGRADED' | 'DISCONNECTED'>('HEALTHY');
  const [ts, setTs] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const r = await fetchApi<{ status: string; timestamp?: string }>('/api/health');
        if (!mounted) return;
        setStatus(r?.status === 'ok' ? 'HEALTHY' : 'DEGRADED');
        if (r?.timestamp) setTs(r.timestamp);
      } catch { if (mounted) setStatus('DISCONNECTED'); }
    };
    check();
    const t = setInterval(check, 10000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  const isOnline = status === 'HEALTHY';

  return (
    <header className="gov-header">
      {/* ── Enterprise Top Utility Bar ── */}
      <div className="gov-ministry-bar">
        <div className="gov-ministry-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="#38BDF8" />
            <span style={{ fontWeight: 700, letterSpacing: '0.04em' }}>
              CyberRiskOS Enterprise Platform
            </span>
          </div>
          <div className="gov-ministry-divider" />
          <span style={{ color: 'rgba(147,197,253,0.85)', fontWeight: 500 }}>
            Real-Time Cyber Defense & Risk Quantification Engine
          </span>
        </div>

        <div className="gov-ministry-right">
          {/* Live status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isOnline ? (
              <>
                <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
                  <span style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'rgba(134,239,172,0.4)',
                    animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite'
                  }} />
                  <span className="gov-status-dot online" />
                </span>
                <span style={{ color: 'rgba(134,239,172,0.95)', fontWeight: 700, fontSize: 11 }}>
                  ENGINE ONLINE
                </span>
              </>
            ) : (
              <>
                <span className="gov-status-dot offline" />
                <span style={{ color: 'rgba(252,165,165,0.95)', fontWeight: 700, fontSize: 11 }}>
                  {status}
                </span>
              </>
            )}
          </div>

          {ts && (
            <>
              <div className="gov-ministry-divider" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(147,197,253,0.7)' }}>
                <RefreshCw size={11} />
                <span>Verified: {new Date(ts).toLocaleTimeString()}</span>
              </div>
            </>
          )}

          <div className="gov-ministry-divider" />
          <button
            onClick={() => setShowFirstTimeTour(true)}
            title="Help & Product Tour"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 0, color: 'rgba(147,197,253,0.8)' }}
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </div>

      {/* ── Subtle Accent Border ── */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, #0284C7 0%, #38BDF8 50%, #6366F1 100%)' }} />

      {/* ── Page Title Bar ── */}
      <div className="gov-page-bar">
        <div className="gov-page-title">
          <h2>{meta.title}</h2>
        </div>

        {/* Org context badge */}
        <div className="gov-org-badge">
          <Building2 size={14} color="#0F172A" />
          <span style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: 12 }}>
            {activeOrg.name}
          </span>
          <span className="currency-tag" style={{ background: '#0284C7' }}>
            {activeOrg.currency || 'INR'} ₹
          </span>
        </div>
      </div>
    </header>
  );
};
