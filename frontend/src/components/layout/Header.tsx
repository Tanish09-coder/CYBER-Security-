import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, RefreshCw, Building2, Shield, Wifi, WifiOff } from 'lucide-react';
import { fetchApi } from '../../api/client';
import { useWorkspace } from '../../context/WorkspaceContext';

const PAGE_META: Record<string, { title: string; hindi: string }> = {
  'integrations':         { title: 'Public Cyber Intelligence Integrations', hindi: 'साइबर सूचना एकीकरण' },
  'vulnerabilities':      { title: 'Vulnerability Intelligence', hindi: 'भेद्यता सूचना' },
  'assets':               { title: 'Enterprise Assets', hindi: 'उद्यम संपत्तियाँ' },
  'controls':             { title: 'Security Control Posture', hindi: 'सुरक्षा नियंत्रण' },
  'threat-intel':         { title: 'Threat Intelligence', hindi: 'साइबर खतरा विश्लेषण' },
  'risk-overview':        { title: 'Enterprise Risk Overview', hindi: 'जोखिम अवलोकन' },
  'financial-exposure':   { title: 'Financial Exposure', hindi: 'वित्तीय जोखिम' },
  'what-if-simulator':    { title: 'Scenario Simulator', hindi: 'परिदृश्य सिमुलेटर' },
  'investment-optimizer': { title: 'Investment Optimizer', hindi: 'निवेश अनुकूलक' },
  'executive-dashboard':  { title: 'Executive Risk & Financial Summary', hindi: 'कार्यकारी डैशबोर्ड' },
  'compliance':           { title: 'Compliance Framework Posture', hindi: 'अनुपालन स्थिति' },
  'attack-path':          { title: 'Attack Path Analysis', hindi: 'आक्रमण पथ विश्लेषण' },
  'ai-assistant':         { title: 'AI Explanation Assistant', hindi: 'AI सहायक' },
};

export const Header: React.FC = () => {
  const location = useLocation();
  const seg = location.pathname.split('/')[1] || '';
  const meta = PAGE_META[seg] ?? { title: seg.replace(/-/g, ' '), hindi: '' };
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
      {/* ── MeitY Ministry Utility Bar ── */}
      <div className="gov-ministry-bar">
        <div className="gov-ministry-left">
          {/* MeitY shield icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={13} color="rgba(253,186,116,0.9)" />
            <span style={{ fontWeight: 600 }}>
              Ministry of Electronics &amp; Information Technology
            </span>
          </div>
          <div className="gov-ministry-divider" />
          <span style={{ color: 'rgba(147,197,253,0.8)', fontWeight: 500 }}>भारत सरकार</span>
          <div className="gov-ministry-divider" />
          <span style={{ color: 'rgba(147,197,253,0.6)', fontWeight: 400 }}>
            National Cyber Risk Intelligence Platform
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
                  CONNECTED
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
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 0, color: 'rgba(147,197,253,0.7)' }}
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>

      {/* ── Tiranga Stripe ── */}
      <div className="tiranga-bar" />

      {/* ── Page Title Bar ── */}
      <div className="gov-page-bar">
        <div className="gov-page-title">
          <h2>{meta.title}</h2>
          {meta.hindi && <div className="page-hindi">{meta.hindi}</div>}
        </div>

        {/* Org context badge */}
        <div className="gov-org-badge">
          <Building2 size={14} color="var(--navy)" />
          <span style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: 12 }}>
            {activeOrg.name}
          </span>
          <span className="currency-tag">
            {activeOrg.currency || 'INR'} ₹
          </span>
        </div>
      </div>
    </header>
  );
};
