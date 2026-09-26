import React from 'react';
import { HelpCircle } from 'lucide-react';

export interface StandardPageHeaderProps {
  title: string;
  purpose: string;
  steps: string[];
  dataOriginBadge?: 'REAL INTELLIGENCE' | 'DEMO ENTERPRISE DATA' | 'MODELED / ESTIMATED' | 'HYPOTHETICAL';
}

const BADGE_CLASSES: Record<string, string> = {
  'REAL INTELLIGENCE':   'gov-badge gov-badge-real',
  'DEMO ENTERPRISE DATA': 'gov-badge gov-badge-demo',
  'MODELED / ESTIMATED': 'gov-badge gov-badge-modeled',
  'HYPOTHETICAL':        'gov-badge gov-badge-hypo',
};

export const StandardPageHeader: React.FC<StandardPageHeaderProps> = ({
  title, purpose, steps, dataOriginBadge = 'DEMO ENTERPRISE DATA',
}) => (
  <div className="animate-fade-in" style={{ marginBottom: 24 }}>
    {/* Title row */}
    <div className="gov-section-header">
      <h1>
        {title}
        <span className={BADGE_CLASSES[dataOriginBadge] ?? 'gov-badge gov-badge-demo'}>
          {dataOriginBadge}
        </span>
      </h1>
      <p>{purpose}</p>
    </div>

    {/* Instruction box */}
    <div className="gov-instruction-box">
      <div className="gov-instruction-title">
        <HelpCircle size={14} color="var(--saffron)" />
        What do I do here?
      </div>
      <div className="gov-steps-grid">
        {steps.map((step, i) => (
          <div key={i} className="gov-step">
            <div className="gov-step-num">{i + 1}</div>
            <div className="gov-step-text">{step}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export interface StandardPageFooterProps {
  resultMeaning: string;
  nextStepTitle: string;
  nextStepPath: string;
  nextStepDescription?: string;
}

export const StandardPageFooter: React.FC<StandardPageFooterProps> = () => null;
