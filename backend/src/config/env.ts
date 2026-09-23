import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://cyberadmin:cyberpassword@localhost:5432/cyberriskos'),
  NVD_BASE_URL: z.string().url().default('https://services.nvd.nist.gov/rest/json/cves/2.0'),
  NVD_API_KEY: z.string().optional().transform((val) => (val && val.trim() !== '' ? val.trim() : undefined)),
  NVD_TIMEOUT_MS: z.string().default('15000').transform((val) => parseInt(val, 10)),
  NVD_MAX_RETRIES: z.string().default('4').transform((val) => parseInt(val, 10)),
  NVD_REQUEST_DELAY_MS: z.string().default('600').transform((val) => parseInt(val, 10)),
  CISA_KEV_URL: z
    .string()
    .url()
    .default('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'),
  CISA_KEV_TIMEOUT_MS: z.string().default('15000').transform((val) => parseInt(val, 10)),
  CISA_KEV_MAX_RETRIES: z.string().default('4').transform((val) => parseInt(val, 10)),
  CISA_KEV_STALE_AFTER_HOURS: z.string().default('24').transform((val) => parseInt(val, 10)),
  JWT_SECRET: z.string().default('dev-secret-cyberriskos'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
