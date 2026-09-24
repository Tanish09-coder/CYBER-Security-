// =============================================================================
// CyberRiskOS — Enterprise Prompt Context Sanitizer
// Phase: Phase 8 — AI Explanation Assistant
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P8-01 Directive 5)
// =============================================================================

export class PromptSanitizer {
  /**
   * Sanitizes prompt context before sending to external AI providers.
   * Strips PII (email, phone), internal IP subnets, DB connection strings, and secret credentials.
   */
  static sanitize(text: string): string {
    if (!text) return '';

    let cleaned = text;

    // 1. Strip Database Connection URLs (e.g. postgresql://user:pass@host:5432/db)
    cleaned = cleaned.replace(
      /(postgres|postgresql|mysql|mongodb|redis):\/\/[^\s"'<>]+/gi,
      '[REDACTED_DB_CONNECTION_STRING]'
    );

    // 2. Strip Bearer tokens, API keys, AWS secret keys
    cleaned = cleaned.replace(
      /(bearer\s+[a-zA-Z0-9_\-\.]{15,}|sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16})/gi,
      '[REDACTED_SECRET_KEY]'
    );

    // 3. Mask Private/Internal IP Addresses (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
    cleaned = cleaned.replace(
      /\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/g,
      '[REDACTED_INTERNAL_IP]'
    );

    // 4. Mask Email Addresses
    cleaned = cleaned.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      '[REDACTED_EMAIL]'
    );

    // 5. Mask US/Intl Phone numbers
    cleaned = cleaned.replace(
      /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      '[REDACTED_PHONE]'
    );

    return cleaned;
  }
}
