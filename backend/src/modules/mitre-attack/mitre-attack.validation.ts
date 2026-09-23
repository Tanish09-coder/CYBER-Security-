import { z } from 'zod';

export class MitreAttackUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MitreAttackUnavailableError';
  }
}

export class MitreAttackTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MitreAttackTimeoutError';
  }
}

export class MitreAttackInvalidPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MitreAttackInvalidPayloadError';
  }
}

export const mitreIndexVersionSchema = z.object({
  version: z.string(),
  url: z.string().url(),
  modified: z.string(),
});

export const mitreIndexCollectionSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  created: z.string().optional(),
  modified: z.string().optional(),
  versions: z.array(mitreIndexVersionSchema),
});

export const mitreIndexSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  collections: z.array(mitreIndexCollectionSchema).min(1, 'Collections list cannot be empty'),
});

export const stixBundleEnvelopeSchema = z.object({
  type: z.literal('bundle'),
  id: z.string(),
  spec_version: z.string().optional(),
  objects: z.array(
    z.object({
      type: z.string(),
      id: z.string(),
    }).passthrough()
  ),
});
