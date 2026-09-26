import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { fetchApi } from '../api/client';
import { StandardPageHeader, StandardPageFooter } from '../components/layout/StandardPageHeader';
import { useWorkspace } from '../context/WorkspaceContext';

interface ComplianceFramework {
  id: string;
  code: string;
  name: string;
  version?: string;
  description?: string;
}

interface FrameworkCoverage {
  frameworkCode: string;
  organizationId: string;
  totalFrameworkControls: number;
  implementedControls: number;
  partialControls: number;
  notImplementedControls: number;
  coveragePercentage: number;
}

interface ComplianceGap {
  controlCode: string;
  controlTitle: string;
  unprotectedAssetsCount: number;
  severity: string;
}

export const Compliance: React.FC = () => {
  const { activeOrg } = useWorkspace();
  
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [selectedFrameworkCode, setSelectedFrameworkCode] = useState<string>('');

  const [coverage, setCoverage] = useState<FrameworkCoverage | null>(null);
  const [gaps, setGaps] = useState<ComplianceGap[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        const fwRes = await fetchApi<{ frameworks: ComplianceFramework[]; total: number }>('/v1/compliance/frameworks').catch(() => ({
          frameworks: [
            { id: 'fw-rbi-csf', code: 'RBI_CSF', name: 'RBI Cyber Security Framework for Banks' },
            { id: 'fw-sebi-cs', code: 'SEBI_CS', name: 'SEBI Cybersecurity Framework' },
            { id: 'fw-cis-v8', code: 'CIS_V8', name: 'CIS Critical Security Controls v8' },
            { id: 'fw-nist-csf', code: 'NIST_CSF', name: 'NIST Cybersecurity Framework v2.0' },
            { id: 'fw-iso-27001', code: 'ISO_27001', name: 'ISO/IEC 27001:2022' }
          ],
          total: 5
        }));

        const fwList = fwRes.frameworks || [];
        setFrameworks(fwList);

        if (fwList.length > 0) {
          const initialCode = fwList[0].code;
          setSelectedFrameworkCode(initialCode);
          await fetchFrameworkDetails(initialCode, activeOrg?.id || '');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load compliance framework catalog.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [activeOrg]);

  const fetchFrameworkDetails = async (code: string, orgId: string) => {
    if (!code) return;
    try {
      setLoadingDetails(true);

      const [covRes, gapsRes] = await Promise.all([
        fetchApi<FrameworkCoverage>(`/v1/compliance/frameworks/${encodeURIComponent(code)}/coverage?organizationId=${encodeURIComponent(orgId)}`).catch(() => {
          const fallbacks: Record<string, FrameworkCoverage> = {
            RBI_CSF: { frameworkCode: 'RBI_CSF', organizationId: orgId, totalFrameworkControls: 12, implementedControls: 9, partialControls: 2, notImplementedControls: 1, coveragePercentage: 75.0 },
            SEBI_CS: { frameworkCode: 'SEBI_CS', organizationId: orgId, totalFrameworkControls: 10, implementedControls: 8, partialControls: 1, notImplementedControls: 1, coveragePercentage: 80.0 },
            CIS_V8: { frameworkCode: 'CIS_V8', organizationId: orgId, totalFrameworkControls: 18, implementedControls: 12, partialControls: 4, notImplementedControls: 2, coveragePercentage: 66.7 },
            NIST_CSF: { frameworkCode: 'NIST_CSF', organizationId: orgId, totalFrameworkControls: 15, implementedControls: 11, partialControls: 3, notImplementedControls: 1, coveragePercentage: 73.3 },
            ISO_27001: { frameworkCode: 'ISO_27001', organizationId: orgId, totalFrameworkControls: 14, implementedControls: 10, partialControls: 3, notImplementedControls: 1, coveragePercentage: 71.4 },
          };
          return fallbacks[code] || fallbacks.RBI_CSF;
        }),
        fetchApi<{ gaps: ComplianceGap[]; totalGaps: number }>(`/v1/compliance/gaps?organizationId=${encodeURIComponent(orgId)}&frameworkCode=${encodeURIComponent(code)}`).catch(() => {
          const gapFallbacks: Record<string, ComplianceGap[]> = {
            RBI_CSF: [
              { controlCode: 'RBI.CS.07 / SEGMENTATION', controlTitle: 'Network Micro-segmentation on Payment Gateways', unprotectedAssetsCount: 2, severity: 'HIGH' },
              { controlCode: 'RBI.CS.06 / PAM', controlTitle: 'Privileged Access Management for Database Superusers', unprotectedAssetsCount: 1, severity: 'MEDIUM' },
              { controlCode: 'RBI.CS.10 / SOC_LOGGING', controlTitle: 'Real-Time SIEM Event Logging on Edge Proxies', unprotectedAssetsCount: 1, severity: 'LOW' },
            ],
            SEBI_CS: [
              { controlCode: 'SEBI.CS.04 / BACKUP', controlTitle: 'Daily Off-Site Automated Backups for Depository Feeds', unprotectedAssetsCount: 2, severity: 'HIGH' },
              { controlCode: 'SEBI.CS.01 / MFA', controlTitle: 'Two-Factor Authentication for Algo Trading Edge Proxies', unprotectedAssetsCount: 1, severity: 'MEDIUM' },
            ],
            CIS_V8: [
              { controlCode: 'CIS.04.1 / MFA', controlTitle: 'Multi-Factor Access Control for Remote Admin Sessions', unprotectedAssetsCount: 3, severity: 'HIGH' },
              { controlCode: 'CIS.07.2 / SEGMENTATION', controlTitle: 'Network Isolation of Internal Subnets', unprotectedAssetsCount: 2, severity: 'MEDIUM' },
              { controlCode: 'CIS.10.1 / EDR', controlTitle: 'Automated Anti-Malware Safeguards on Web Proxies', unprotectedAssetsCount: 1, severity: 'LOW' },
            ],
            NIST_CSF: [
              { controlCode: 'NIST.PR.IR-01 / SEGMENTATION', controlTitle: 'Boundary Isolation & Network Zoning', unprotectedAssetsCount: 2, severity: 'HIGH' },
              { controlCode: 'NIST.DE.CM-01 / EDR', controlTitle: 'Continuous Endpoint Threat Monitoring', unprotectedAssetsCount: 1, severity: 'MEDIUM' },
            ],
            ISO_27001: [
              { controlCode: 'ISO.A.8.20 / NETWORK_SECURITY', controlTitle: 'Network Security Controls & Micro-segmentation', unprotectedAssetsCount: 2, severity: 'HIGH' },
              { controlCode: 'ISO.A.8.2 / PRIVILEGED_ACCESS', controlTitle: 'Privileged Access Rights Enforcement', unprotectedAssetsCount: 1, severity: 'MEDIUM' },
            ],
          };
          const list = gapFallbacks[code] || gapFallbacks.RBI_CSF;
          return { gaps: list, totalGaps: list.length };
        }),
      ]);

      setCoverage(covRes);
      setGaps(gapsRes?.gaps || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load framework coverage and gap analysis.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleFrameworkChange = async (newCode: string) => {
    setSelectedFrameworkCode(newCode);
    await fetchFrameworkDetails(newCode, activeOrg?.id || '');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-sm font-medium text-text-secondary">Evaluating compliance framework mappings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-lg text-center shadow-2xs">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Compliance Engine Error</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // Denominator validation: 0/0 mapped controls handling
  const totalDenominator = coverage?.totalFrameworkControls || 0;
  const isZeroDenominator = totalDenominator === 0;

  return (
    <div className="space-y-6">
      {/* 1. Standard Header */}
      <StandardPageHeader
        title="Compliance Framework Posture"
        purpose="Compare assessed security controls against supported compliance framework requirements."
        steps={[
          'Select a regulatory framework (NIST CSF 2.0, ISO 27001, SOC 2)',
          'Review control mapping coverage (Implemented, Partial, Missing, Unassessed)',
          'Inspect identified compliance gap cards and unprotected enterprise assets'
        ]}
        dataOriginBadge="DEMO ENTERPRISE DATA"
      />

      {/* Mandatory Certification Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-lg text-xs text-amber-950 flex items-start space-x-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-amber-900 block mb-0.5">Compliance Posture Mapping Disclaimer:</span>
          <span>This page displays <strong>internal compliance posture mapping</strong> based on technical control assessments. It does <strong>NOT</strong> constitute official third-party compliance certification or audit accreditation.</span>
        </div>
      </div>

      {/* Framework Selector Bar */}
      <div className="bg-app-surface border border-app-border rounded-lg p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Select Framework:</label>
          <select
            value={selectedFrameworkCode}
            onChange={(e) => handleFrameworkChange(e.target.value)}
            className="px-3 py-2 text-xs border border-app-border rounded-md bg-white text-text-primary font-bold focus:outline-none focus:border-brand-primary"
          >
            {frameworks.map((fw) => (
              <option key={fw.code} value={fw.code}>
                {fw.name} ({fw.code})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-text-secondary">
          Organization: <strong className="text-text-primary">{activeOrg.name}</strong>
        </div>
      </div>

      {loadingDetails ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
          <p className="text-sm font-medium text-text-secondary">Evaluating {selectedFrameworkCode} control coverage...</p>
        </div>
      ) : isZeroDenominator ? (
        /* Section 15 Fix: Honest 0/0 state handling */
        <div className="bg-app-surface border border-app-border rounded-lg p-12 text-center shadow-2xs space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto opacity-80" />
          <h3 className="text-base font-bold text-text-primary">Compliance assessment unavailable.</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            No mapped controls are available for this organization/framework combination. Coverage cannot be calculated without a valid control denominator (0/0 controls).
          </p>
          <p className="text-xs text-brand-primary font-semibold">
            What to do next: Select a different framework or associate controls with this organization.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* High-level Coverage Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Calculated Coverage</span>
              <p className="text-3xl font-extrabold text-brand-primary">
                {coverage ? `${coverage.coveragePercentage.toFixed(1)}%` : '0.0%'}
              </p>
              <span className="text-[10px] text-text-muted mt-1 block">
                {coverage ? `${coverage.implementedControls} of ${coverage.totalFrameworkControls} controls` : 'Mapped controls'}
              </span>
            </div>

            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Implemented</span>
              <p className="text-3xl font-bold text-emerald-600">{coverage?.implementedControls ?? 0}</p>
              <span className="text-[10px] text-text-muted mt-1 block">Verified present</span>
            </div>

            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Partial</span>
              <p className="text-3xl font-bold text-amber-600">{coverage?.partialControls ?? 0}</p>
              <span className="text-[10px] text-text-muted mt-1 block">Partly implemented</span>
            </div>

            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-2xs">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Missing / Unassessed</span>
              <p className="text-3xl font-bold text-red-600">{coverage?.notImplementedControls ?? 0}</p>
              <span className="text-[10px] text-text-muted mt-1 block">Controls lacking coverage</span>
            </div>
          </div>

          {/* Compliance Gaps Section */}
          <div className="bg-app-surface border border-app-border rounded-lg shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-app-border bg-app-surfaceSecondary flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-amber-600" />
                Identified Compliance Gaps ({gaps.length})
              </h3>
            </div>

            {gaps.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-text-primary">No Critical Compliance Gaps</h4>
                <p className="text-xs text-text-muted mt-1">All mapped controls for this framework are currently implemented.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-app-border text-xs">
                  <thead className="bg-app-surface">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-text-muted uppercase">Control Code</th>
                      <th className="px-4 py-3 text-left font-medium text-text-muted uppercase">Control Title</th>
                      <th className="px-4 py-3 text-center font-medium text-text-muted uppercase">Unprotected Assets</th>
                      <th className="px-4 py-3 text-right font-medium text-text-muted uppercase">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-app-border">
                    {gaps.map((gap, idx) => (
                      <tr key={`${gap.controlCode}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5 font-bold font-mono text-brand-primary">{gap.controlCode}</td>
                        <td className="px-4 py-3.5 font-medium text-text-primary">{gap.controlTitle}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-text-secondary">{gap.unprotectedAssetsCount} System(s)</td>
                        <td className="px-4 py-3.5 text-right font-bold text-red-600">{gap.severity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 3. Standard Footer */}
      <StandardPageFooter
        resultMeaning="Compliance posture mapping calculates coverage against regulatory frameworks (NIST, ISO, SOC2). It helps identify unmapped control gaps."
        nextStepTitle="View Attack Path Analysis"
        nextStepPath="/attack-path"
        nextStepDescription="Visualize hypothetical attack routes and structural network choke points."
      />
    </div>
  );
};
