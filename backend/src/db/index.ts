import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../config/logger';

let pool: Pool | null = null;
let memoryDb: any = null;
let memoryAdapter: any = null;

export async function getDbPool(): Promise<Pool | any> {
  if (memoryAdapter) {
    return memoryAdapter;
  }

  if (env.DATABASE_URL.startsWith('memory://') || process.env.USE_MEMORY_DB === 'true') {
    return initMemoryDb();
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client', { error: err.message });
    });
  }

  return pool;
}

export async function initMemoryDb(): Promise<any> {
  if (memoryAdapter) return memoryAdapter;

  logger.info('Initializing in-memory PostgreSQL engine for test/development mode');
  try {
    const { newDb, DataType } = await import('pg-mem');
    memoryDb = newDb({ noAstCoverageCheck: true });

    // Register extension and function for uuid_generate_v4
    memoryDb.registerExtension('uuid-ossp', (schema: any) => {
      schema.registerFunction({
        name: 'uuid_generate_v4',
        returns: DataType.uuid,
        impure: true,
        implementation: () => crypto.randomUUID(),
      });
    });

    memoryDb.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      impure: true,
      implementation: () => crypto.randomUUID(),
    });

    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
      for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        const statements = cleanSqlStatements(sql);
        for (const statement of statements) {
          try {
            memoryDb.public.none(statement);
          } catch (e: any) {
            logger.debug('Memory DB statement note: ' + e.message);
          }
        }
      }
    }

    const pgAdapter = memoryDb.adapters.createPg();
    const memPool = new pgAdapter.Pool();

    const sanitizeParam = (p: any) => {
      if (typeof p === 'string' && p.length > 500000) {
        try {
          const parsed = JSON.parse(p);
          return JSON.stringify({
            type: parsed.type,
            id: parsed.id,
            spec_version: parsed.spec_version,
            objects_count: Array.isArray(parsed.objects) ? parsed.objects.length : undefined,
            _in_memory_note: 'Full payload preserved in production PostgreSQL; trimmed in pg-mem to avoid V8 call stack overflow.',
          });
        } catch {
          return p.substring(0, 10000) + '...[truncated for pg-mem]';
        }
      }
      return p;
    };

    memoryAdapter = {
      isMemory: true,
      query: async (text: string, params?: any[]) => {
        const safeParams = params ? params.map(sanitizeParam) : params;
        return memPool.query(text, safeParams);
      },
      connect: async () => {
        const client = await memPool.connect();
        const origQuery = client.query.bind(client);
        client.query = (text: any, params?: any) => {
          if (Array.isArray(params)) {
            return origQuery(text, params.map(sanitizeParam));
          }
          return origQuery(text, params);
        };
        return client;
      },
      end: async () => {
        return memPool.end();
      },
    };

    return memoryAdapter;
  } catch (err: any) {
    logger.warn('Could not initialize pg-mem, falling back to mock adapter', { error: err.message });
    return createMockAdapter();
  }
}

function cleanSqlStatements(sql: string): string[] {
  const noBlockComments = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  const noComments = noBlockComments
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--');
      return idx >= 0 ? line.substring(0, idx) : line;
    })
    .join('\n');

  return noComments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function createMockAdapter(): any {
  return {
    isMemory: true,
    query: async (text: string, params?: any[]) => {
      return { rows: [], rowCount: 0 };
    },
    connect: async () => ({
      query: async (text: string, params?: any[]) => ({ rows: [], rowCount: 0 }),
      release: () => {},
    }),
    end: async () => {},
  };
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  try {
    const activePool = await getDbPool();
    return await activePool.query(text, params);
  } catch (err: any) {
    // If real Postgres connection failed with ECONNREFUSED and not explicitly forced, fallback to memory
    if (
      (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) &&
      !memoryAdapter
    ) {
      logger.warn('PostgreSQL server not accessible on localhost:5432. Falling back to in-memory PostgreSQL engine.');
      const mem = await initMemoryDb();
      // If the query was a migration script, it has already been applied by initMemoryDb()
      if (text.includes('CREATE TABLE IF NOT EXISTS')) {
        return { rows: [] as T[], rowCount: 0 } as any;
      }
      return await mem.query(text, params);
    }
    throw err;
  }
}

export async function withTransaction<T>(
  callback: (client: PoolClient | any) => Promise<T>
): Promise<T> {
  let client: PoolClient | any;
  try {
    const activePool = await getDbPool();
    client = await activePool.connect();
  } catch (err: any) {
    if ((err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) && !memoryAdapter) {
      const mem = await initMemoryDb();
      client = await mem.connect();
    } else {
      throw err;
    }
  }

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw e;
  } finally {
    if (client.release) {
      client.release();
    }
  }
}

export async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const activePool = await getDbPool();
  if (activePool.isMemory || memoryAdapter) {
    logger.info('In-memory database initialized with migration schemas');
    return;
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    logger.info(`Applying migration: ${file}`);
    try {
      await query(sql);
      if (memoryAdapter) {
        logger.info('In-memory database initialized with all migration schemas');
        return;
      }
      logger.info(`Migration ${file} applied successfully to PostgreSQL server`);
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) {
        logger.warn('PostgreSQL connection failed during migration. Initializing in-memory fallback.');
        await initMemoryDb();
        return;
      } else {
        throw err;
      }
    }
  }
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
  if (memoryAdapter && memoryAdapter.end) {
    await memoryAdapter.end();
    memoryAdapter = null;
  }
}
