import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Flame,
  DollarSign,
  Server,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Layers,
  HelpCircle,
  Play,
  RotateCcw
} from 'lucide-react';

interface StoryStep {
  id: number;
  title: string;
  stageName: string;
  headline: string;
  description: string;
}

const STORY_STEPS: StoryStep[] = [
  {
    id: 1,
    stageName: 'DETECT',
    title: '1. Detect Cyber Signal',
    headline: 'CRITICAL CYBER RISK DETECTED',
    description: 'Real-world vulnerability threat intelligence matched to installed enterprise software.',
  },
  {
    id: 2,
    stageName: 'UNDERSTAND',
    title: '2. Understand Business Impact',
    headline: 'WHY THIS MATTERS TO THE BUSINESS',
    description: 'Combining technical vulnerability severity with asset criticality and threat context.',
  },
  {
    id: 3,
    stageName: 'QUANTIFY',
    title: '3. Financial Impact',
    headline: 'QUANTIFY FINANCIAL EXPOSURE',
    description: 'Translating technical vulnerability risk into modeled annualized dollar loss.',
  },
  {
    id: 4,
    stageName: 'VISUALIZE',
    title: '4. Exposure & Attack Path',
    headline: 'MODELED ATTACK PATH TOPOLOGY',
    description: 'Visualizing hypothetical attack routes between connected enterprise systems.',
  },
  {
    id: 5,
    stageName: 'SIMULATE',
    title: '5. What-If Scenario',
    headline: 'SIMULATE REMEDIATION IMPACT',
    description: 'Testing the risk-reduction effect of software upgrades before taking real action.',
  },
  {
    id: 6,
    stageName: 'OPTIMIZE',
    title: '6. Investment Options',
    headline: 'SET BUDGET & CANDIDATES',
    description: 'Evaluating candidate remediation actions against available security budget.',
  },
  {
    id: 7,
    stageName: 'COMPARE',
    title: '7. Strategy Comparison',
    headline: 'OPTIMIZED REMEDIATION STRATEGIES',
    description: 'Comparing feasible mitigation strategies based on budget, risk reduction, and ROSI.',
  },
  {
    id: 8,
    stageName: 'DECIDE',
    title: '8. Executive Decision',
    headline: 'FROM CYBER SIGNAL TO BUSINESS DECISION',
    description: 'Boardroom-ready summary powering prioritized, defensible cybersecurity investments.',
  },
];

export const JudgeDemoExperience: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationRun, setSimulationRun] = useState<boolean>(false);
  const [selectedBudget, setSelectedBudget] = useState<number>(30000);

  // Hero Scenario Constants (Grounded in Apex Financial Enterprises Demo)
  const heroData = {
    systemName: 'UPI Switch Gateway Proxy',
    hostname: 'mumbai-upi-switch-01.bharatbank.internal',
    software: 'Atlassian Confluence / UPI Gateway 8.5.0',
    cve: 'CVE-2023-22515',
    cvss: 10.0,
    severity: 'CRITICAL',
    kevStatus: 'Active Exploitation (CISA KEV Verified)',
    businessRole: 'UPI Real-Time Payments Switch & API Gateway',
    criticality: 'Tier 1 — Mission Critical',
    exposure: 'Internet-Facing Gateway',
    currentRiskScore: 98.0,
    hypotheticalRiskScore: 15.0,

    // Financial Assumptions (Explicit Indian Demo Values in INR ₹)
    downtimeCostPerHour: 1250000, // ₹12.5 Lakhs / hr
    outageHours: 4,
    recoveryCost: 4000000, // ₹40 Lakhs Retainer
    alef: 0.25, // 1 incident every 4 years
    downtimeLoss: 5000000, // 4 * ₹12.5L = ₹50 Lakhs
    singleIncidentLoss: 9000000, // ₹50L + ₹40L = ₹90 Lakhs
    annualizedExposure: 2250000, // ₹90L * 0.25 = ₹22.5 Lakhs / yr
    hypotheticalExposure: 0,
  };

  const nextStep = () => {
    if (currentStep < 8) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-primary/20 to-slate-900 border border-brand-primary/30 rounded-xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-primary text-white">
                FLAGSHIP JUDGE STORY
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-900/60 text-purple-300 border border-purple-500/30">
                APEX FINANCIAL ENTERPRISES (DEMO)
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-primary" />
              CyberRiskOS — Guided Demo Experience
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Follow one complete enterprise story: <strong className="text-white">Which cyber risks matter most to the business, what could they cost, and where should limited budget be spent?</strong>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart Journey
            </button>
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showTechnicalDetails
                  ? 'border-brand-primary bg-brand-primary/20 text-brand-primary'
                  : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {showTechnicalDetails ? 'Hide Technical Evidence' : 'Show Technical Evidence'}
            </button>
          </div>
        </div>

        {/* STEP PROGRESS NAVIGATION BAR */}
        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-4 md:grid-cols-8 gap-2">
          {STORY_STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isPassed = step.id < currentStep;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex flex-col items-center p-2 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-brand-primary text-white font-bold shadow-md ring-2 ring-brand-primary/50'
                    : isPassed
                    ? 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800 border border-emerald-500/20'
                    : 'bg-slate-900/50 text-slate-500 hover:bg-slate-800/50'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                  STEP {step.id}
                </span>
                <span className="text-xs font-semibold truncate w-full text-center mt-0.5">
                  {step.stageName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DATA ORIGIN BADGES BAR */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
        <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
          Active Provenance:
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          REAL PUBLIC INTELLIGENCE (NVD / CISA KEV)
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-500/30">
          DEMO ENTERPRISE (APEX FINANCIAL)
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30">
          MODELED QUANTIFICATION
        </span>
      </div>

      {/* DYNAMIC STEP CONTENT STAGE */}
      <div className="bg-app-surface border border-app-border rounded-xl p-6 shadow-sm space-y-6">
        {/* STEP HEADER */}
        <div className="flex items-center justify-between border-b border-app-border pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-brand-primary">
              {STORY_STEPS[currentStep - 1].title}
            </div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight mt-1">
              {STORY_STEPS[currentStep - 1].headline}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {STORY_STEPS[currentStep - 1].description}
            </p>
          </div>
          <div className="text-xs text-text-muted font-semibold bg-app-surfaceSecondary px-3 py-1.5 rounded-lg border border-app-border">
            Stage {currentStep} of 8
          </div>
        </div>

        {/* STEP 1: DETECT */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-red-950/20 border border-red-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-500 text-white animate-pulse">
                    CRITICAL ALERT
                  </span>
                  <span className="text-xs font-semibold text-red-400">
                    High-Risk Asset Exposure Identified
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{heroData.systemName}</h3>
                <p className="text-xs text-slate-300">
                  System Role: <strong className="text-white">{heroData.businessRole}</strong> ({heroData.criticality})
                </p>
              </div>
              <div className="bg-slate-900/90 p-4 rounded-lg border border-red-500/40 text-center min-w-[200px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Technical Severity
                </div>
                <div className="text-3xl font-black text-red-500 mt-1">CRITICAL</div>
                <div className="text-xs text-red-400 font-semibold mt-0.5">CVSS 10.0 Maximum</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-app-surfaceSecondary border border-app-border space-y-1">
                <div className="text-xs font-semibold text-text-secondary">Installed Application</div>
                <div className="text-sm font-bold text-text-primary">{heroData.software}</div>
                <div className="text-[11px] text-text-muted">Discovered via automated asset catalog</div>
              </div>
              <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                <div className="text-xs font-semibold text-emerald-400">Threat Intelligence Status</div>
                <div className="text-sm font-bold text-emerald-300">{heroData.kevStatus}</div>
                <div className="text-[11px] text-emerald-400/80">Sourced from CISA Known Exploited Vulnerabilities Catalog</div>
              </div>
              <div className="p-4 rounded-lg bg-app-surfaceSecondary border border-app-border space-y-1">
                <div className="text-xs font-semibold text-text-secondary">Exposure Boundary</div>
                <div className="text-sm font-bold text-text-primary">{heroData.exposure}</div>
                <div className="text-[11px] text-text-muted">Directly accessible from public Internet</div>
              </div>
            </div>

            {showTechnicalDetails && (
              <div className="p-4 rounded-lg bg-slate-900 text-slate-300 font-mono text-xs border border-slate-800 space-y-2">
                <div className="text-brand-primary font-bold">TECHNICAL EVIDENCE DISCLOSURE</div>
                <div>CVE Identifier: {heroData.cve}</div>
                <div>Internal Asset Hostname: {heroData.hostname}</div>
                <div>CISA KEV Entry Date: 2023-10-16</div>
                <div>Vulnerability Summary: Atlassian Confluence Data Center and Server Broken Access Control</div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: UNDERSTAND */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-text-primary">
                  Why this vulnerability matters to enterprise decision-makers
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  CyberRiskOS does not treat all critical vulnerabilities equally. A CVSS 10.0 vulnerability on an isolated test machine has zero business risk. On {heroData.systemName}, the context multiplies the threat.
                </p>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-app-surfaceSecondary border border-app-border flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">Technical Severity</span>
                    <span className="font-bold text-red-500">Maximum (CVSS 10.0)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-app-surfaceSecondary border border-app-border flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">Business Importance</span>
                    <span className="font-bold text-text-primary">Tier 1 — Mission Critical</span>
                  </div>
                  <div className="p-3 rounded-lg bg-app-surfaceSecondary border border-app-border flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">Internet Exposure</span>
                    <span className="font-bold text-amber-500">Publicly Reachable</span>
                  </div>
                  <div className="p-3 rounded-lg bg-app-surfaceSecondary border border-app-border flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">Active Threat Evidence</span>
                    <span className="font-bold text-emerald-400">Confirmed CISA KEV Exploitation</span>
                  </div>
                  <div className="p-3 rounded-lg bg-app-surfaceSecondary border border-app-border flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary">Security Control Posture</span>
                    <span className="font-bold text-red-400">MFA Missing / Patch Unapplied</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-xl border border-brand-primary/40 text-center space-y-4 shadow-xl">
                <div className="text-xs font-bold text-text-muted uppercase tracking-widest">
                  MODELED BUSINESS RISK SCORE
                </div>
                <div className="text-6xl font-black text-red-500 tracking-tight">
                  {heroData.currentRiskScore.toFixed(1)}
                  <span className="text-xl text-slate-500 font-normal"> / 100</span>
                </div>
                <div className="inline-block px-4 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 uppercase">
                  CRITICAL RISK BAND
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  "This score represents explainable quantitative enterprise risk. It is not breach probability."
                </p>
              </div>
            </div>

            {showTechnicalDetails && (
              <div className="p-4 rounded-lg bg-slate-900 text-slate-300 font-mono text-xs border border-slate-800 space-y-1">
                <div className="text-brand-primary font-bold">RISK MODEL FACTOR CONTRIBUTION</div>
                <div>Base Severity Weight: 100.0 (CVSS 10.0 * 10)</div>
                <div>Asset Criticality Multiplier: 1.0 (Tier 1)</div>
                <div>KEV Active Threat Multiplier: +15.0 Score Increment</div>
                <div>Internet Reachability Factor: 1.0</div>
                <div>Control Mitigation Credit: 0.0 (Unassessed / Partial)</div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: QUANTIFY FINANCIAL */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* DEMO FINANCIAL ASSUMPTIONS CARD */}
            <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold text-blue-300">Explicit Synthetic Financial Assumptions</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 uppercase">
                  DEMO ASSUMPTIONS
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-slate-400">Hourly Downtime Cost</div>
                  <div className="text-sm font-bold text-white">₹{heroData.downtimeCostPerHour.toLocaleString('en-IN')}/hr</div>
                </div>
                <div>
                  <div className="text-slate-400">Estimated Outage Duration</div>
                  <div className="text-sm font-bold text-white">{heroData.outageHours} Hours</div>
                </div>
                <div>
                  <div className="text-slate-400">Incident Recovery Cost</div>
                  <div className="text-sm font-bold text-white">₹{heroData.recoveryCost.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-slate-400">Annual Event Frequency</div>
                  <div className="text-sm font-bold text-white">{heroData.alef} / year (1 in 4 yrs)</div>
                </div>
              </div>
            </div>

            {/* FINANCIAL CALCULATION VISUAL FLOW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-5 rounded-xl bg-app-surfaceSecondary border border-app-border space-y-2">
                <div className="text-xs font-semibold text-text-secondary">Downtime Loss (4 hrs)</div>
                <div className="text-2xl font-bold text-text-primary">₹{heroData.downtimeLoss.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-text-muted">4 hours × ₹12.5 Lakhs/hr</div>
              </div>

              <div className="p-5 rounded-xl bg-app-surfaceSecondary border border-app-border space-y-2">
                <div className="text-xs font-semibold text-text-secondary">Single Incident Loss</div>
                <div className="text-2xl font-bold text-amber-500">₹{heroData.singleIncidentLoss.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-text-muted">₹50 Lakhs Downtime + ₹40 Lakhs Recovery</div>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-brand-primary/40 space-y-2 shadow-md">
                <div className="text-xs font-bold text-brand-primary uppercase tracking-widest">
                  MODELED ANNUAL FINANCIAL EXPOSURE
                </div>
                <div className="text-3xl font-black text-red-500">₹{heroData.annualizedExposure.toLocaleString('en-IN')}<span className="text-xs text-slate-400 font-normal">/yr</span></div>
                <div className="text-[11px] text-slate-400">₹90 Lakhs Loss × 0.25 Event Frequency</div>
              </div>
            </div>

            {showTechnicalDetails && (
              <div className="p-4 rounded-lg bg-slate-900 text-slate-300 font-mono text-xs border border-slate-800 space-y-1">
                <div className="text-brand-primary font-bold">FINANCIAL CONTRACT FORMULAS</div>
                <div>Single Loss Expectancy (SLE) = (Outage Hours * Hourly Rate) + Recovery Cost</div>
                <div>Annual Loss Expectancy (EAL) = SLE * Annual Event Frequency (ALEF)</div>
                <div>Currency: INR (Bharat Digital Financial Services Demo)</div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: VISUALIZE ATTACK PATH */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-purple-300">Modeled Enterprise Exposure Path</h3>
                <p className="text-xs text-purple-300/80">
                  This visual represents modeled network topology dependencies, not evidence of an active breach.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-purple-900 text-purple-200 uppercase tracking-wider">
                HYPOTHETICAL EXPOSURE PATH
              </span>
            </div>

            {/* VISUAL PATH MAP */}
            <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 overflow-x-auto">
              <div className="flex flex-col items-center p-4 rounded-xl bg-red-950/40 border border-red-500/40 min-w-[180px] text-center">
                <Flame className="w-8 h-8 text-red-500 mb-2" />
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">ENTRY POINT</span>
                <span className="text-xs font-bold text-white mt-1">Public Internet</span>
              </div>

              <ArrowRight className="w-6 h-6 text-slate-600 hidden md:block" />

              <div className="flex flex-col items-center p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 min-w-[200px] text-center ring-2 ring-amber-500/40">
                <Server className="w-8 h-8 text-amber-400 mb-2" />
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">VULNERABLE ASSET</span>
                <span className="text-xs font-bold text-white mt-1">{heroData.systemName}</span>
                <span className="text-[10px] text-amber-400 mt-0.5">Atlassian Confluence (CVE-2023-22515)</span>
              </div>

              <ArrowRight className="w-6 h-6 text-slate-600 hidden md:block" />

              <div className="flex flex-col items-center p-4 rounded-xl bg-slate-900 border border-slate-700 min-w-[200px] text-center">
                <Layers className="w-8 h-8 text-blue-400 mb-2" />
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">INTERNAL DEPENDENCY</span>
                <span className="text-xs font-bold text-white mt-1">Corporate Identity Server</span>
                <span className="text-[10px] text-slate-400 mt-0.5">idp-server-01.apex.internal</span>
              </div>

              <ArrowRight className="w-6 h-6 text-slate-600 hidden md:block" />

              <div className="flex flex-col items-center p-4 rounded-xl bg-red-950/60 border border-red-500/60 min-w-[200px] text-center">
                <ShieldAlert className="w-8 h-8 text-red-400 mb-2" />
                <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider">CRITICAL TARGET</span>
                <span className="text-xs font-bold text-white mt-1">Core Banking Database</span>
                <span className="text-[10px] text-red-400 mt-0.5">core-db-cluster-01 (Tier 1)</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: WHAT-IF SIMULATOR */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-app-surfaceSecondary border border-app-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Preselected Scenario Target</h3>
                <p className="text-xs text-text-secondary">
                  Target Asset: <strong>{heroData.systemName}</strong> | Proposed Action: <strong>Upgrade Atlassian Confluence to v8.5.3</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setIsSimulating(true);
                  setTimeout(() => {
                    setIsSimulating(false);
                    setSimulationRun(true);
                  }, 800);
                }}
                disabled={isSimulating}
                className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
              >
                <Play className="w-4 h-4" />
                {isSimulating ? 'Simulating Math Engine...' : 'RUN WHAT-IF SIMULATION'}
              </button>
            </div>

            {/* SIDE BY SIDE COMPARISON */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CURRENT BASELINE */}
              <div className="p-6 rounded-xl bg-slate-900 border border-red-500/40 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400">CURRENT BASELINE</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-500/30">
                    VULNERABILITY PRESENT
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-400">Modeled Risk Score</div>
                    <div className="text-3xl font-black text-red-500">{heroData.currentRiskScore.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Annual Financial Exposure</div>
                    <div className="text-2xl font-bold text-white">${heroData.annualizedExposure.toLocaleString()}/yr</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Vulnerability Status</div>
                    <div className="text-xs font-semibold text-red-400">Unpatched Atlassian Confluence 8.5.0</div>
                  </div>
                </div>
              </div>

              {/* HYPOTHETICAL AFTER REMEDIATION */}
              <div className={`p-6 rounded-xl border transition-all space-y-4 ${
                simulationRun
                  ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg'
                  : 'bg-slate-900/50 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">HYPOTHETICAL POST-PATCH STATE</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    HYPOTHETICAL SCENARIO
                  </span>
                </div>
                {simulationRun ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-400">Modeled Residual Risk Score</div>
                      <div className="text-3xl font-black text-emerald-400">{heroData.hypotheticalRiskScore.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Annual Financial Exposure Remaining</div>
                      <div className="text-2xl font-bold text-emerald-300">$0 / yr</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Vulnerability Status</div>
                      <div className="text-xs font-semibold text-emerald-400">CVE-2023-22515 Remediated</div>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-center text-xs text-slate-500 space-y-2">
                    <HelpCircle className="w-8 h-8 text-slate-600" />
                    <span>Click "RUN WHAT-IF SIMULATION" to calculate hypothetical posture improvement</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: INVESTMENT OPTIONS */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-app-surfaceSecondary border border-app-border">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Demo Budget Presets (INR ₹)</h3>
                <p className="text-xs text-text-secondary">Select available cybersecurity remediation budget for optimization modeling</p>
              </div>
              <div className="flex items-center space-x-2">
                {[1000000, 2500000, 5000000, 10000000].map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBudget(b)}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                      selectedBudget === b
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'bg-app-surface border border-app-border text-text-secondary hover:bg-app-surfaceSecondary'
                    }`}
                  >
                    {b >= 10000000 ? `₹${(b / 10000000).toFixed(0)}Cr` : `₹${(b / 100000).toFixed(0)}L`}
                  </button>
                ))}
              </div>
            </div>

            {/* CANDIDATE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-app-surfaceSecondary border border-app-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30 uppercase">
                    CANDIDATE 1
                  </span>
                  <span className="text-xs font-bold text-brand-primary">₹8,30,000 COST</span>
                </div>
                <h4 className="text-sm font-bold text-text-primary">Upgrade UPI Switch Edge Firewall</h4>
                <p className="text-xs text-text-secondary">Addresses critical CVE-2023-22515 on Mumbai UPI Gateway</p>
                <div className="pt-2 border-t border-app-border text-xs text-emerald-500 font-semibold">
                  Exposure Addressed: ₹22,50,000/yr
                </div>
              </div>

              <div className="p-4 rounded-xl bg-app-surfaceSecondary border border-app-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30 uppercase">
                    CANDIDATE 2
                  </span>
                  <span className="text-xs font-bold text-brand-primary">₹12,50,000 COST</span>
                </div>
                <h4 className="text-sm font-bold text-text-primary">Patch Core Banking Ledger DB</h4>
                <p className="text-xs text-text-secondary">Remediates critical CVE-2021-44228 Log4j flaw on Bengaluru CBS</p>
                <div className="pt-2 border-t border-app-border text-xs text-emerald-500 font-semibold">
                  Exposure Addressed: ₹45,00,000/yr
                </div>
              </div>

              <div className="p-4 rounded-xl bg-app-surfaceSecondary border border-app-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30 uppercase">
                    CANDIDATE 3
                  </span>
                  <span className="text-xs font-bold text-brand-primary">₹5,00,000 COST</span>
                </div>
                <h4 className="text-sm font-bold text-text-primary">Deploy Enforced Hardware MFA</h4>
                <p className="text-xs text-text-secondary">Implements FIDO2 keys across NetBanking administrator endpoints</p>
                <div className="pt-2 border-t border-app-border text-xs text-emerald-500 font-semibold">
                  Control Credit: +35% Protection
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: STRATEGY COMPARISON */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* STRATEGY A */}
              <div className="p-6 rounded-xl bg-slate-900 border border-brand-primary/50 space-y-4 shadow-lg ring-2 ring-brand-primary/30">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">STRATEGY A (MAXIMIZED RISK REDUCTION)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    RECOMMENDED
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Budget Used:</span>
                    <span className="font-bold text-white">₹20.8 Lakhs / ₹25 Lakhs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Actions Included:</span>
                    <span className="font-bold text-white">Patch CBS DB + Upgrade UPI Switch</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Residual Annual Exposure:</span>
                    <span className="font-bold text-emerald-400">₹2.5 Lakhs / yr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Modeled ROSI:</span>
                    <span className="font-bold text-emerald-300">420% Return</span>
                  </div>
                </div>
              </div>

              {/* STRATEGY B */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">STRATEGY B (BALANCED GATEWAY FOCUS)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    FEASIBLE
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Budget Used:</span>
                    <span className="font-bold text-white">₹13.3 Lakhs / ₹25 Lakhs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Actions Included:</span>
                    <span className="font-bold text-white">Upgrade UPI Switch + Deploy MFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Residual Annual Exposure:</span>
                    <span className="font-bold text-amber-400">₹8.5 Lakhs / yr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Modeled ROSI:</span>
                    <span className="font-bold text-emerald-300">340% Return</span>
                  </div>
                </div>
              </div>

              {/* STRATEGY C */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">STRATEGY C (MINIMUM COST)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    FEASIBLE
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Budget Used:</span>
                    <span className="font-bold text-white">₹5.0 Lakhs / ₹25 Lakhs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Actions Included:</span>
                    <span className="font-bold text-white">Deploy MFA Only</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Residual Annual Exposure:</span>
                    <span className="font-bold text-red-400">₹22.5 Lakhs / yr (UPI Gateway Open)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Modeled ROSI:</span>
                    <span className="font-bold text-amber-400">110% Return</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: EXECUTIVE DECISION */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-gradient-to-r from-slate-900 via-brand-primary/20 to-slate-900 border border-brand-primary/40 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Executive Boardroom Decision Summary</h3>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-primary text-white">
                  DEFENSIBLE DECISION COMPLETE
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
                <div>
                  <div className="text-slate-400">Top Identified Risk</div>
                  <div className="text-sm font-bold text-white">{heroData.systemName}</div>
                </div>
                <div>
                  <div className="text-slate-400">Original Modeled Exposure</div>
                  <div className="text-sm font-bold text-red-400">₹22.5 Lakhs / year</div>
                </div>
                <div>
                  <div className="text-slate-400">Selected Remediation Budget</div>
                  <div className="text-sm font-bold text-white">₹20.8 Lakhs (Strategy A)</div>
                </div>
                <div>
                  <div className="text-slate-400">Residual Exposure Post-Investment</div>
                  <div className="text-sm font-bold text-emerald-400">₹2.5 Lakhs / year</div>
                </div>
              </div>
            </div>

            {/* CONNECTED JOURNEY MAP */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-center overflow-x-auto">
              <div className="font-bold text-red-400">DETECT (Signal)</div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="font-bold text-amber-400">QUANTIFY (₹22.5L)</div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="font-bold text-purple-400">SIMULATE (What-If)</div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="font-bold text-blue-400">OPTIMIZE (₹25L Budget)</div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="font-bold text-emerald-400">DECIDE (Strategy A)</div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate('/risk-overview')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                VIEW DETAILED TECHNICAL EVIDENCE
              </button>
              <button
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                RESTART DEMO EXPERIENCE
              </button>
            </div>
          </div>
        )}

        {/* STEP FOOTER CONTROL BUTTONS */}
        <div className="flex items-center justify-between pt-6 border-t border-app-border">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              currentStep === 1
                ? 'opacity-40 cursor-not-allowed text-text-muted bg-app-surfaceSecondary'
                : 'bg-app-surfaceSecondary hover:bg-app-border text-text-primary border border-app-border'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Step
          </button>

          <div className="text-xs text-text-muted font-medium">
            Stage <strong className="text-text-primary">{currentStep}</strong> of 8
          </div>

          <button
            onClick={nextStep}
            disabled={currentStep === 8}
            className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
              currentStep === 8
                ? 'opacity-40 cursor-not-allowed bg-app-surfaceSecondary text-text-muted'
                : 'bg-brand-primary hover:bg-brand-primary/90 text-white'
            }`}
          >
            {currentStep === 8 ? 'Journey Completed' : 'Next Step'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JudgeDemoExperience;
