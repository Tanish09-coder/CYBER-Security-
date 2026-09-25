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

  if (env.NODE_ENV === 'production') {
    throw new Error('Fatal: In-memory database fallback is strictly prohibited in production mode. CyberRiskOS requires a live PostgreSQL instance.');
  }

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

    const possibleMigrationDirs = [
      path.join(__dirname, 'migrations'),
      path.join(__dirname, '../../src/db/migrations'),
      path.join(process.cwd(), 'src/db/migrations'),
      path.join(process.cwd(), 'backend/src/db/migrations'),
    ];
    const migrationsDir = possibleMigrationDirs.find((dir) => fs.existsSync(dir)) || possibleMigrationDirs[0];

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

    const possibleSnapshots = [
      path.join(__dirname, '../../../data/db_snapshot.json'),
      path.join(process.cwd(), '../data/db_snapshot.json'),
      path.join(process.cwd(), 'data/db_snapshot.json'),
    ];
    const SNAPSHOT_FILE = possibleSnapshots.find((f) => fs.existsSync(f)) || possibleSnapshots[0];

    const restoreMemorySnapshot = () => {
      try {
        if (!fs.existsSync(SNAPSHOT_FILE)) return;
        const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf-8');
        const snapshot = JSON.parse(raw);
        let restoredCount = 0;
        for (const [table, rows] of Object.entries(snapshot)) {
          if (!Array.isArray(rows) || rows.length === 0) continue;
          for (const row of rows) {
            const keys = Object.keys(row);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const cols = keys.map((k) => `"${k}"`).join(', ');
            const values = keys.map((k) => {
              const val = (row as any)[k];
              if (val && typeof val === 'object') return JSON.stringify(val);
              return val;
            });
            const sql = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`;
            try {
              memoryDb.public.none(sql, values);
              restoredCount++;
            } catch (_) {}
          }
        }
        logger.info(`Memory database restored ${restoredCount} rows from persistent disk snapshot (${SNAPSHOT_FILE})`);
      } catch (err: any) {
        logger.warn('Failed to restore db snapshot', { error: err.message });
      }
    };

    let saveTimer: NodeJS.Timeout | null = null;
    const saveMemorySnapshot = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        try {
          const dataDir = path.dirname(SNAPSHOT_FILE);
          if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

          const tables = [
            'organizations', 'business_units', 'assets', 'asset_software', 'security_controls',
            'asset_controls', 'enterprise_financial_parameters', 'risk_results', 'financial_results',
            'cpe_matches', 'vulnerabilities', 'vulnerability_cvss_metrics', 'vulnerability_cpes',
            'cisa_kev_entries', 'mitre_attack_tactics', 'mitre_attack_techniques', 'vcdb_incidents',
            'remediation_actions', 'scenarios'
          ];

          const snapshot: Record<string, any[]> = {};
          for (const t of tables) {
            try {
              snapshot[t] = memoryDb.public.many(`SELECT * FROM "${t}"`);
            } catch {
              snapshot[t] = [];
            }
          }
          fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');
        } catch (err: any) {
          logger.debug('Snapshot save note: ' + err.message);
        }
      }, 500);
    };

    // Restore disk state into pg-mem
    restoreMemorySnapshot();

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

    const isMutatingQuery = (text: string) => {
      const t = text.trim().toUpperCase();
      return t.startsWith('INSERT') || t.startsWith('UPDATE') || t.startsWith('DELETE') || t.startsWith('TRUNCATE');
    };

    memoryAdapter = {
      isMemory: true,
      query: async (text: string, params?: any[]) => {
        const safeParams = params ? params.map(sanitizeParam) : params;
        const res = await memPool.query(text, safeParams);
        if (isMutatingQuery(text)) saveMemorySnapshot();
        return res;
      },
      connect: async () => {
        const client = await memPool.connect();
        const origQuery = client.query.bind(client);
        client.query = async (text: any, params?: any) => {
          const safeParams = Array.isArray(params) ? params.map(sanitizeParam) : params;
          const res = await origQuery(text, safeParams);
          if (typeof text === 'string' && isMutatingQuery(text)) saveMemorySnapshot();
          return res;
        };
        return client;
      },
      end: async () => {
        saveMemorySnapshot();
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
    if (
      (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) &&
      !memoryAdapter
    ) {
      if (env.NODE_ENV === 'production') {
        throw new Error(`Fatal: PostgreSQL server is not accessible in production mode: ${err.message}`);
      }
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
      if (env.NODE_ENV === 'production') {
        throw new Error(`Fatal: PostgreSQL connection failed during transaction in production mode: ${err.message}`);
      }
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
        if (env.NODE_ENV === 'production') {
          throw new Error(`Fatal: PostgreSQL connection failed during migration ${file} in production mode: ${err.message}`);
        }
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
