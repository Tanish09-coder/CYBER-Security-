# Enterprise AI Context Privacy & Exposure Boundaries

**Owner**: HARSH (Enterprise Context & Privacy Lead)  
**Status**: ACTIVE  
**Last Updated**: 2026-09-25  

---

## 1. Context Redaction Principles

To prevent leakage of sensitive enterprise infrastructure metadata, credentials, or PII when communicating with external LLMs, CyberRiskOS enforces automated payload sanitization via `ContextSanitizer`.

### Mandatory Redaction Rules
1. **IP Addresses**: Internal IPv4 addresses (`10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`) are masked to `[REDACTED_IP]`.
2. **Private Hostnames**: Domain names ending in `.internal`, `.local`, `.corp`, `.lan`, `.private` are masked to `[REDACTED_HOST]`.
3. **Secrets & Credentials**: API keys, tokens, bearer headers, and passwords are masked to `[REDACTED_SECRET]`.
4. **PII**: Email addresses and personal identifiers are masked to `[REDACTED_EMAIL]`.

---

## 2. Architecture & Enforcement Point

All context bundles sent to AI explanation endpoints pass through `ContextSanitizer.sanitizePayload()` prior to prompt construction.
