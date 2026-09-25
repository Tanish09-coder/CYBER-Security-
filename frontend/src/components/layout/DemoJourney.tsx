import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Compass, HelpCircle } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export interface JourneyStep {
  step: number;
  path: string;
  title: string;
  shortDesc: string;
}

export const JOURNEY_STEPS: JourneyStep[] = [
  { step: 1, path: '/integrations', title: 'Integrations', shortDesc: 'Real Public Threat Intelligence Sources' },
  { step: 2, path: '/vulnerabilities', title: 'Vulnerabilities', shortDesc: 'NVD CVEs & Software Flaws' },
  { step: 3, path: '/threat-intel', title: 'Threat Intel', shortDesc: 'CISA KEV Exploitation & ATT&CK Tactics' },
  { step: 4, path: '/assets', title: 'Enterprise Assets', shortDesc: 'Systems & Installed Software' },
  { step: 5, path: '/controls', title: 'Security Controls', shortDesc: 'Mitigation Status & Coverage' },
  { step: 6, path: '/risk-overview', title: 'Risk Overview', shortDesc: 'Explainable Modeled Risk Scores' },
  { step: 7, path: '/financial-exposure', title: 'Financial Exposure', shortDesc: 'Modeled Annualized Loss (EAL)' },
  { step: 8, path: '/what-if-simulator', title: 'What-If Simulator', shortDesc: 'Hypothetical Security Interventions' },
  { step: 9, path: '/investment-optimizer', title: 'Investment Optimizer', shortDesc: 'Budget Allocation & ROSI Strategies' },
];

export const DemoJourney: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { demoJourneyStep, setDemoJourneyStep, setShowFirstTimeTour } = useWorkspace();

  // Determine current step index based on location pathname
  const currentJourneyIndex = JOURNEY_STEPS.findIndex(s => location.pathname.startsWith(s.path));
  const activeStepNumber = currentJourneyIndex !== -1 ? currentJourneyIndex + 1 : demoJourneyStep;
  const currentStepInfo = JOURNEY_STEPS[activeStepNumber - 1] || JOURNEY_STEPS[0];

  const handleNext = () => {
    if (activeStepNumber < 9) {
      const nextStep = JOURNEY_STEPS[activeStepNumber];
      setDemoJourneyStep(nextStep.step);
      navigate(nextStep.path);
    }
  };

  const handlePrev = () => {
    if (activeStepNumber > 1) {
      const prevStep = JOURNEY_STEPS[activeStepNumber - 2];
      setDemoJourneyStep(prevStep.step);
      navigate(prevStep.path);
    }
  };

  return (
    <div className="bg-app-surfaceSecondary border-b border-app-border px-6 py-2 flex flex-wrap items-center justify-between gap-2 z-20 text-xs">
      <div className="flex items-center space-x-3">
        <div className="flex items-center text-brand-primary font-bold tracking-wide uppercase text-[11px]">
          <Compass className="w-4 h-4 mr-1.5 text-brand-primary animate-pulse" />
          <span>Demo Journey</span>
        </div>

        <div className="h-4 w-px bg-app-border" />

        <div className="flex items-center space-x-1.5">
          <span className="font-bold text-text-primary bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full text-[11px]">
            Step {activeStepNumber} of 9
          </span>
          <span className="font-semibold text-text-primary hidden md:inline">
            {currentStepInfo.title}:
          </span>
          <span className="text-text-secondary text-[11px] hidden lg:inline">
            {currentStepInfo.shortDesc}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => navigate('/demo')}
          className="flex items-center text-[11px] font-bold text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/50 transition-colors mr-1"
          title="Open Flagship WOW Judge Story"
        >
          <Compass className="w-3.5 h-3.5 mr-1 text-amber-400" />
          <span>Flagship Story</span>
        </button>

        <button
          onClick={() => setShowFirstTimeTour(true)}
          className="flex items-center text-[11px] text-text-muted hover:text-brand-primary px-2 py-1 rounded hover:bg-app-surface transition-colors mr-2"
          title="Restart First-Time Tour"
        >
          <HelpCircle className="w-3.5 h-3.5 mr-1" />
          <span>Guide</span>
        </button>

        <button
          onClick={handlePrev}
          disabled={activeStepNumber <= 1}
          className="flex items-center px-2.5 py-1 rounded border border-app-border bg-app-surface text-text-primary hover:bg-app-surfaceSecondary disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={activeStepNumber >= 9}
          className="flex items-center px-3 py-1 rounded bg-brand-primary text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-colors shadow-xs"
        >
          Next Step
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>
    </div>
  );
};
