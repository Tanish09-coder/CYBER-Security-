import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PageContainer } from './components/layout/PageContainer';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { DemoIndicator } from './components/common/DemoIndicator';
import { FirstTimeTourModal } from './components/common/FirstTimeTourModal';


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
import { BreachContainmentAgent } from './pages/BreachContainmentAgent';
import { JudgeDemoExperience } from './pages/JudgeDemoExperience';

export const App: React.FC = () => {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen bg-app-bg text-text-primary overflow-hidden flex-col">
        {/* Top Global Demo Indicator */}
        <DemoIndicator />
        
        <div className="flex-1 flex min-w-0 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header />
            {/* Main Page Container */}
            <PageContainer>
              <Routes>
                <Route path="/" element={<Navigate to="/integrations" replace />} />
                <Route path="/demo" element={<JudgeDemoExperience />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/vulnerabilities" element={<Vulnerabilities />} />
                <Route path="/vulnerabilities/:cveId" element={<VulnerabilityDetail />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/controls" element={<Controls />} />
                <Route path="/threat-intel" element={<ThreatIntel />} />
                <Route path="/breach-containment" element={<BreachContainmentAgent />} />
                <Route path="/risk-overview" element={<RiskOverview />} />
                <Route path="/financial-exposure" element={<FinancialExposure />} />
                <Route path="/what-if-simulator" element={<WhatIfSimulator />} />
                <Route path="/investment-optimizer" element={<InvestmentOptimizer />} />
                <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/attack-path" element={<AttackPath />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="*" element={<Navigate to="/demo" replace />} />
              </Routes>
            </PageContainer>
          </div>
        </div>


        {/* Onboarding First-Time Tour Modal */}
        <FirstTimeTourModal />
      </div>
    </WorkspaceProvider>
  );
};

export default App;

