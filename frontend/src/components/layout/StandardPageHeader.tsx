import React from 'react';
import { HelpCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface StandardPageHeaderProps {
  title: string;
  purpose: string;
  steps: string[];
  dataOriginBadge?: 'REAL INTELLIGENCE' | 'DEMO ENTERPRISE DATA' | 'MODELED / ESTIMATED' | 'HYPOTHETICAL';
}

export const StandardPageHeader: React.FC<StandardPageHeaderProps> = ({
  title,
  purpose,
  steps,
  dataOriginBadge = 'DEMO ENTERPRISE DATA',
}) => {
  const getBadgeStyle = () => {
    switch (dataOriginBadge) {
      case 'REAL INTELLIGENCE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'MODELED / ESTIMATED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'HYPOTHETICAL':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Title & Purpose Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-app-border pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">{title}</h1>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold border uppercase tracking-wider ${getBadgeStyle()}`}>
              {dataOriginBadge}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1 font-normal leading-relaxed">{purpose}</p>
        </div>
      </div>

      {/* What do I do here? 2-3 Simple Steps Box */}
      <div className="bg-app-surface border border-app-border rounded-lg p-4 shadow-2xs">
        <div className="flex items-center space-x-2 text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
          <HelpCircle className="w-4 h-4 text-brand-primary" />
          <span>What do I do here?</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start space-x-2 bg-app-surfaceSecondary p-2.5 rounded border border-app-border">
              <span className="w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                {idx + 1}
              </span>
              <span className="text-text-secondary font-medium leading-snug">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export interface StandardPageFooterProps {
  resultMeaning: string;
  nextStepTitle: string;
  nextStepPath: string;
  nextStepDescription?: string;
}

export const StandardPageFooter: React.FC<StandardPageFooterProps> = () => {
  return null;
};
