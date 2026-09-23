import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Server,
  Bug,
  Flame,
  Sliders,
  TrendingUp,
  GitFork,
  FileCheck2,
  FileText,
  Radio,
  Settings,
  HelpCircle,
  Building2,
  Lock,
} from 'lucide-react';
import { NavItemKey } from './types';

// =============================================================================
// CyberRiskOS - Main Structural Application Shell (PRD Section 32.4 & 32.5)
// Light enterprise analytics layout: fixed left sidebar, top header, main content
// =============================================================================

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavItemKey>('overview');

  const navItems = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'risk-analysis', label: 'Risk Analysis', icon: ShieldAlert },
    { key: 'risk-drivers', label: 'Risk Drivers', icon: TrendingUp },
    { key: 'assets', label: 'Enterprise Assets', icon: Server },
    { key: 'vulnerabilities', label: 'Vulnerabilities', icon: Bug },
    { key: 'threats', label: 'Threat Intelligence', icon: Flame },
    { key: 'simulator', label: 'What-If Simulator', icon: Sliders },
    { key: 'optimizer', label: 'Investment Optimizer', icon: TrendingUp },
    { key: 'attack-paths', label: 'Attack Paths', icon: GitFork },
    { key: 'compliance', label: 'Compliance Mapping', icon: FileCheck2 },
    { key: 'reports', label: 'Reports', icon: FileText },
    { key: 'integrations', label: 'Telemetry & Feeds', icon: Radio },
    { key: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="flex h-screen bg-[#F7F8FA] text-[#111827] overflow-hidden">
      {/* ---------------- Sidebar Navigation (PRD Section 32.5) ---------------- */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col justify-between select-none">
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-[#E5E7EB] space-x-3">
            <div className="w-8 h-8 rounded bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-tight text-[#111827]">CyberRiskOS</h1>
              <p className="text-[11px] text-[#6B7280]">SIH 2026 Enterprise</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Decision Support
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  id={`nav-${item.key}`}
                  onClick={() => setActiveTab(item.key as NavItemKey)}
                  className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-[#F1F3F5] text-[#2563EB]'
                      : 'text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#111827]'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-2.5 ${isActive ? 'text-[#2563EB]' : 'text-[#9CA3AF]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User / Org Bottom Status */}
        <div className="p-3 border-t border-[#E5E7EB] bg-white">
          <div className="flex items-center space-x-2 px-2 py-1.5 rounded bg-[#F7F8FA] border border-[#E5E7EB]">
            <Building2 className="w-4 h-4 text-[#6B7280]" />
            <div className="overflow-hidden">
              <p className="text-[11px] font-medium text-[#111827] truncate">BharatFin Demo Corp</p>
              <p className="text-[10px] text-[#6B7280]">Role: CISO / Risk Officer</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ---------------- Main View Area (PRD Section 32.4) ---------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Contextual Header Bar */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-base font-semibold text-[#111827] capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F1F3F5] text-[#6B7280] font-mono">
              Live Evaluation
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Currency Context indicator */}
            <div className="text-right">
              <span className="text-[11px] text-[#6B7280] block">Valuation Currency</span>
              <span className="text-xs font-semibold text-[#111827]">INR (₹ Lakhs & Crores)</span>
            </div>
            <div className="h-6 w-px bg-[#E5E7EB]" />
            <button className="p-2 text-[#6B7280] hover:text-[#111827] rounded-md hover:bg-[#F7F8FA]">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Structural Blueprint Placeholder Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="text-sm font-semibold text-[#111827]">Structural Workspace Blueprint</h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Module: <code className="font-mono text-[#2563EB]">{activeTab}</code>
                  </p>
                </div>
                <span className="text-[11px] font-mono bg-blue-50 text-[#2563EB] px-2.5 py-1 rounded border border-blue-200">
                  Ready for Functional Implementation
                </span>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Project layout and architectural scaffolding established per PRD requirements. No functional business logic has been coded yet as requested.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
