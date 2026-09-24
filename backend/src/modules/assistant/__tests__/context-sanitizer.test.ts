// =============================================================================
// CyberRiskOS — Context Sanitizer Unit Tests
// Owner: HARSH
// =============================================================================

import { ContextSanitizer } from '../context-sanitizer';

describe('ContextSanitizer', () => {
  it('should redact IP addresses from text', () => {
    const raw = 'Server at 192.168.1.50 experienced a breach';
    const sanitized = ContextSanitizer.sanitizeText(raw);
    expect(sanitized).toBe('Server at [REDACTED_IP] experienced a breach');
  });

  it('should redact internal hostnames from text', () => {
    const raw = 'Database db-primary.corp is unreachable';
    const sanitized = ContextSanitizer.sanitizeText(raw);
    expect(sanitized).toBe('Database [REDACTED_HOST] is unreachable');
  });

  it('should redact secrets and API keys from text', () => {
    const raw = 'Config api_key = "secret_1234567890" for service';
    const sanitized = ContextSanitizer.sanitizeText(raw);
    expect(sanitized).toBe('Config api_key = "[REDACTED_SECRET]" for service');
  });

  it('should redact emails from text', () => {
    const raw = 'Contact admin@company.com for access';
    const sanitized = ContextSanitizer.sanitizeText(raw);
    expect(sanitized).toBe('Contact [REDACTED_EMAIL] for access');
  });

  it('should deeply sanitize payload objects', () => {
    const payload = {
      ip: '10.0.0.1',
      hostname: 'db.internal',
      password: 'supersecretpassword123',
      metadata: {
        email: 'user@test.com',
      },
    };

    const sanitized = ContextSanitizer.sanitizePayload(payload);
    expect(sanitized.ip).toBe('[REDACTED_IP]');
    expect(sanitized.hostname).toBe('[REDACTED_HOST]');
    expect(sanitized.password).toBe('[REDACTED_SECRET]');
    expect(sanitized.metadata.email).toBe('[REDACTED_EMAIL]');
  });
});
