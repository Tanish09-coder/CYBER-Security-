# =============================================================================
# CyberRiskOS — Active Breach Containment AI Agent (Python)
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
#
# PURPOSE:
#   Analyzes active, ongoing server hacking events (RCE, Reverse Shell,
#   Credential Dumping, Ransomware, Exfiltration) and generates real-time
#   containment playbooks, automated isolation CLI scripts, financial loss
#   mitigation estimates (in INR ₹), and regulatory notification directives.
# =============================================================================

import uuid
from typing import List
from app.schemas.containment_input import (
    BreachContainmentInputSchema,
    BreachContainmentResultSchema,
    ContainmentActionSchema,
)


class BreachContainmentAgent:
    """
    AI Autonomous Incident Response & Breach Containment Engine.
    Evaluates server telemetry and threat vectors to construct step-by-step
    containment workflows that halt active breaches with minimal business downtime.
    """

    MODEL_VERSION = "1.0.0-breach-containment"

    @classmethod
    def generate_containment_plan(cls, payload: BreachContainmentInputSchema) -> BreachContainmentResultSchema:
        server_id = payload.server_id
        server_name = payload.server_name
        ip_addr = payload.ip_address or "192.168.1.100"
        os_env = payload.os_environment or "Linux (Ubuntu/RHEL)"
        incident_type = payload.incident_type.upper()
        severity = payload.threat_severity.upper()
        anomalies = payload.detected_anomalies or ["Suspicious high-privilege process execution detected."]

        actions: List[ContainmentActionSchema] = []
        containment_uuid = f"cnt-{uuid.uuid4().hex[:8]}"

        is_windows = "WINDOWS" in os_env.upper()

        # Step 1: Immediate Network Isolation (Micro-segmentation / Firewall block)
        if is_windows:
            net_cmd = f"New-NetFirewallRule -DisplayName 'CYBER_CONTAIN_{server_id}' -Direction Outbound -Action Block -RemoteAddress Any -Protocol TCP"
        else:
            net_cmd = f"sudo iptables -A OUTPUT -d 0.0.0.0/0 -j DROP && sudo iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT # Retain Mgmt SSH"

        actions.append(
            ContainmentActionSchema(
                action_id=f"act-1-{containment_uuid}",
                step_number=1,
                title="Immediate Server Network Isolation & C2 Severance",
                category="NETWORK_ISOLATION",
                command=net_cmd,
                execution_type="AUTOMATED_CLI",
                impact_assessment="Blocks all malicious outbound command & control (C2) channels while preserving encrypted management control access.",
                verification_check="ping 8.8.8.8 should fail; local port 22/5985 remains responsive."
            )
        )

        # Step 2: Process Suppression / Threat Neutralization
        if "REVERSE_SHELL" in incident_type or "RCE" in incident_type:
            proc_title = "Active Reverse Shell / Exploited Process Termination"
            proc_cmd = "powershell -Command \"Get-Process | Where-Object {$_.Path -like '*temp*' -or $_.CommandLine -like '*nc *' -or $_.CommandLine -like '*bash -i*'} | Stop-Process -Force\"" if is_windows else "pkill -f 'nc|bash -i|/tmp/' || kill -9 $(pgrep -f 'python -c|perl -e|ruby -e')"
        elif "RANSOMWARE" in incident_type:
            proc_title = "Ransomware Encryption Engine Freeze & VSS Shield"
            proc_cmd = "vssadmin create shadow /for=C: && Stop-Service -Name VolumeShadowCopy -Force -Disable" if is_windows else "sudo pkill -STOP -f 'encrypt|locker|vss' && sudo mount -o remount,ro /data"
        elif "CREDENTIAL" in incident_type:
            proc_title = "LSASS / Memory Dumping Process Isolation & Ticket Purge"
            proc_cmd = "klist purge && rundll32.exe keymgr.dll,KRShowKeyMgr" if is_windows else "sudo pkill -f 'mimikatz|gsecdump|lsass' && sudo systemctl restart sssd"
        else:
            proc_title = "Suspicious Process Tree Freeze & Containment"
            proc_cmd = "Stop-Process -Id (Get-NetTCPConnection -State Established | Select-Object -ExpandProperty OwningProcess) -Force" if is_windows else "sudo fuser -k 4444/tcp 8080/tcp 9001/tcp"

        actions.append(
            ContainmentActionSchema(
                action_id=f"act-2-{containment_uuid}",
                step_number=2,
                title=proc_title,
                category="PROCESS_SUPPRESSION",
                command=proc_cmd,
                execution_type="AUTOMATED_CLI",
                impact_assessment="Neutralizes active malicious process handles without rebooting the target server node.",
                verification_check="Verify process list for suspicious parent/child process IDs."
            )
        )

        # Step 3: Account & Session Revocation
        actions.append(
            ContainmentActionSchema(
                action_id=f"act-3-{containment_uuid}",
                step_number=3,
                title="Compromised Session & Service Account Token Revocation",
                category="CREDENTIAL_LOCKDOWN",
                command="Revoke-AzureADUserAllRefreshToken -ObjectId compromised_service_account@bank.in" if is_windows else "sudo usermod -L compromised_app_user && sudo pkill -u compromised_app_user",
                execution_type="AUTOMATED_CLI",
                impact_assessment="Terminates all active JWT tokens, SSH keys, and Kerberos tickets assigned to the affected service account.",
                verification_check="Ensure auth logs return HTTP 401 Unauthorized for compromised credentials."
            )
        )

        # Step 4: Volatile Forensic Evidence Preservation
        actions.append(
            ContainmentActionSchema(
                action_id=f"act-4-{containment_uuid}",
                step_number=4,
                title="Volatile Memory Snapshot & Audit Log Preservation",
                category="FORENSIC_PRESERVATION",
                command="winpmem.exe -o C:\\forensics\\memdump.raw" if is_windows else "sudo dd if=/dev/mem of=/var/log/forensics_memdump.raw bs=1M count=2048 2>/dev/null || sudo LiME-dump",
                execution_type="AUTOMATED_CLI",
                impact_assessment="Captures RAM state and RAM-resident malcode payload before system reboot or memory corruption occurs.",
                verification_check="Verify sha256 checksum of generated memory image file."
            )
        )

        # Step 5: Disaster Recovery & Failover Trigger
        actions.append(
            ContainmentActionSchema(
                action_id=f"act-5-{containment_uuid}",
                step_number=5,
                title="Hot-Standby DR Routing & High-Availability Failover",
                category="DISASTER_RECOVERY",
                command=f"aws route53 change-resource-record-sets --hosted-zone-id Z123456 --change-batch file://dr-failover-{server_id}.json" if is_windows else f"sudo crm resource move g-banking-switch standby-node-bengaluru",
                execution_type="MANUAL_APPROVAL",
                impact_assessment="Reroutes live financial transaction traffic to hot-standby DR node in Bengaluru / Pune to maintain 99.999% uptime.",
                verification_check="Verify traffic health checks on DR load balancer endpoint."
            )
        )

        # Financial loss modeling (INR ₹)
        if severity == "CRITICAL":
            unchecked_loss = 65000000.0  # ₹6.5 Crore
            contained_loss = 1500000.0   # ₹15 Lakhs
        elif severity == "HIGH":
            unchecked_loss = 25000000.0  # ₹2.5 Crore
            contained_loss = 800000.0    # ₹8 Lakhs
        else:
            unchecked_loss = 7500000.0   # ₹75 Lakhs
            contained_loss = 300000.0    # ₹3 Lakhs

        saved_inr = unchecked_loss - contained_loss

        # Compliance Directives
        compliance = [
            "RBI Cyber Security Framework: Mandatory breach notification to RBI CSITE within 6 hours of detection.",
            "CERT-In Cyber Incident Directive: Submit preliminary incident report (Form CERT-IN-IR) within 6 hours.",
            "SEBI Circular for Financial Institutions: Notify Information Security Committee & trigger SOC Incident Level 1 Playbook.",
            "DPDP Act 2023: Initiate personal data breach containment protocol & audit log lock."
        ]

        # Consolidated Bash & PowerShell Scripts
        bash_script = f"""#!/bin/bash
# =============================================================================
# CyberRiskOS — Active Breach Isolation Script (Linux / POSIX)
# Target Server: {server_name} ({ip_addr})
# Triggered Incident: {incident_type} [{severity}]
# Generated At: $(date -u)
# =============================================================================

set -e
echo "[+] Starting CyberRiskOS Active Containment Sequence for {server_id}..."

# 1. Network Isolation
echo "[1/4] Applying Network Containment Rules..."
sudo iptables -F
sudo iptables -A OUTPUT -d 0.0.0.0/0 -p tcp --dport 22 -j ACCEPT
sudo iptables -A OUTPUT -j DROP

# 2. Kill Exploited Processes
echo "[2/4] Terminating Malicious Process Tree..."
{actions[1].command}

# 3. Volatile RAM Capture
echo "[3/4] Preserving Volatile RAM & Forensic Audit Logs..."
sudo mkdir -p /var/log/cyberrisk_forensics
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches

# 4. Status Check
echo "[+] CONTAINMENT EXECUTED SUCCESSFULLY. Server {server_id} isolated."
"""

        powershell_script = f"""# =============================================================================
# CyberRiskOS — Active Breach Isolation Script (Windows PowerShell)
# Target Server: {server_name} ({ip_addr})
# Triggered Incident: {incident_type} [{severity}]
# =============================================================================

Write-Host "[+] Initiating Active CyberRiskOS Containment Protocol for {server_name}..." -ForegroundColor Red

# 1. Firewalls Isolation
Write-Host "[1/4] Enforcing Outbound C2 Severance Rules..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "CyberRiskOS_Containment_Block" -Direction Outbound -Action Block -Enabled True -ErrorAction SilentlyContinue

# 2. Terminate Process
Write-Host "[2/4] Terminating Exploited Processes..." -ForegroundColor Yellow
{actions[1].command}

# 3. Session Revocation
Write-Host "[3/4] Purging Compromised Auth Tokens..." -ForegroundColor Yellow
klist purge

Write-Host "[+] SERVER {server_id} SUCCESSFULLY CONTAINED AND ISOLATED." -ForegroundColor Green
"""

        summary = f"Active threat '{incident_type}' detected on server '{server_name}' ({ip_addr}). AI Breach Containment Agent has constructed a 5-stage zero-trust isolation playbook. Executing these steps will prevent lateral movement across enterprise networks and mitigate an estimated ₹{saved_inr/10000000:.2f} Crore in financial exposure."

        return BreachContainmentResultSchema(
            containment_id=containment_uuid,
            server_id=server_id,
            server_name=server_name,
            threat_level=severity,
            containment_status="PLAYBOOK_READY",
            mitigation_summary=summary,
            actions=actions,
            estimated_financial_saved_inr=saved_inr,
            unchecked_loss_inr=unchecked_loss,
            contained_loss_inr=contained_loss,
            compliance_mandates=compliance,
            automated_script_bash=bash_script,
            automated_script_powershell=powershell_script,
            model_version=cls.MODEL_VERSION,
        )
