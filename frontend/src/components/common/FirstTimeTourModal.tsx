import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Compass, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const FirstTimeTourModal: React.FC = () => {
  const navigate = useNavigate();
  const { showFirstTimeTour, setShowFirstTimeTour, setDemoJourneyStep } = useWorkspace();

  if (!showFirstTimeTour) return null;

  const handleStartTour = () => {
    localStorage.setItem('cyberriskos_tour_completed', 'true');
    setShowFirstTimeTour(false);
    setDemoJourneyStep(1);
    navigate('/integrations');
  };

  const handleSkipTour = () => {
    localStorage.setItem('cyberriskos_tour_completed', 'true');
    setShowFirstTimeTour(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-app-surface border border-app-border rounded-xl shadow-2xl max-w-xl w-full overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white relative">
          <button 
            onClick={handleSkipTour}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
              <Compass className="w-6 h-6 text-blue-300 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Guided Demo Experience</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Welcome to CyberRiskOS</h2>
            </div>
          </div>
          
          <p className="text-sm text-blue-100/90 mt-2 leading-relaxed">
            Continuous Cyber Risk Quantification & Financial Exposure Optimization.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-lg">
            <h3 className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1.5 flex items-center">
              <ShieldAlert className="w-4 h-4 mr-1.5" /> Core Executive Question
            </h3>
            <p className="text-sm font-semibold text-text-primary italic leading-relaxed">
              "Which cyber risks matter most to the business, what could they cost, and where should limited security budget be spent?"
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">What you will see in this demo:</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-start space-x-2 p-2 bg-app-surfaceSecondary rounded border border-app-border">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-text-primary block">Real Cyber Intelligence</span>
                  <span className="text-text-secondary">NVD CVEs, CISA KEV, MITRE ATT&CK</span>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-2 bg-app-surfaceSecondary rounded border border-app-border">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-text-primary block">Apex Financial (Demo)</span>
                  <span className="text-text-secondary">Synthetic Enterprise Context</span>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-2 bg-app-surfaceSecondary rounded border border-app-border">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-text-primary block">Financial Loss Models</span>
                  <span className="text-text-secondary">Modeled EAL ($150k/hr downtime)</span>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-2 bg-app-surfaceSecondary rounded border border-app-border">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-text-primary block">Investment Optimizer</span>
                  <span className="text-text-secondary">ROSI & Budget Allocation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-app-surfaceSecondary border-t border-app-border flex items-center justify-between">
          <button
            onClick={handleSkipTour}
            className="text-xs font-medium text-text-secondary hover:text-text-primary px-3 py-2 rounded hover:bg-app-surface transition-colors"
          >
            Skip Tour & Explore Freely
          </button>

          <button
            onClick={handleStartTour}
            className="flex items-center px-5 py-2 bg-brand-primary text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            Start 9-Step Guided Tour
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
