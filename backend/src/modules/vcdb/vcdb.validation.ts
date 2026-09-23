import { z } from 'zod';

export class VcdbUnavailableError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'VcdbUnavailableError';
  }
}

export class VcdbInvalidPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VcdbInvalidPayloadError';
  }
}

export class VcdbSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VcdbSchemaError';
  }
}

export class VcdbTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VcdbTimeoutError';
  }
}

export class VcdbPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VcdbPersistenceError';
  }
}

// Permissive Zod schema for VERIS raw incident objects allowing unknown future fields
export const VerisIncidentSchema = z
  .object({
    incident_id: z.string().min(1),
    schema_version: z.string().optional(),
    security_incident: z.string().optional(),
    confidence: z.string().optional(),
    summary: z.string().optional(),
    actor: z.record(z.any()).optional(),
    action: z.record(z.any()).optional(),
    asset: z.record(z.any()).optional(),
    attribute: z.record(z.any()).optional(),
    victim: z.any().optional(),
    timeline: z.record(z.any()).optional(),
    discovery_method: z.any().optional(),
  })
  .passthrough();
