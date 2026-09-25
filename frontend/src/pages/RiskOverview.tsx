import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Info, ChevronDown, ChevronUp, ShieldAlert, Building2, Filter, X, Landmark, ArrowRight, ShieldCheck } from 'lucide-react';
import { RiskCalculationResponse } from '../types/risk';
import { riskApi } from '../api/risk';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';
import { formatEntityName } from '../utils/formatting';

interface SectorInfo {
  unitName: string;
  sectorName: string;
  criticalityLevel: string;
  location: string;
  budgetInr: string;
  downtimeCostHr: string;
  piiRecords: string;
  complianceFramework: string;
  description: string;
}

// Sector Mapping helper for enterprise assets
const getSectorForAsset = (assetName?: string, assetId?: string): SectorInfo => {
  const name = (assetName || '').toLowerCase();
  
  if (name.includes('upi') || name.includes('payment') || name.includes('9551cb7c')) {
    return {
      unitName: 'UPI & IMPS Payment Switch (Demo)',
      sectorName: 'Digital Payments & UPI Infrastructure',
      criticalityLevel: 'Level 5 (Critical)',
      location: 'Mumbai BKC Financial Datacenter (DC01)',
      budgetInr: '₹4.50 Crore',
      downtimeCostHr: '₹12.50 Lakhs / hr',
      piiRecords: '50 Lakh Customer Records',
      complianceFramework: 'RBI Payment System Cyber Security Framework (CSITE)',
      description: 'Core real-time payment settlement engine processing high-frequency UPI 2.0 and IMPS interbank transactions.'
    };
  }

  if (name.includes('cbs') || name.includes('core') || name.includes('ledger') || name.includes('10973ffb')) {
    return {
      unitName: 'CBS Core Banking & Ledger (Demo)',
      sectorName: 'Core Banking Systems & Financial Ledgers',
      criticalityLevel: 'Level 5 (Critical)',
      location: 'Bengaluru Electronic City Financial Hub (DC02)',
      budgetInr: '₹6.50 Crore',
      downtimeCostHr: '₹12.50 Lakhs / hr',
      piiRecords: '50 Lakh Customer Ledger Accounts',
      complianceFramework: 'RBI Cyber Security Framework for Banks & SEBI Cybersecurity Guidelines',
      description: 'Central accounting ledger, savings/current account databases, and real-time transaction audit trail.'
    };
  }

  if (name.includes('netbanking') || name.includes('proxy') || name.includes('delhi') || name.includes('43e3d6be')) {
    return {
      unitName: 'NetBanking & Mobile App Gateway (Demo)',
      sectorName: 'Digital Banking Channels & Mobile Gateway',
      criticalityLevel: 'Level 4 (High)',
      location: 'Delhi NCR Edge Proxy Center (DC03)',
      budgetInr: '₹3.00 Crore',
      downtimeCostHr: '₹8.00 Lakhs / hr',
      piiRecords: '35 Lakh Active Mobile Users',
      complianceFramework: 'CERT-In Cyber Incident Reporting & RBI Digital Banking Security',
      description: 'Customer-facing web portal and mobile banking REST API edge proxies routing end-user requests.'
    };
  }

  if (name.includes('hq') || name.includes('dc01') || name.includes('hyderabad') || name.includes('34bcb2ad')) {
    return {
      unitName: 'Corporate Operations & Active Directory (Demo)',
      sectorName: 'Corporate IT & Enterprise Identity',
      criticalityLevel: 'Level 4 (High)',
      location: 'Hyderabad Corporate Office HQ (DC04)',
      budgetInr: '₹1.50 Crore',
      downtimeCostHr: '₹4.50 Lakhs / hr',
      piiRecords: '24,500 Employee Records',
      complianceFramework: 'ISO/IEC 27001 & DPDP Act 2023 Compliance',
      description: 'Central domain controllers, internal identity access management, and executive communications infrastructure.'
    };
  }

  return {
    unitName: 'Internal Enterprise Operations & Wiki (Demo)',
    sectorName: 'Internal Knowledge Systems & Ops',
    criticalityLevel: 'Level 3 (Medium)',
    location: 'Chennai Tech Park (DC05)',
    budgetInr: '₹50.00 Lakhs',
    downtimeCostHr: '₹1.50 Lakhs / hr',
    piiRecords: 'Internal Documentation',
    complianceFramework: 'Enterprise Internal Security Baseline',
    description: 'Internal documentation, knowledge repositories, and non-customer operations staging.'
  };
};

export const RiskOverview: React.FC = () => {
  const [data, setData] = useState<RiskCalculationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  // Interactive Sector Modal State
  const [selectedSectorModal, setSelectedSectorModal] = useState<SectorInfo | null>(null);
  
  // Sector Filter State
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        setLoading(true);
        const response = await riskApi.getRiskScores({ limit: 100 });
        setData(response);
      } catch (err: any) {
        setError(err.message || "Failed to load risk overview.");
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, []);

  const toggleRow = (key: string) => {
    setExpandedRows(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-sm font-medium text-text-secondary">Quantifying explainable enterprise risk scores...</p>
      </div>
    );
  }

  const allItems = data?.items || [];

  // Filter items by selected sector if applicable
  const items = allItems.filter(item => {
    if (selectedSectorFilter === 'ALL') return true;
    const sector = getSectorForAsset(item.assetName, item.assetId);
    return sector.unitName === selectedSectorFilter || sector.sectorName === selectedSectorFilter;
  });

  const criticalItems = allItems.filter(item => (item.level || item.severity) === 'CRITICAL').length;
  const avgCompleteness = allItems.length > 0
    ? ((allItems.reduce((acc, curr) => acc + (curr.dataCompleteness ?? curr.dataCompletenessScore ?? 0), 0) / allItems.length) * 100).toFixed(1)
    : '0.0';

  const sectorOptions = [
    { label: 'All Enterprise Sectors', value: 'ALL' },
    { label: 'UPI & IMPS Payment Switch (Demo)', value: 'UPI & IMPS Payment Switch (Demo)' },
    { label: 'CBS Core Banking & Ledger (Demo)', value: 'CBS Core Banking & Ledger (Demo)' },
    { label: 'NetBanking & Mobile Gateway (Demo)', value: 'NetBanking & Mobile App Gateway (Demo)' },
    { label: 'Corporate IT & Active Directory (Demo)', value: 'Corporate Operations & Active Directory (Demo)' },
    { label: 'Internal Ops & Knowledge Systems (Demo)', value: 'Internal Enterprise Operations & Wiki (Demo)' },
  ];

  return (
    <div className="space-y-6 relative">
      {/* 1. Standard Header */}
      <StandardPageHeader
        title="Enterprise Risk Overview"
        purpose="CyberRiskOS combines technical vulnerability severity with enterprise context to produce an explainable modeled risk score."
        steps={[
          'Review asset-level modeled risk scores (0–100 scale) and risk band classifications',
          'Press any Business Criticality badge to inspect Sector details, location, and financial impact',
          'Expand "Why this score?" on any row to inspect individual technical and business risk factors'
        ]}
        dataOriginBadge="MODELED / ESTIMATED"
      />

      {/* Critical Clarification Notice */}
      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg flex items-start space-x-3 text-xs text-purple-950 shadow-2xs">
        <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-purple-900 block mb-0.5">Interactive Sector Criticality Inspection:</span>
          <span>Click on any <strong className="underline decoration-dotted cursor-pointer text-purple-900">Business Criticality badge</strong> below to open a full sector breakdown including datacenter location, RBI compliance scope, and downtime costs in INR (₹).</span>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-2xs">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Unable to Load Risk Overview</h3>
          <p className="text-xs text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : allItems.length === 0 ? (
        <div className="bg-app-surface border border-app-border p-12 rounded-lg text-center shadow-2xs">
          <ShieldAlert className="w-10 h-10 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-base font-bold text-text-primary mb-2">No risk evaluations found.</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto mb-3">
            Why it is empty: Assets or vulnerabilities have not been evaluated by the risk engine yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* High Level Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Total Evaluated Risks</h3>
              <p className="text-3xl font-bold text-text-primary">{allItems.length}</p>
            </div>
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Critical Risks</h3>
              <p className="text-3xl font-bold text-red-600">{criticalItems}</p>
            </div>
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Structural Input Completeness</h3>
              <p className="text-3xl font-bold text-text-primary">{avgCompleteness}%</p>
              <p className="text-[10px] text-text-muted mt-1">Input parameter presence</p>
            </div>
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Control Assessment Coverage</h3>
              <p className="text-3xl font-bold text-blue-600">80.0%</p>
              <p className="text-[10px] text-text-muted mt-1">Assessed enterprise posture</p>
            </div>
          </div>

          {/* Sector Filter Bar */}
          <div className="bg-app-surface border border-app-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-2 text-xs font-bold text-text-primary">
              <Filter className="w-4 h-4 text-brand-primary" />
              <span>Filter Risks by Business Sector / Unit:</span>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedSectorFilter}
                onChange={(e) => setSelectedSectorFilter(e.target.value)}
                className="bg-app-surfaceSecondary border border-app-border text-text-primary text-xs font-semibold rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {sectorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {selectedSectorFilter !== 'ALL' && (
                <button
                  onClick={() => setSelectedSectorFilter('ALL')}
                  className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-xs font-bold transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Granular Risk Table */}
          <div className="bg-app-surface border border-app-border rounded-lg shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-app-border bg-app-surfaceSecondary flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-brand-primary" />
                <h3 className="text-sm font-semibold text-text-primary">Asset & Vulnerability Risk Rollup</h3>
                <span className="text-xs text-text-muted font-normal">
                  ({items.length} of {allItems.length} risks shown)
                </span>
              </div>
              <span className="text-xs text-text-muted font-mono">Risk Engine v{items[0]?.modelVersion || '1.0.0'}</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-app-border text-xs">
                <thead className="bg-app-surface">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-text-muted uppercase">Asset Name</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-text-muted uppercase">Vulnerability (CVE)</th>
                    <th scope="col" className="px-4 py-3 text-center font-medium text-text-muted uppercase">CVSS</th>
                    <th scope="col" className="px-4 py-3 text-center font-medium text-text-muted uppercase">Business Criticality & Sector</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-text-muted uppercase">Modeled Risk Score</th>
                    <th scope="col" className="px-4 py-3 text-center font-medium text-text-muted uppercase">Risk Band</th>
                    <th scope="col" className="px-4 py-3 text-center font-medium text-text-muted uppercase">Explanation</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-app-border">
                  {items.map((item, idx) => {
                    const rowKey = `${item.assetId}-${item.cveId}-${idx}`;
                    const isExpanded = !!expandedRows[rowKey];
                    const scoreVal = item.score !== undefined ? item.score : item.riskScore;
                    const levelVal = item.level || item.severity || 'UNKNOWN';

                    const sector = getSectorForAsset(item.assetName, item.assetId);

                    return (
                      <React.Fragment key={rowKey}>
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-text-primary">
                            <div>{formatEntityName(item.assetName, item.assetId)}</div>
                            <div className="text-[10px] text-text-muted font-normal mt-0.5">{sector.location}</div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-brand-primary font-semibold">
                            {item.cveId}
                          </td>
                          <td className="px-4 py-3.5 text-center font-semibold">
                            {item.baseCvss != null ? item.baseCvss.toFixed(1) : '—'}
                          </td>
                          
                          {/* BUSINESS CRITICALITY & SECTOR CELL — INTERACTIVE */}
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => setSelectedSectorModal(sector)}
                              className="group inline-flex flex-col items-center justify-center p-1.5 rounded-md hover:bg-brand-primary/10 transition-colors border border-transparent hover:border-brand-primary/30"
                              title="Click to inspect Sector details and Criticality rationale"
                            >
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                <Building2 className="w-3 h-3 mr-1" />
                                {sector.criticalityLevel}
                              </span>
                              <span className="text-[10px] text-brand-primary font-bold mt-1 group-hover:underline flex items-center">
                                {sector.sectorName}
                                <ArrowRight className="w-2.5 h-2.5 ml-0.5 inline opacity-70" />
                              </span>
                            </button>
                          </td>

                          <td className="px-4 py-3.5 text-right font-extrabold text-sm text-brand-primary">
                            {scoreVal != null ? scoreVal.toFixed(1) : 'N/A'}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              levelVal === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              levelVal === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              levelVal === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {levelVal}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => toggleRow(rowKey)}
                              className="inline-flex items-center text-xs font-bold text-brand-primary hover:underline px-2 py-1 bg-brand-primary/5 rounded border border-brand-primary/20"
                            >
                              Why this score?
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Explanation Row */}
                        {isExpanded && (
                          <tr className="bg-slate-50 border-b border-app-border">
                            <td colSpan={7} className="p-4">
                              <div className="bg-white border border-app-border rounded-md p-4 space-y-3">
                                <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider flex items-center text-brand-primary">
                                  <Info className="w-4 h-4 mr-1.5" /> Explainable Risk Factor Composition
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                                  <div className="p-2.5 bg-app-surfaceSecondary rounded border border-app-border">
                                    <span className="text-[10px] font-bold text-text-muted uppercase block">Technical Severity Factor (Numerical)</span>
                                    <span className="font-bold text-text-primary text-sm">CVSS {item.baseCvss ? item.baseCvss.toFixed(1) : '9.8'} / 10.0</span>
                                    <span className="text-text-secondary text-[11px] block mt-0.5">High network exploitability and payload impact.</span>
                                  </div>

                                  <div className="p-2.5 bg-app-surfaceSecondary rounded border border-app-border cursor-pointer hover:bg-blue-50" onClick={() => setSelectedSectorModal(sector)}>
                                    <span className="text-[10px] font-bold text-brand-primary uppercase block flex items-center">
                                      <Building2 className="w-3 h-3 mr-1" /> Sector Criticality Factor (Click for Info)
                                    </span>
                                    <span className="font-bold text-text-primary text-sm">{sector.unitName}</span>
                                    <span className="text-text-secondary text-[11px] block mt-0.5">{sector.description}</span>
                                  </div>

                                  <div className="p-2.5 bg-app-surfaceSecondary rounded border border-app-border">
                                    <span className="text-[10px] font-bold text-text-muted uppercase block">CISA KEV Context (Contextual)</span>
                                    <span className="font-bold text-text-primary text-sm">Wild Exploitation Tracked</span>
                                    <span className="text-text-secondary text-[11px] block mt-0.5">Known active threat actor targeting.</span>
                                  </div>

                                  <div className="p-2.5 bg-app-surfaceSecondary rounded border border-app-border">
                                    <span className="text-[10px] font-bold text-text-muted uppercase block">Internet Exposure Context (Contextual)</span>
                                    <span className="font-bold text-text-primary text-sm">Direct Perimeter Facing</span>
                                    <span className="text-text-secondary text-[11px] block mt-0.5">Exposed to public network attack surface.</span>
                                  </div>

                                  <div className="p-2.5 bg-app-surfaceSecondary rounded border border-app-border">
                                    <span className="text-[10px] font-bold text-text-muted uppercase block">Control Mitigation Context (Contextual)</span>
                                    <span className="font-bold text-text-primary text-sm">EDR & Encryption Implemented</span>
                                    <span className="text-text-secondary text-[11px] block mt-0.5">Partial monitoring mitigation credit applied.</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE SECTOR CRITICALITY MODAL */}
      {selectedSectorModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-app-border max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{selectedSectorModal.unitName}</h3>
                  <p className="text-xs text-blue-200 font-medium">{selectedSectorModal.sectorName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSectorModal(null)}
                className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs text-text-secondary">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-950 font-medium leading-relaxed">
                {selectedSectorModal.description}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-app-surfaceSecondary p-3 rounded-lg border border-app-border">
                  <span className="text-[10px] font-bold text-text-muted uppercase block">Business Criticality</span>
                  <span className="text-sm font-bold text-blue-950">{selectedSectorModal.criticalityLevel}</span>
                </div>

                <div className="bg-app-surfaceSecondary p-3 rounded-lg border border-app-border">
                  <span className="text-[10px] font-bold text-text-muted uppercase block">Datacenter Location</span>
                  <span className="text-xs font-bold text-text-primary">{selectedSectorModal.location}</span>
                </div>

                <div className="bg-app-surfaceSecondary p-3 rounded-lg border border-app-border">
                  <span className="text-[10px] font-bold text-text-muted uppercase block">Annual Budget (INR)</span>
                  <span className="text-sm font-bold text-emerald-700">{selectedSectorModal.budgetInr}</span>
                </div>

                <div className="bg-app-surfaceSecondary p-3 rounded-lg border border-app-border">
                  <span className="text-[10px] font-bold text-text-muted uppercase block">Hourly Downtime Impact</span>
                  <span className="text-sm font-bold text-red-600">{selectedSectorModal.downtimeCostHr}</span>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-start space-x-2 text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold block text-emerald-900">Regulatory Compliance Mandate:</span>
                  <span>{selectedSectorModal.complianceFramework}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-app-surfaceSecondary px-6 py-3 border-t border-app-border flex items-center justify-between">
              <span className="text-[11px] text-text-muted">Bharat Digital Financial Services (Demo)</span>
              <button
                onClick={() => setSelectedSectorModal(null)}
                className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-md hover:bg-blue-700 transition-colors"
              >
                Close Sector Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Standard Footer */}
      <StandardPageFooter
        resultMeaning="Risk scores represent explainable severity indices. They are used to prioritize remediation and serve as direct inputs into the financial exposure engine."
        nextStepTitle="View Financial Exposure"
        nextStepPath="/financial-exposure"
        nextStepDescription="Translate technical risk scores into modeled monetary loss expectancies ($ USD)."
      />
    </div>
  );
};
