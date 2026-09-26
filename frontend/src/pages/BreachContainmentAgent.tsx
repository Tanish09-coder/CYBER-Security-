import React, { useState } from 'react';
import {
  ShieldAlert,

  Flame,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Copy,
  Check,
  Building2,
  DollarSign,
  Server,
  Activity,
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

import { fetchApi } from '../api/client';

interface ContainmentAction {
  actionId: string;
  stepNumber: number;
  title: string;
  category: string;
  command: string;
  executionType: string;
  impactAssessment: string;
  verificationCheck: string;
}

interface ContainmentResponse {
  containmentId: string;
  serverId: string;
  serverName: string;
  threatLevel: string;
  containmentStatus: string;
  mitigationSummary: string;
  actions: ContainmentAction[];
  estimatedFinancialSavedInr: number;
  uncheckedLossInr: number;
  containedLossInr: number;
  complianceMandates: string[];
  automatedScriptBash: string;
  automatedScriptPowershell: string;
  evaluatedAt: string;
  modelVersion: string;
}

const PRESET_SERVERS = [
  { id: 'mumbai-upi-switch-01', name: 'Mumbai Primary UPI Transaction Switch', ip: '10.200.4.15', os: 'Linux (Ubuntu 22.04 LTS)' },
  { id: 'bengaluru-cbs-db-cluster', name: 'Bengaluru Core Banking System DB Cluster', ip: '10.100.12.88', os: 'Linux (RHEL 9.2 Enterprise)' },
  { id: 'delhi-netbanking-proxy', name: 'Delhi NetBanking API Gateway Proxy', ip: '192.168.10.4', os: 'Linux (Debian 12)' },
  { id: 'hyderabad-hq-dc01', name: 'Hyderabad HQ Active Directory Domain Controller', ip: '10.50.1.10', os: 'Windows Server 2022 Datacenter' },
  { id: 'chennai-internal-wiki', name: 'Chennai Internal Knowledge Portal Wiki', ip: '172.16.8.99', os: 'Linux (Ubuntu 20.04 LTS)' },
];

export const BreachContainmentAgent: React.FC = () => {
  const [selectedServerId, setSelectedServerId] = useState<string>(PRESET_SERVERS[0].id);
  const [customServerName, setCustomServerName] = useState<string>('');
  const [customIp, setCustomIp] = useState<string>('192.168.1.100');
  const [osEnv, setOsEnv] = useState<string>('Linux (Ubuntu 22.04 LTS)');
  const [incidentType, setIncidentType] = useState<string>('REVERSE_SHELL_ACTIVE');
  const [threatSeverity, setThreatSeverity] = useState<string>('CRITICAL');
  const [anomalyText, setAnomalyText] = useState<string>(
    'Unusual outbound socket connection to 194.26.29.11:4444\nRoot privilege escalation attempt detected via CVE-2024-3094'
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ContainmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeScriptTab, setActiveScriptTab] = useState<'bash' | 'powershell'>('bash');
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [executedSteps, setExecutedSteps] = useState<Record<string, boolean>>({});

  const handleRunContainment = async () => {
    setLoading(true);
    setError(null);
    setExecutedSteps({});

    const activePreset = PRESET_SERVERS.find(s => s.id === selectedServerId);
    const serverName = selectedServerId === 'custom' ? customServerName || 'Custom Target Server' : activePreset?.name || selectedServerId;
    const ipAddress = selectedServerId === 'custom' ? customIp : activePreset?.ip || '10.200.4.15';
    const finalOs = selectedServerId === 'custom' ? osEnv : activePreset?.os || osEnv;

    const anomaliesList = anomalyText.split('\n').filter(line => line.trim().length > 0);

    try {
      const res = await fetchApi<{ success: boolean; data: ContainmentResponse }>('/api/v1/assistant/contain-breach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: selectedServerId === 'custom' ? `srv-${Date.now().toString(36)}` : selectedServerId,
          serverName,
          ipAddress,
          osEnvironment: finalOs,
          incidentType,
          threatSeverity,
          detectedAnomalies: anomaliesList,
          affectedServices: ['UPI Payment Gateway', 'Core Banking Proxy']
        }),
      });

      if (res && res.data) {
        setResult(res.data);
      } else {
        throw new Error('Failed to parse containment result from backend API.');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing breach containment AI agent.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExecuteStep = (actionId: string) => {
    setExecutedSteps(prev => ({ ...prev, [actionId]: !prev[actionId] }));
  };

  const handleCopyScript = (scriptText: string) => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const formatInrCr = (val: number) => {
    return (val / 10000000).toFixed(2);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950/40 via-app-surface to-brand-primary/10 p-6 rounded-lg border border-red-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 animate-pulse" /> Active Breach Response Engine
            </span>
            <span className="text-xs text-text-muted font-mono">v1.0.0-breach-containment</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mt-1 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-400" /> Active Server Breach Containment AI Agent
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-3xl">
            Detects ongoing server hacking attacks (Reverse Shells, RCEs, Ransomware, Credential Dumping) and generates real-time, executable zero-trust isolation playbooks with INR (₹) financial loss mitigation.
          </p>
        </div>

        <button
          onClick={handleRunContainment}
          disabled={loading}
          className={`px-5 py-3 rounded-md font-semibold text-sm shadow-md transition-all flex items-center space-x-2 ${
            loading
              ? 'bg-red-800 text-red-200 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30 hover:shadow-red-600/40'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Server Threat Telemetry...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white" />
              <span>TRIGGER AI CONTAINMENT AGENT</span>
            </>
          )}
        </button>
      </div>

      {/* Target & Incident Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Inputs */}
        <div className="lg:col-span-2 bg-app-surface p-6 rounded-lg border border-app-border space-y-4">
          <h2 className="text-base font-semibold text-text-primary flex items-center space-x-2 border-b border-app-border pb-3">
            <Server className="w-4 h-4 text-brand-primary" />
            <span>Target Server & Incident Configuration</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Server Select */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Select Target Server
              </label>
              <select
                value={selectedServerId}
                onChange={(e) => setSelectedServerId(e.target.value)}
                className="w-full bg-app-surfaceSecondary border border-app-border text-text-primary text-xs rounded-md p-2.5 focus:outline-none focus:border-brand-primary"
              >
                {PRESET_SERVERS.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name} ({srv.ip})
                  </option>
                ))}
                <option value="custom">+ Manual / Custom Server Entry</option>
              </select>
            </div>

            {/* Attack Incident Type */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Detected Attack Vector
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full bg-app-surfaceSecondary border border-app-border text-text-primary text-xs rounded-md p-2.5 focus:outline-none focus:border-brand-primary font-mono"
              >
                <option value="REVERSE_SHELL_ACTIVE">REVERSE_SHELL_ACTIVE (Netcat / Bash C2)</option>
                <option value="RCE_EXPLOIT">RCE_EXPLOIT (Remote Code Execution)</option>
                <option value="CREDENTIAL_DUMPING">CREDENTIAL_DUMPING (Mimikatz / LSASS Dump)</option>
                <option value="RANSOMWARE_ENCRYPTION">RANSOMWARE_ENCRYPTION (Active File Encryption)</option>
                <option value="LATERAL_MOVEMENT">LATERAL_MOVEMENT (SSH Key / SMB Pivot)</option>
                <option value="DATA_EXFILTRATION">DATA_EXFILTRATION (High Outbound Bandwidth)</option>
              </select>
            </div>
          </div>

          {selectedServerId === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Server Name</label>
                <input
                  type="text"
                  value={customServerName}
                  onChange={(e) => setCustomServerName(e.target.value)}
                  placeholder="e.g. Hyderabad Payment Gateway"
                  className="w-full bg-app-surfaceSecondary border border-app-border text-text-primary text-xs rounded-md p-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">IP Address</label>
                <input
                  type="text"
                  value={customIp}
                  onChange={(e) => setCustomIp(e.target.value)}
                  className="w-full bg-app-surfaceSecondary border border-app-border text-text-primary text-xs rounded-md p-2.5 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">OS Environment</label>
                <input
                  type="text"
                  value={osEnv}
                  onChange={(e) => setOsEnv(e.target.value)}
                  className="w-full bg-app-surfaceSecondary border border-app-border text-text-primary text-xs rounded-md p-2.5"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Threat Severity</label>
              <select
                value={threatSeverity}
                onChange={(e) => setThreatSeverity(e.target.value)}
                className="w-full bg-app-surfaceSecondary border border-app-border text-text-primary text-xs rounded-md p-2.5 focus:outline-none focus:border-brand-primary font-bold"
              >
                <option value="CRITICAL" className="text-red-400">CRITICAL (Active Breach)</option>
                <option value="HIGH" className="text-orange-400">HIGH (Exploit Attempt)</option>
                <option value="MEDIUM" className="text-yellow-400">MEDIUM (Suspicious Behavior)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                Detected Telemetry & Anomaly Indicators
              </label>
              <textarea
                rows={3}
                value={anomalyText}
                onChange={(e) => setAnomalyText(e.target.value)}
                className="w-full bg-app-surfaceSecondary border border-app-border text-text-primary text-xs rounded-md p-2.5 font-mono"
                placeholder="Enter telemetry indicators (one per line)..."
              />
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Status & Enterprise Info */}
        <div className="bg-app-surface p-6 rounded-lg border border-app-border flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-primary" /> Target Environment
            </h3>
            <div className="bg-app-surfaceSecondary p-3 rounded-md border border-app-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Enterprise Org:</span>
                <span className="font-semibold text-text-primary">Bharat Digital Financial Services</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Sector / Mandate:</span>
                <span className="font-semibold text-emerald-400">Scheduled Commercial Bank (RBI)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Regulatory Window:</span>
                <span className="font-semibold text-red-400">6 Hours (RBI CSITE / CERT-In)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Currency Context:</span>
                <span className="font-semibold text-text-primary">INR (₹ Crore)</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-red-950/30 rounded-md border border-red-500/20 text-xs space-y-1">
            <span className="font-bold text-red-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Automated Zero-Trust Containment
            </span>
            <p className="text-text-secondary text-[11px]">
              The AI agent computes server network isolation, malicious process kill trees, token revocation, memory capture, and DR hot-standby failover commands.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Key Metrics Header Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Metric 1: Financial Saved */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-lg">
              <div className="flex justify-between items-center text-xs text-emerald-400 font-semibold mb-1">
                <span>ESTIMATED LOSS SAVED</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-emerald-300">
                ₹{formatInrCr(result.estimatedFinancialSavedInr)} Cr
              </div>
              <p className="text-[11px] text-text-secondary mt-1">Mitigated by immediate containment</p>
            </div>

            {/* Metric 2: Unchecked Loss */}
            <div className="bg-red-950/30 border border-red-500/30 p-4 rounded-lg">
              <div className="flex justify-between items-center text-xs text-red-400 font-semibold mb-1">
                <span>UNCHECKED BREACH LOSS</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-red-300">
                ₹{formatInrCr(result.uncheckedLossInr)} Cr
              </div>
              <p className="text-[11px] text-text-secondary mt-1">Full exfiltration / ransomware cost</p>
            </div>

            {/* Metric 3: Contained Loss */}
            <div className="bg-app-surface border border-app-border p-4 rounded-lg">
              <div className="flex justify-between items-center text-xs text-text-muted font-semibold mb-1">
                <span>CONTAINED INCIDENT COST</span>
                <Activity className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="text-2xl font-bold text-text-primary">
                ₹{(result.containedLossInr / 100000).toFixed(1)} Lakhs
              </div>
              <p className="text-[11px] text-text-secondary mt-1">Forensics & minimal downtime</p>
            </div>

            {/* Metric 4: Playbook Status */}
            <div className="bg-app-surface border border-app-border p-4 rounded-lg">
              <div className="flex justify-between items-center text-xs text-text-muted font-semibold mb-1">
                <span>CONTAINMENT PLAYBOOK</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{result.containmentStatus}</span>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">5 Actionable steps ready</p>
            </div>
          </div>

          {/* AI Mitigation Summary Banner */}
          <div className="bg-app-surface p-4 rounded-lg border border-app-border flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-text-primary">AI Containment Agent Strategy Summary:</span>
              <p className="text-text-secondary leading-relaxed">{result.mitigationSummary}</p>
            </div>
          </div>

          {/* Main Containment Steps & Scripts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Step-by-Step Playbook */}
            <div className="lg:col-span-7 bg-app-surface p-6 rounded-lg border border-app-border space-y-4">
              <div className="flex justify-between items-center border-b border-app-border pb-3">
                <h3 className="text-sm font-semibold text-text-primary flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-brand-primary" />
                  <span>5-Stage Zero-Trust Isolation Playbook</span>
                </h3>
                <span className="text-xs text-text-muted font-mono">
                  {Object.keys(executedSteps).length} / {result.actions.length} Steps Executed
                </span>
              </div>

              <div className="space-y-3">
                {result.actions.map((act) => {
                  const isDone = executedSteps[act.actionId];
                  return (
                    <div
                      key={act.actionId}
                      className={`p-4 rounded-lg border transition-all ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-app-surfaceSecondary border-app-border hover:border-app-borderHover'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isDone ? 'bg-emerald-500 text-white' : 'bg-brand-primary/20 text-brand-primary'
                            }`}
                          >
                            {act.stepNumber}
                          </span>
                          <h4 className="text-xs font-bold text-text-primary">{act.title}</h4>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${
                            act.executionType === 'AUTOMATED_CLI'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {act.executionType}
                        </span>
                      </div>

                      <p className="text-[11px] text-text-secondary mt-2 leading-relaxed">
                        <strong className="text-text-primary">Impact:</strong> {act.impactAssessment}
                      </p>

                      {/* Command snippet */}
                      <div className="mt-2.5 bg-black/60 p-2.5 rounded border border-gray-800 font-mono text-[11px] text-emerald-400 overflow-x-auto flex justify-between items-center group">
                        <code>{act.command}</code>
                        <button
                          onClick={() => handleCopyScript(act.command)}
                          className="opacity-60 group-hover:opacity-100 hover:text-white text-gray-400 ml-2"
                          title="Copy command"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-2.5 flex justify-between items-center pt-2 border-t border-app-border/40 text-[10px]">
                        <span className="text-text-muted">
                          <strong>Verification:</strong> {act.verificationCheck}
                        </span>
                        <button
                          onClick={() => toggleExecuteStep(act.actionId)}
                          className={`px-2.5 py-1 rounded font-semibold transition-all flex items-center space-x-1 ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-app-surface text-text-primary hover:bg-brand-primary hover:text-white border border-app-border'
                          }`}
                        >
                          {isDone ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Step Executed</span>
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              <span>Execute Step</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Cols: Regulatory Compliance & Consolidated Scripts */}
            <div className="lg:col-span-5 space-y-6">
              {/* Automated Scripts Block */}
              <div className="bg-app-surface p-6 rounded-lg border border-app-border space-y-4">
                <div className="flex justify-between items-center border-b border-app-border pb-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setActiveScriptTab('bash')}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                        activeScriptTab === 'bash'
                          ? 'bg-brand-primary text-white'
                          : 'text-text-secondary hover:bg-app-surfaceSecondary'
                      }`}
                    >
                      Linux Bash (.sh)
                    </button>
                    <button
                      onClick={() => setActiveScriptTab('powershell')}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                        activeScriptTab === 'powershell'
                          ? 'bg-brand-primary text-white'
                          : 'text-text-secondary hover:bg-app-surfaceSecondary'
                      }`}
                    >
                      PowerShell (.ps1)
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      handleCopyScript(
                        activeScriptTab === 'bash'
                          ? result.automatedScriptBash
                          : result.automatedScriptPowershell
                      )
                    }
                    className="px-2.5 py-1 rounded bg-app-surfaceSecondary border border-app-border hover:border-brand-primary text-text-primary text-xs font-semibold flex items-center space-x-1"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-text-secondary" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="bg-black/80 p-3.5 rounded border border-gray-800 text-[11px] font-mono text-emerald-400 max-h-[300px] overflow-y-auto scrollbar-thin">
                  {activeScriptTab === 'bash' ? result.automatedScriptBash : result.automatedScriptPowershell}
                </pre>
              </div>

              {/* Regulatory Directives Card */}
              <div className="bg-app-surface p-6 rounded-lg border border-app-border space-y-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center space-x-2 border-b border-app-border pb-3">
                  <Lock className="w-4 h-4 text-brand-primary" />
                  <span>Regulatory Incident Disclosure Directives</span>
                </h3>

                <div className="space-y-2.5">
                  {result.complianceMandates.map((mandate, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-app-surfaceSecondary rounded border border-app-border text-xs flex items-start space-x-2.5"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-text-primary leading-relaxed">{mandate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreachContainmentAgent;
