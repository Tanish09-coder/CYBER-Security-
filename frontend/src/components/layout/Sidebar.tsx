import React from 'react';
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
  GitMerge,
  Sparkles,
  Activity,
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-3 py-2 text-[12px] font-medium transition-colors border-l-2 ${
        isActive
          ? 'bg-gov-navyLight text-gov-navy border-gov-saffron font-bold'
          : 'text-[#BFD0EE] border-transparent hover:bg-white/10 hover:text-white'
      }`
    }
  >
    <span className="w-4 h-4 mr-2.5 flex-shrink-0 opacity-80">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-3 pt-4 pb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7FA3CF]">
    {label}
  </div>
);

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-60 flex flex-col select-none z-10 relative flex-shrink-0" style={{ background: '#001F5B' }}>
      
      {/* Brand Header */}
      <div className="flex flex-col items-start px-4 py-3 border-b" style={{ borderColor: '#0A3070', background: '#001040' }}>
        {/* Ashoka Chakra-style emblem area */}
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-white/10 border border-white/20">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white leading-tight tracking-tight">CyberRiskOS</h1>
            <p className="text-[9px] font-medium tracking-widest uppercase" style={{ color: '#FF6200' }}>
              Cyber Risk Intelligence
            </p>
          </div>
        </div>
        {/* Gov tagline bar */}
        <div className="w-full mt-1 pt-1.5 border-t border-white/10">
          <p className="text-[9px] text-[#7FA3CF] tracking-wide">
            भारत सरकार — Government of India
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-2">
        <SectionLabel label="Overview" />
        <NavItem to="/integrations"       icon={<Radio size={14} />}         label="Data Integrations" />

        <SectionLabel label="Intelligence" />
        <NavItem to="/vulnerabilities"    icon={<Bug size={14} />}           label="Vulnerabilities" />
        <NavItem to="/threat-intel"       icon={<Flame size={14} />}         label="Threat Intelligence" />

        <SectionLabel label="Environment" />
        <NavItem to="/assets"             icon={<Server size={14} />}        label="Assets" />
        <NavItem to="/controls"           icon={<ShieldAlert size={14} />}   label="Security Controls" />

        <SectionLabel label="Financial Risk" />
        <NavItem to="/risk-overview"      icon={<DollarSign size={14} />}    label="Risk Overview" />
        <NavItem to="/financial-exposure" icon={<DollarSign size={14} />}    label="Financial Exposure" />
        <NavItem to="/investment-optimizer" icon={<TrendingUp size={14} />}  label="Investment Analysis" />
        <NavItem to="/what-if-simulator"  icon={<Activity size={14} />}      label="What-If Simulator" />

        <SectionLabel label="Reporting" />
        <NavItem to="/executive-dashboard" icon={<CheckCircle2 size={14} />} label="Executive Dashboard" />
        <NavItem to="/compliance"          icon={<ShieldAlert size={14} />}  label="Compliance" />
        <NavItem to="/attack-path"         icon={<GitMerge size={14} />}     label="Attack Path" />
        <NavItem to="/ai-assistant"        icon={<Sparkles size={14} />}     label="AI Assistant" />
      </nav>

      {/* Bottom org info */}
      <div className="border-t" style={{ borderColor: '#0A3070' }}>
        <div className="px-3 py-2 flex items-center space-x-2">
          <div className="w-6 h-6 rounded-sm flex items-center justify-center bg-white/10 flex-shrink-0">
            <Building2 className="w-3.5 h-3.5 text-[#7FA3CF]" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-white truncate">BharatFin Demo Corp</p>
            <p className="text-[9px] text-[#7FA3CF]">Role: CISO / Risk Officer</p>
          </div>
        </div>
        <div className="px-3 py-1.5 flex items-center border-t" style={{ borderColor: '#0A3070' }}>
          <CheckCircle2 className="w-3 h-3 mr-1.5" style={{ color: '#138808' }} />
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#5DAF5D' }}>
            System Operational
          </span>
        </div>
      </div>
    </aside>
  );
};
