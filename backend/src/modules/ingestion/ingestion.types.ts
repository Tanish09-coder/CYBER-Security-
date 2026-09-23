export type SyncType = 'MANUAL' | 'INCREMENTAL' | 'DATE_RANGE' | 'CVE_LOOKUP' | 'FULL_CATALOG';
export type IngestionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

export interface DataSourceRecord {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  dataType: string;
  enabled: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IngestionRunRecord {
  id: string;
  sourceId: string;
  startedAt: string;
  completedAt?: string;
  status: IngestionStatus;
  syncType: SyncType;
  recordsReceived: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errorCount: number;
  errorMessage?: string;
  requestParameters?: Record<string, unknown>;
  createdAt: string;
}

export interface RawSourceRecord {
  id: string;
  sourceId: string;
  ingestionRunId?: string;
  externalId: string;
  payloadJson: any;
  payloadHash: string;
  sourcePublishedAt?: string;
  sourceModifiedAt?: string;
  ingestedAt: string;
  createdAt: string;
}

export interface IngestionResult {
  runId: string;
  status: IngestionStatus;
  syncType: SyncType;
  recordsReceived: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errorCount: number;
  errorMessage?: string;
  durationMs: number;
}
