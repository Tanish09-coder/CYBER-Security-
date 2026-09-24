// =============================================================================
// CyberRiskOS — Enterprise Context Sanitizer & Privacy Boundaries
// Owner: HARSH (Enterprise Context & Privacy Lead)
// =============================================================================

export interface SanitizationOptions {
  maskIpAddresses?: boolean;
  maskHostnames?: boolean;
  maskCredentials?: boolean;
  maskPii?: boolean;
}

export class ContextSanitizer {
  private static readonly IP_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  private static readonly PRIVATE_HOST_REGEX = /\b[a-zA-Z0-9-]+\.(?:internal|local|corp|lan|private)\b/gi;
  private static readonly SECRET_KEY_REGEX = /(?:api[_-]?key|secret|password|bearer|token)\s*[:=]\s*['"]?([a-zA-Z0-9_\-\.]{8,})['"]?/gi;
  private static readonly EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

  /**
   * Sanitizes text strings before sending enterprise prompt context to AI models.
   */
  static sanitizeText(text: string, options: SanitizationOptions = {}): string {
    if (!text) return text;
    let sanitized = text;

    // 1. Redact Secrets & Credentials
    if (options.maskCredentials !== false) {
      sanitized = sanitized.replace(this.SECRET_KEY_REGEX, (match, p1) => match.replace(p1, '[REDACTED_SECRET]'));
    }

    // 2. Redact IP Addresses
    if (options.maskIpAddresses !== false) {
      sanitized = sanitized.replace(this.IP_REGEX, '[REDACTED_IP]');
    }

    // 3. Redact Internal Hostnames
    if (options.maskHostnames !== false) {
      sanitized = sanitized.replace(this.PRIVATE_HOST_REGEX, '[REDACTED_HOST]');
    }

    // 4. Redact PII (Emails)
    if (options.maskPii !== false) {
      sanitized = sanitized.replace(this.EMAIL_REGEX, '[REDACTED_EMAIL]');
    }

    return sanitized;
  }

  /**
   * Deeply sanitizes objects / payloads passed to AI context builders.
   */
  static sanitizePayload<T>(payload: T, options: SanitizationOptions = {}): T {
    if (typeof payload === 'string') {
      return this.sanitizeText(payload, options) as unknown as T;
    }
    if (Array.isArray(payload)) {
      return payload.map(item => this.sanitizePayload(item, options)) as unknown as T;
    }
    if (payload !== null && typeof payload === 'object') {
      const sanitizedObj: any = {};
      for (const [key, value] of Object.entries(payload)) {
        // Drop private credential keys entirely
        if (/password|secret|key|token|auth/i.test(key) && typeof value === 'string') {
          sanitizedObj[key] = '[REDACTED_SECRET]';
        } else {
          sanitizedObj[key] = this.sanitizePayload(value, options);
        }
      }
      return sanitizedObj as T;
    }
    return payload;
  }
}
