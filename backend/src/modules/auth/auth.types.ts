// =============================================================================
// CyberRiskOS — Authentication & Authorization Types
// Phase 9 — Security Hardening
// =============================================================================

export interface AuthRegisterRequest {
  /** Organization name — creates a new organization atomically with the admin user */
  organizationName: string;
  /** ISO-4217 currency code for the new organization (required) */
  organizationCurrency: string;
  organizationIndustry?: string;
  email: string;
  password: string;
  fullName: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    organizationId: string;
  };
}
