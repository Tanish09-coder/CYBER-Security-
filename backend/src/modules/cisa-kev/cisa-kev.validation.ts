import { z } from 'zod';

export const cveIdSchema = z
  .string()
  .trim()
  .regex(/^CVE-\d{4}-\d{4,}$/i, {
    message: 'Invalid CVE format. Expected format: CVE-YYYY-NNNN...',
  })
  .transform((val) => val.toUpperCase());

export const cisaKevItemSchema = z.object({
  cveID: z
    .string()
    .trim()
    .regex(/^CVE-\d{4}-\d{4,}$/i, 'Invalid CVE identifier in KEV item'),
  vendorProject: z.string().optional(),
  product: z.string().optional(),
  vulnerabilityName: z.string().optional(),
  dateAdded: z.string().optional(),
  shortDescription: z.string().optional(),
  requiredAction: z.string().optional(),
  dueDate: z.string().optional(),
  knownRansomwareCampaignUse: z.string().optional(),
  notes: z.string().optional(),
});

export const cisaKevCatalogEnvelopeSchema = z.object({
  title: z.string().optional(),
  catalogVersion: z.string().optional(),
  dateReleased: z.string().optional(),
  count: z.number().int().optional(),
  vulnerabilities: z.array(z.record(z.any())),
});
