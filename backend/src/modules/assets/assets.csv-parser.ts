// =============================================================================
// CyberRiskOS — Enterprise Asset CSV Parser
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { CreateAssetRequest, ImportRowError } from './assets.types';

export interface CsvParseResult {
  assets: Omit<CreateAssetRequest, 'organization_id'>[];
  errors: ImportRowError[];
  totalRows: number;
}

// Column header aliases for flexible mapping
const HEADER_ALIASES: Record<string, string> = {
  name: 'name',
  asset_name: 'name',
  'asset name': 'name',
  hostname: 'hostname',
  host_name: 'hostname',
  'host name': 'hostname',
  ip: 'ip_address',
  ip_address: 'ip_address',
  'ip address': 'ip_address',
  mac: 'mac_address',
  mac_address: 'mac_address',
  'mac address': 'mac_address',
  type: 'asset_type',
  asset_type: 'asset_type',
  'asset type': 'asset_type',
  os: 'operating_system',
  operating_system: 'operating_system',
  'operating system': 'operating_system',
  environment: 'environment',
  env: 'environment',
  owner: 'owner',
  is_internet_facing: 'is_internet_facing',
  internet_facing: 'is_internet_facing',
  'internet facing': 'is_internet_facing',
  criticality: 'business_criticality',
  business_criticality: 'business_criticality',
  'business criticality': 'business_criticality',
  criticality_tier: 'business_criticality',
  data_classification: 'data_classification',
  'data classification': 'data_classification',
  classification: 'data_classification',
  business_unit_id: 'business_unit_id',
  asset_identifier: 'asset_identifier',
  revenue_dependency_pct: 'revenue_dependency_pct',
  operational_importance: 'operational_importance',
};

/**
 * Tokenize a single CSV line handling quotes, commas, and escapes
 */
export function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        currentValue += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue.trim());
  return values;
}

/**
 * Parses raw CSV string into validated asset DTO objects with row-level error reporting.
 */
export function parseAssetCsv(csvContent: string): CsvParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { assets: [], errors: [{ row: 0, message: 'CSV content is empty' }], totalRows: 0 };
  }

  const rawHeaders = parseCsvLine(lines[0]);
  const mappedHeaders: (string | null)[] = rawHeaders.map((h) => {
    const cleanHeader = h.toLowerCase().trim();
    return HEADER_ALIASES[cleanHeader] || null;
  });

  const nameIndex = mappedHeaders.indexOf('name');
  if (nameIndex === -1) {
    return {
      assets: [],
      errors: [
        {
          row: 1,
          field: 'headers',
          message: 'Missing required "name" (or "asset_name") column in CSV header',
        },
      ],
      totalRows: lines.length - 1,
    };
  }

  const assets: Omit<CreateAssetRequest, 'organization_id'>[] = [];
  const errors: ImportRowError[] = [];

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const rowNumber = lineIdx + 1;
    const values = parseCsvLine(lines[lineIdx]);

    if (values.every((v) => v === '')) {
      continue; // Skip empty row
    }

    const rowObj: Record<string, any> = {};
    for (let colIdx = 0; colIdx < mappedHeaders.length; colIdx++) {
      const headerKey = mappedHeaders[colIdx];
      if (headerKey && colIdx < values.length) {
        const val = values[colIdx];
        if (val !== '') {
          rowObj[headerKey] = val;
        }
      }
    }

    // Validation
    const name = rowObj.name;
    if (!name || name.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: 'Asset name cannot be empty',
        rawValue: '',
      });
      continue;
    }

    let businessCriticality = 3;
    if (rowObj.business_criticality !== undefined) {
      const parsedCrit = parseInt(rowObj.business_criticality, 10);
      if (isNaN(parsedCrit) || parsedCrit < 1 || parsedCrit > 5) {
        errors.push({
          row: rowNumber,
          field: 'business_criticality',
          message: 'business_criticality must be an integer between 1 and 5',
          rawValue: String(rowObj.business_criticality),
        });
        continue;
      }
      businessCriticality = parsedCrit;
    }

    let isInternetFacing = false;
    if (rowObj.is_internet_facing !== undefined) {
      const strVal = String(rowObj.is_internet_facing).toLowerCase();
      if (['true', '1', 'yes', 'y'].includes(strVal)) {
        isInternetFacing = true;
      } else if (['false', '0', 'no', 'n'].includes(strVal)) {
        isInternetFacing = false;
      } else {
        errors.push({
          row: rowNumber,
          field: 'is_internet_facing',
          message: 'Invalid boolean value for is_internet_facing (expected true/false, 1/0, yes/no)',
          rawValue: String(rowObj.is_internet_facing),
        });
        continue;
      }
    }

    let macAddress: string | undefined = undefined;
    if (rowObj.mac_address) {
      const cleanMac = String(rowObj.mac_address).trim().toUpperCase();
      if (/^([0-9A-F]{2}[:-]){5}[0-9A-F]{2}$/.test(cleanMac)) {
        macAddress = cleanMac;
      } else {
        errors.push({
          row: rowNumber,
          field: 'mac_address',
          message: 'Invalid MAC address format (expected XX:XX:XX:XX:XX:XX)',
          rawValue: String(rowObj.mac_address),
        });
        continue;
      }
    }

    let ipAddress: string | undefined = undefined;
    if (rowObj.ip_address) {
      const cleanIp = String(rowObj.ip_address).trim();
      let isValidIp = false;
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanIp)) {
        const octets = cleanIp.split('.').map(Number);
        isValidIp = octets.every((o) => o >= 0 && o <= 255);
      } else if (cleanIp.includes(':') && /^[0-9a-fA-F:]+$/.test(cleanIp)) {
        isValidIp = true;
      }

      if (isValidIp) {
        ipAddress = cleanIp;
      } else {
        errors.push({
          row: rowNumber,
          field: 'ip_address',
          message: 'Invalid IP address format',
          rawValue: String(rowObj.ip_address),
        });
        continue;
      }
    }

    let revenueDependencyPct: number | undefined = undefined;
    if (rowObj.revenue_dependency_pct !== undefined) {
      const parsedRev = parseFloat(rowObj.revenue_dependency_pct);
      if (isNaN(parsedRev) || parsedRev < 0 || parsedRev > 100) {
        errors.push({
          row: rowNumber,
          field: 'revenue_dependency_pct',
          message: 'revenue_dependency_pct must be a number between 0 and 100',
          rawValue: String(rowObj.revenue_dependency_pct),
        });
        continue;
      }
      revenueDependencyPct = parsedRev;
    }

    let operationalImportance: number | undefined = undefined;
    if (rowObj.operational_importance !== undefined) {
      const parsedOp = parseFloat(rowObj.operational_importance);
      if (isNaN(parsedOp) || parsedOp < 0) {
        errors.push({
          row: rowNumber,
          field: 'operational_importance',
          message: 'operational_importance must be a non-negative number',
          rawValue: String(rowObj.operational_importance),
        });
        continue;
      }
      operationalImportance = parsedOp;
    }

    const assetItem: Omit<CreateAssetRequest, 'organization_id'> = {
      name: name.trim(),
      hostname: rowObj.hostname ? String(rowObj.hostname).trim() : undefined,
      ip_address: ipAddress,
      mac_address: macAddress,
      asset_type: rowObj.asset_type ? String(rowObj.asset_type).trim().toLowerCase() : 'server',
      operating_system: rowObj.operating_system ? String(rowObj.operating_system).trim() : undefined,
      environment: rowObj.environment ? String(rowObj.environment).trim() : 'Production',
      owner: rowObj.owner ? String(rowObj.owner).trim() : undefined,
      is_internet_facing: isInternetFacing,
      business_criticality: businessCriticality,
      data_classification: rowObj.data_classification ? String(rowObj.data_classification).trim() : 'Internal',
      business_unit_id: rowObj.business_unit_id ? String(rowObj.business_unit_id).trim() : undefined,
      asset_identifier: rowObj.asset_identifier ? String(rowObj.asset_identifier).trim() : undefined,
      revenue_dependency_pct: revenueDependencyPct,
      operational_importance: operationalImportance,
    };

    assets.push(assetItem);
  }

  return {
    assets,
    errors,
    totalRows: lines.length - 1,
  };
}
