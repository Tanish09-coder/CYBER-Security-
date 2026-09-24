import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, ShieldCheck, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { fetchApi } from '../api/client';

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

interface ComplianceEvidenceItem {
  id: string;
  complianceControlId: string;
  assetId?: string | null;
  evidenceUri: string;
  evidenceType: string;
  status: string;
  verifiedAt?: string | null;
  createdAt: string;
}

export const Compliance: React.FC = () => {
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [selectedFrameworkCode, setSelectedFrameworkCode] = useState<string>('');

  const [coverage, setCoverage] = useState<FrameworkCoverage | null>(null);
  const [gaps, setGaps] = useState<ComplianceGap[]>([]);
  const [evidence, setEvidence] = useState<ComplianceEvidenceItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Initial Load: Organizations & Frameworks
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch organizations
        const orgRes = await fetchApi<{ data: Array<{ id: string; name: string }> }>('/v1/organizations');
        const orgs = orgRes.data || [];
        setOrganizations(orgs);
        const orgId = orgs.length > 0 ? orgs[0].id : '';
        setSelectedOrgId(orgId);

        // Fetch compliance frameworks
        const fwRes = await fetchApi<{ frameworks: ComplianceFramework[]; total: number }>('/v1/compliance/frameworks');
        const fwList = fwRes.frameworks || [];
        setFrameworks(fwList);

        if (fwList.length > 0) {
          const initialCode = fwList[0].code;
          setSelectedFrameworkCode(initialCode);
          if (orgId) {
            await fetchFrameworkDetails(initialCode, orgId);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load compliance framework catalog.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // 2. Fetch Coverage, Gaps, and Evidence for chosen framework & organization
  const fetchFrameworkDetails = async (code: string, orgId: string) => {
    if (!code || !orgId) return;
    try {
      setLoadingDetails(true);

      const [covRes, gapsRes, evRes] = await Promise.all([
        fetchApi<FrameworkCoverage>(`/v1/compliance/frameworks/${encodeURIComponent(code)}/coverage?organizationId=${encodeURIComponent(orgId)}`).catch(() => null),
        fetchApi<{ gaps: ComplianceGap[]; totalGaps: number }>(`/v1/compliance/gaps?organizationId=${encodeURIComponent(orgId)}`).catch(() => ({ gaps: [], totalGaps: 0 })),
        fetchApi<{ evidence: ComplianceEvidenceItem[]; total: number }>(`/v1/compliance/evidence?organizationId=${encodeURIComponent(orgId)}`).catch(() => ({ evidence: [], total: 0 })),
      ]);

      setCoverage(covRes);
      setGaps(gapsRes?.gaps || []);
      setEvidence(evRes?.evidence || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load framework coverage and gap analysis.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleFrameworkChange = async (newCode: string) => {
    setSelectedFrameworkCode(newCode);
    if (selectedOrgId) {
      await fetchFrameworkDetails(newCode, selectedOrgId);
    }
  };

  const handleOrgChange = async (newOrgId: string) => {
    setSelectedOrgId(newOrgId);
    if (selectedFrameworkCode) {
      await fetchFrameworkDetails(selectedFrameworkCode, newOrgId);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-sm font-medium text-text-secondary">Evaluating compliance framework mappings and evidence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-lg text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-red-900 mb-2">Unable to Load Compliance Posture</h3>
          <p className="text-xs text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (frameworks.length === 0) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-app-surface border border-app-border p-8 rounded-lg max-w-md text-center shadow-sm">
          <ShieldCheck className="w-10 h-10 text-text-muted mx-auto mb-4" />
          <h3 className="text-base font-bold text-text-primary mb-2">No Compliance Frameworks Registered</h3>
          <p className="text-xs text-text-secondary">
            Compliance frameworks (e.g. NIST CSF, ISO 27001, SOC 2) have not been initialized.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center">
            <ShieldCheck className="w-6 h-6 mr-2 text-brand-primary" />
            Compliance Framework Posture
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Authoritative control mappings, gap analysis, and audit evidence across industry regulatory frameworks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {organizations.length > 1 && (
            <div className="flex items-center space-x-2">
              <label className="text-xs text-text-muted font-medium">Org:</label>
              <select
                value={selectedOrgId}
                onChange={(e) => handleOrgChange(e.target.value)}
                className="px-3 py-1.5 text-xs border border-app-border rounded-md bg-white text-text-primary focus:outline-none"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <label className="text-xs text-text-muted font-medium">Framework:</label>
            <select
              value={selectedFrameworkCode}
              onChange={(e) => handleFrameworkChange(e.target.value)}
              className="px-3 py-1.5 text-xs border border-app-border rounded-md bg-white text-text-primary font-medium focus:outline-none focus:border-brand-primary"
            >
              {frameworks.map((fw) => (
                <option key={fw.code} value={fw.code}>
                  {fw.name} ({fw.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loadingDetails ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
          <p className="text-sm font-medium text-text-secondary">Evaluating {selectedFrameworkCode} control coverage...</p>
        </div>
      ) : (
        <>
          {/* High-level Coverage Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Framework Coverage</h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {selectedFrameworkCode}
                </span>
              </div>
              <p className="text-3xl font-bold text-brand-primary">
                {coverage ? `${coverage.coveragePercentage.toFixed(1)}%` : '0.0%'}
              </p>
              <p className="text-xs text-text-muted mt-2">
                {coverage ? `${coverage.implementedControls} of ${coverage.totalFrameworkControls} controls implemented` : 'No coverage data'}
              </p>
            </div>

            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Implemented Controls</h3>
              <p className="text-3xl font-bold text-green-600">
                {coverage?.implementedControls ?? 0}
              </p>
              <p className="text-xs text-text-muted mt-2">Fully verified & active</p>
            </div>

            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Partial Controls</h3>
              <p className="text-3xl font-bold text-amber-600">
                {coverage?.partialControls ?? 0}
              </p>
              <p className="text-xs text-text-muted mt-2">Under active implementation</p>
            </div>

            <div className="bg-app-surface border border-app-border p-5 rounded-lg shadow-sm">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Unmapped / Missing</h3>
              <p className="text-3xl font-bold text-red-600">
                {coverage?.notImplementedControls ?? 0}
              </p>
              <p className="text-xs text-text-muted mt-2">Controls lacking coverage</p>
            </div>
          </div>

          {/* Compliance Gaps Section */}
          <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-app-border bg-surface-secondary flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-amber-600" />
                Identified Compliance Gaps ({gaps.length})
              </h3>
              <span className="text-xs text-text-muted">Unprotected Enterprise Assets</span>
            </div>

            {gaps.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-text-primary">No Critical Compliance Gaps</h4>
                <p className="text-xs text-text-muted mt-1">All mapped security controls for this organization are currently implemented or covered.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-app-border">
                  <thead className="bg-app-surface">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Control Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Control Title</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-text-muted uppercase">Unprotected Assets</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-app-border">
                    {gaps.map((gap, idx) => (
                      <tr key={`${gap.controlCode}-${idx}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-primary">
                          {gap.controlCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          {gap.controlTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-text-secondary">
                          {gap.unprotectedAssetsCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              gap.severity === 'HIGH'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {gap.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit Evidence Section */}
          <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-app-border bg-surface-secondary flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary flex items-center">
                <FileText className="w-4 h-4 mr-2 text-text-secondary" />
                Audit Evidence Repository ({evidence.length})
              </h3>
            </div>

            {evidence.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <h4 className="text-sm font-bold text-text-primary">No Audit Evidence Registered</h4>
                <p className="text-xs text-text-muted mt-1">Audit evidence records and verification documents have not yet been submitted for this organization.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-app-border">
                  <thead className="bg-app-surface">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Control</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Evidence Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">URI / Reference</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-text-muted uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">Verified Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-app-border">
                    {evidence.map((ev) => (
                      <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                          {ev.complianceControlId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-text-secondary uppercase">
                          {ev.evidenceType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-brand-primary truncate max-w-xs font-mono">
                          {ev.evidenceUri}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              ev.status === 'VERIFIED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-text-muted text-right">
                          {ev.verifiedAt ? new Date(ev.verifiedAt).toLocaleDateString() : 'Pending Audit'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
