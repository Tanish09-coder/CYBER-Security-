import { z } from 'zod';

export const cveIdSchema = z
  .string()
  .trim()
  .regex(/^CVE-\d{4}-\d{4,}$/i, {
    message: 'Invalid CVE format. Expected format: CVE-YYYY-NNNN...',
  })
  .transform((val) => val.toUpperCase());

export const isoDateSchema = z.string().datetime({
  offset: true,
  message: 'Invalid ISO date string. Expected format: YYYY-MM-DDTHH:mm:ss.sssZ',
});

const MAX_DATE_RANGE_DAYS = 120;

export const dateRangeSchema = z
  .object({
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid startDate timestamp',
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid endDate timestamp',
    }),
    startIndex: z.number().int().min(0).default(0),
    resultsPerPage: z.number().int().min(1).max(2000).default(100),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return start <= end;
    },
    {
      message: 'startDate must be earlier than or equal to endDate',
      path: ['startDate'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      const diffDays = (end - start) / (1000 * 60 * 60 * 24);
      return diffDays <= MAX_DATE_RANGE_DAYS;
    },
    {
      message: `Date range exceeds maximum allowed limit of ${MAX_DATE_RANGE_DAYS} consecutive days`,
      path: ['endDate'],
    }
  );

export const paginationSchema = z.object({
  startIndex: z.number().int().min(0).default(0),
  resultsPerPage: z.number().int().min(1).max(2000).default(100),
});
