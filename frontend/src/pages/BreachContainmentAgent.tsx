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
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  Shield
} from 'lucide-react';

import { fetchApi } from '../api/client';
import { StandardPageHeader } from '../components/layout/StandardPageHeader';

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
  const [selectedServerId, setSelectedServerId] = useState<string>(PRESET_SERVERS[1].id);
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
  const [copiedActionId, setCopiedActionId] = useState<string | null>(null);
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

  const handleCopyScript = (scriptText: string, actionId?: string) => {
    navigator.clipboard.writeText(scriptText);
    if (actionId) {
      setCopiedActionId(actionId);
      setTimeout(() => setCopiedActionId(null), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    }
  };

  const formatInrCr = (val: number) => {
    return (val / 10000000).toFixed(2);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Standard Header */}
      <StandardPageHeader
        title="Active Server Breach Containment AI Agent"
        purpose="Automated incident response playbooks for server breach vectors (Reverse Shells, RCEs, Ransomware, Credential Dumping) with quantified INR (₹) loss mitigation."
        dataOriginBadge="REAL INTELLIGENCE"
        steps={[
          "Select target server & detected attack telemetry",
          "Trigger deterministic zero-trust containment AI agent",
          "Review quantified financial loss prevented & regulatory timelines",
          "Execute sequential step-by-step isolation commands or export automated script"
        ]}
      />

      {/* Main Trigger & Config Card */}
      <div className="bg-white rounded-lg border border-[#C8D6E8] shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-[#06038D] to-[#1A3A8F] p-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#FF671F] text-white flex items-center gap-1">
                <Flame size={12} className="animate-pulse" /> Active Breach Response Engine
              </span>
              <span className="text-[11px] font-mono text-blue-200">v1.0.0-breach-containment</span>
            </div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <ShieldAlert size={20} className="text-[#FF671F]" /> Rapid Zero-Trust Isolation Engine
            </h2>
            <p className="text-xs text-blue-100 max-w-2xl">
              Generates targeted, non-destructive isolation scripts, terminates malicious process trees, and preserves forensic artifacts.
            </p>
          </div>

          <button
            onClick={handleRunContainment}
            disabled={loading}
            className={`px-6 py-3 rounded font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0 ${
              loading
                ? 'bg-amber-600 text-white cursor-not-allowed opacity-90'
                : 'bg-[#FF671F] hover:bg-[#D4521A] text-white shadow-lg active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Computing Containment Vector...</span>
              </>
            ) : (
              <>
                <Zap size={15} className="fill-white" />
                <span>TRIGGER AI CONTAINMENT AGENT</span>
              </>
            )}
          </button>
        </div>

        {/* Configuration Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#F8FAFD]">
          {/* Left 2 Cols: Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#DDE6F0]">
              <Server size={15} className="text-[#06038D]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A1E]">Target Server & Threat Telemetry</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#5C6E84] uppercase tracking-wide mb-1.5">
                  Target Asset Server
                </label>
                <select
                  value={selectedServerId}
                  onChange={(e) => setSelectedServerId(e.target.value)}
                  className="w-full bg-white border border-[#C8D6E8] text-[#0A0A1E] text-xs rounded p-2.5 font-medium focus:outline-none focus:border-[#06038D] focus:ring-1 focus:ring-[#06038D]"
                >
                  {PRESET_SERVERS.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} ({srv.ip})
                    </option>
                  ))}
                  <option value="custom">+ Manual / Custom Server Entry</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C6E84] uppercase tracking-wide mb-1.5">
                  Detected Attack Vector
                </label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full bg-white border border-[#C8D6E8] text-[#0A0A1E] text-xs rounded p-2.5 font-mono font-semibold focus:outline-none focus:border-[#06038D] focus:ring-1 focus:ring-[#06038D]"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white rounded border border-[#C8D6E8]">
                <div>
                  <label className="block text-[10px] font-bold text-[#5C6E84] uppercase mb-1">Server Name</label>
                  <input
                    type="text"
                    value={customServerName}
                    onChange={(e) => setCustomServerName(e.target.value)}
                    placeholder="e.g. UPI Switch Delta"
                    className="w-full bg-white border border-[#C8D6E8] text-xs rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#5C6E84] uppercase mb-1">IP Address</label>
                  <input
                    type="text"
                    value={customIp}
                    onChange={(e) => setCustomIp(e.target.value)}
                    className="w-full bg-white border border-[#C8D6E8] text-xs rounded p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#5C6E84] uppercase mb-1">OS Environment</label>
                  <input
                    type="text"
                    value={osEnv}
                    onChange={(e) => setOsEnv(e.target.value)}
                    className="w-full bg-white border border-[#C8D6E8] text-xs rounded p-2"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#5C6E84] uppercase tracking-wide mb-1.5">
                  Threat Severity
                </label>
                <select
                  value={threatSeverity}
                  onChange={(e) => setThreatSeverity(e.target.value)}
                  className="w-full bg-white border border-[#C8D6E8] text-[#C0392B] font-bold text-xs rounded p-2.5 focus:outline-none focus:border-[#06038D]"
                >
                  <option value="CRITICAL">🔴 CRITICAL (Active Breach)</option>
                  <option value="HIGH">🟠 HIGH (Exploit Attempt)</option>
                  <option value="MEDIUM">🟡 MEDIUM (Suspicious Behavior)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-[#5C6E84] uppercase tracking-wide mb-1.5">
                  Detected Telemetry & Anomaly Indicators
                </label>
                <textarea
                  rows={2}
                  value={anomalyText}
                  onChange={(e) => setAnomalyText(e.target.value)}
                  className="w-full bg-white border border-[#C8D6E8] text-[#0A0A1E] text-xs rounded p-2 font-mono leading-relaxed focus:outline-none focus:border-[#06038D]"
                  placeholder="Enter telemetry indicators..."
                />
              </div>
            </div>
          </div>

          {/* Right 1 Col: Environment Details */}
          <div className="bg-white p-4 rounded border border-[#C8D6E8] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-1.5 pb-2 border-b border-[#DDE6F0] mb-3">
                <Building2 size={14} className="text-[#06038D]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A0A1E]">Target Environment Posture</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#5C6E84]">Enterprise Org:</span>
                  <span className="font-bold text-[#0A0A1E]">Bharat Digital Financial</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C6E84]">Regulated Mandate:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6F4EC] text-[#046A38] border border-[#046A38]/30">
                    Scheduled Bank (RBI)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C6E84]">Reporting Window:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEE2E2] text-[#C0392B] border border-[#C0392B]/30 flex items-center gap-1">
                    <Clock size={10} /> 6 Hours (CERT-In)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5C6E84]">Currency Context:</span>
                  <span className="font-bold text-[#0A0A1E]">INR (₹ Crore)</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#EBF0FA] rounded border border-[#C8D6E8] text-[11px] space-y-1">
              <span className="font-bold text-[#06038D] flex items-center gap-1">
                <ShieldCheck size={13} /> Zero-Trust Containment Guardrail
              </span>
              <p className="text-[#2C3A50] text-[10.5px] leading-relaxed">
                Commands isolate network ingress/egress while strictly maintaining administrative SSH/RDP session continuity for incident responders.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#FEE2E2] border-l-4 border-[#C0392B] rounded text-[#C0392B] text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Key Metrics Header Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Financial Saved */}
            <div className="bg-white border-2 border-[#046A38] p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center text-[11px] text-[#046A38] font-bold tracking-wider uppercase mb-1">
                <span>Estimated Loss Saved</span>
                <DollarSign size={16} />
              </div>
              <div className="text-2xl font-black text-[#046A38]">
                ₹{formatInrCr(result.estimatedFinancialSavedInr)} Cr
              </div>
              <p className="text-[11px] text-[#5C6E84] mt-1 font-medium">Mitigated by immediate containment</p>
            </div>

            {/* Metric 2: Unchecked Loss */}
            <div className="bg-white border-2 border-[#C0392B] p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center text-[11px] text-[#C0392B] font-bold tracking-wider uppercase mb-1">
                <span>Unchecked Breach Loss</span>
                <AlertTriangle size={16} />
              </div>
              <div className="text-2xl font-black text-[#C0392B]">
                ₹{formatInrCr(result.uncheckedLossInr)} Cr
              </div>
              <p className="text-[11px] text-[#5C6E84] mt-1 font-medium">Full exfiltration / ransomware cost</p>
            </div>

            {/* Metric 3: Contained Loss */}
            <div className="bg-white border border-[#C8D6E8] p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center text-[11px] text-[#5C6E84] font-bold tracking-wider uppercase mb-1">
                <span>Contained Incident Cost</span>
                <Activity size={16} className="text-[#06038D]" />
              </div>
              <div className="text-2xl font-black text-[#0A0A1E]">
                ₹{(result.containedLossInr / 100000).toFixed(1)} Lakhs
              </div>
              <p className="text-[11px] text-[#5C6E84] mt-1 font-medium">Forensics & minimal downtime</p>
            </div>

            {/* Metric 4: Playbook Status */}
            <div className="bg-white border border-[#C8D6E8] p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center text-[11px] text-[#5C6E84] font-bold tracking-wider uppercase mb-1">
                <span>Containment Playbook</span>
                <ShieldCheck size={16} className="text-[#046A38]" />
              </div>
              <div className="text-base font-black text-[#046A38] flex items-center gap-1.5 mt-1.5">
                <CheckCircle2 size={18} className="text-[#046A38]" />
                <span>{result.containmentStatus}</span>
              </div>
              <p className="text-[11px] text-[#5C6E84] mt-1 font-medium">5 Actionable steps generated</p>
            </div>
          </div>

          {/* AI Strategy Summary Card */}
          <div className="bg-white p-4 rounded-lg border-l-4 border-[#06038D] border-t border-r border-b border-[#C8D6E8] shadow-sm flex items-start gap-3">
            <ShieldAlert size={20} className="text-[#06038D] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-[#0A0A1E]">AI Containment Agent Strategy Summary</div>
              <p className="text-[#2C3A50] leading-relaxed">{result.mitigationSummary}</p>
            </div>
          </div>

          {/* Main Containment Steps & Automation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Step-by-Step Playbook */}
            <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-[#C8D6E8] shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[#DDE6F0]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0A1E] flex items-center gap-2">
                  <Terminal size={16} className="text-[#06038D]" />
                  <span>5-Stage Zero-Trust Isolation Playbook</span>
                </h3>
                <span className="text-[11px] font-bold text-[#06038D] bg-[#EBF0FA] px-2.5 py-1 rounded">
                  {Object.keys(executedSteps).length} of {result.actions.length} Executed
                </span>
              </div>

              <div className="space-y-3">
                {result.actions.map((act) => {
                  const isDone = executedSteps[act.actionId];
                  return (
                    <div
                      key={act.actionId}
                      className={`p-4 rounded border transition-all ${
                        isDone
                          ? 'bg-[#E6F4EC] border-[#046A38]'
                          : 'bg-white border-[#C8D6E8] hover:border-[#06038D]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                              isDone ? 'bg-[#046A38] text-white' : 'bg-[#06038D] text-white'
                            }`}
                          >
                            {act.stepNumber}
                          </span>
                          <h4 className="text-xs font-bold text-[#0A0A1E]">{act.title}</h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                            act.executionType === 'AUTOMATED_CLI'
                              ? 'bg-[#EBF0FA] text-[#06038D] border border-[#06038D]/30'
                              : 'bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30'
                          }`}
                        >
                          {act.executionType}
                        </span>
                      </div>

                      <p className="text-xs text-[#2C3A50] mt-2 leading-relaxed">
                        <strong className="text-[#0A0A1E]">Impact:</strong> {act.impactAssessment}
                      </p>

                      {/* Command box */}
                      <div className="mt-3 bg-[#0A0A1E] p-3 rounded border border-gray-700 font-mono text-xs text-[#34D399] overflow-x-auto flex justify-between items-center group">
                        <code className="select-all">{act.command}</code>
                        <button
                          onClick={() => handleCopyScript(act.command, act.actionId)}
                          className="text-gray-400 hover:text-white ml-2 p-1 rounded hover:bg-gray-800 transition-colors shrink-0"
                          title="Copy command"
                        >
                          {copiedActionId === act.actionId ? <Check size={14} className="text-[#34D399]" /> : <Copy size={14} />}
                        </button>
                      </div>

                      <div className="mt-3 flex justify-between items-center pt-2.5 border-t border-[#DDE6F0] text-[11px]">
                        <span className="text-[#5C6E84]">
                          <strong>Verification:</strong> {act.verificationCheck}
                        </span>
                        <button
                          onClick={() => toggleExecuteStep(act.actionId)}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isDone
                              ? 'bg-[#046A38] text-white'
                              : 'bg-[#06038D] hover:bg-[#1A3A8F] text-white'
                          }`}
                        >
                          {isDone ? (
                            <>
                              <Check size={12} />
                              <span>Executed</span>
                            </>
                          ) : (
                            <>
                              <ArrowRight size={12} />
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
              {/* Consolidated Automation Terminal */}
              <div className="bg-white rounded-lg border border-[#C8D6E8] shadow-sm overflow-hidden">
                <div className="bg-[#0A0A1E] px-4 py-3 flex justify-between items-center border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    </div>
                    <div className="flex gap-1 ml-3">
                      <button
                        onClick={() => setActiveScriptTab('bash')}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                          activeScriptTab === 'bash'
                            ? 'bg-[#FF671F] text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        Linux Bash (.sh)
                      </button>
                      <button
                        onClick={() => setActiveScriptTab('powershell')}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                          activeScriptTab === 'powershell'
                            ? 'bg-[#06038D] text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        PowerShell (.ps1)
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleCopyScript(
                        activeScriptTab === 'bash'
                          ? result.automatedScriptBash
                          : result.automatedScriptPowershell
                      )
                    }
                    className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedScript ? <Check size={12} className="text-[#34D399]" /> : <Copy size={12} />}
                    <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                </div>

                <div className="p-4 bg-[#0A0A1E] overflow-x-auto max-h-[340px]">
                  <pre className="font-mono text-xs text-[#34D399] leading-relaxed whitespace-pre">
                    {activeScriptTab === 'bash'
                      ? result.automatedScriptBash
                      : result.automatedScriptPowershell}
                  </pre>
                </div>
              </div>

              {/* Regulatory Directives Card */}
              <div className="bg-white p-5 rounded-lg border border-[#C8D6E8] shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#DDE6F0]">
                  <Shield size={16} className="text-[#FF671F]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A1E]">
                    Mandatory Regulatory Incident Disclosures
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 bg-[#EBF0FA] rounded border border-[#C8D6E8] text-xs flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#06038D] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#06038D]">RBI Cyber Security Framework</span>
                      <p className="text-[#2C3A50] text-[11px] mt-0.5">
                        Mandatory 6-hour baseline notification window to RBI CSITE with root cause analysis within 24 hours.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#EBF0FA] rounded border border-[#C8D6E8] text-xs flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#06038D] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#06038D]">CERT-In Direction 20(3)/2022-CERT-In</span>
                      <p className="text-[#2C3A50] text-[11px] mt-0.5">
                        Statutory reporting within 6 hours of noticing cyber incidents under Annexure I categories.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
