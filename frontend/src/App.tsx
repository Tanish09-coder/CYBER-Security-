import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PageContainer } from './components/layout/PageContainer';

import { Integrations } from './pages/Integrations';
import { Vulnerabilities } from './pages/Vulnerabilities';
import { VulnerabilityDetail } from './pages/VulnerabilityDetail';
import { Assets } from './pages/Assets';
import { Controls } from './pages/Controls';
import { ThreatIntel } from './pages/ThreatIntel';
import { RiskOverview } from './pages/RiskOverview';
import { FinancialExposure } from './pages/FinancialExposure';
import { WhatIfSimulator } from './pages/WhatIfSimulator';
import { InvestmentOptimizer } from './pages/InvestmentOptimizer';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';
import { Compliance } from './pages/Compliance';
import { AttackPath } from './pages/AttackPath';
import { AIAssistant } from './pages/AIAssistant';

export const App: React.FC = () => {
  return (
    <div className="flex h-screen bg-app-bg text-text-primary overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <PageContainer>
          <Routes>
            <Route path="/" element={<Navigate to="/integrations" replace />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/vulnerabilities" element={<Vulnerabilities />} />
            <Route path="/vulnerabilities/:cveId" element={<VulnerabilityDetail />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/controls" element={<Controls />} />
            <Route path="/threat-intel" element={<ThreatIntel />} />
            <Route path="/risk-overview" element={<RiskOverview />} />
            <Route path="/financial-exposure" element={<FinancialExposure />} />
            <Route path="/what-if-simulator" element={<WhatIfSimulator />} />
            <Route path="/investment-optimizer" element={<InvestmentOptimizer />} />
            <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/attack-path" element={<AttackPath />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="*" element={<Navigate to="/integrations" replace />} />
          </Routes>
        </PageContainer>
      </div>
    </div>
  );
};

export default App;
