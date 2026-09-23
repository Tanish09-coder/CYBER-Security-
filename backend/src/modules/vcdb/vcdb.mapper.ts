import crypto from 'crypto';
import {
  NormalizedVcdbIncident,
  VerisActorDimension,
  VerisActionDimension,
  VerisAssetDimension,
  VerisAttributeDimension,
  VerisTimeline,
  VerisExplicitCve,
} from './vcdb.types';
import { logger } from '../../config/logger';

export class VcdbMapper {
  /**
   * Calculates a deterministic SHA-256 hash of the individual incident object.
   */
  static calculateIncidentHash(obj: any): string {
    const jsonStr = JSON.stringify(obj, Object.keys(obj).sort());
    return crypto.createHash('sha256').update(jsonStr).digest('hex');
  }

  /**
   * Safely normalizes a raw VERIS incident record into the CyberRiskOS domain model.
   */
  static toNormalizedIncident(raw: any): NormalizedVcdbIncident | null {
    if (!raw || typeof raw !== 'object') return null;

    const vcdbId = raw.incident_id;
    if (!vcdbId || typeof vcdbId !== 'string' || vcdbId.trim().length === 0) {
      logger.warn('Skipping VCDB record lacking incident_id');
      return null;
    }

    const payloadHash = this.calculateIncidentHash(raw);
    const schemaVersion =
      typeof raw.schema_version === 'string' && raw.schema_version.trim().length > 0
        ? raw.schema_version.trim()
        : undefined;

    // Timeline mapping
    const timeline = this.extractTimeline(raw.timeline);

    // Victim metadata
    const victim = raw.victim || {};
    const victimCountry = Array.isArray(victim.country)
      ? victim.country[0]
      : typeof victim.country === 'string'
      ? victim.country
      : undefined;
    const victimIndustry = typeof victim.industry === 'string' ? victim.industry : undefined;
    const employeeCount = typeof victim.employee_count === 'string' ? victim.employee_count : undefined;

    // Data disclosure
    let dataDisclosure: string | undefined = undefined;
    if (raw.attribute?.confidentiality?.data_disclosure) {
      dataDisclosure = String(raw.attribute.confidentiality.data_disclosure);
    }

    // Discovery method
    const discoveryMethod = this.extractDiscoveryMethod(raw.discovery_method);

    // VERIS 4A Dimensions
    const actors = this.extractActors(raw.actor);
    const actions = this.extractActions(raw.action);
    const assets = this.extractAssets(raw.asset);
    const attributes = this.extractAttributes(raw.attribute);

    // Strict Explicit CVE Evidence extraction
    const explicitCves = this.extractExplicitCves(raw);

    return {
      vcdbId: vcdbId.trim(),
      sourceFilePath: typeof raw.plus?.github_file === 'string' ? raw.plus.github_file : undefined,
      incidentYear: timeline?.incidentYear,
      securityIncident: typeof raw.security_incident === 'string' ? raw.security_incident : undefined,
      confidence: typeof raw.confidence === 'string' ? raw.confidence : undefined,
      summary: typeof raw.summary === 'string' ? raw.summary : undefined,
      victimCountry,
      victimIndustry,
      employeeCount,
      dataDisclosure,
      discoveryMethod,
      schemaVersion,
      rawRecord: raw,
      payloadHash,
      actors,
      actions,
      assets,
      attributes,
      timeline,
      explicitCves,
    };
  }

  private static extractTimeline(timelineObj: any): VerisTimeline | undefined {
    if (!timelineObj || typeof timelineObj !== 'object') return undefined;

    const incTime = timelineObj.incident || {};
    const incidentYear = typeof incTime.year === 'number' ? incTime.year : undefined;
    const incidentMonth = typeof incTime.month === 'number' ? incTime.month : undefined;
    const incidentDay = typeof incTime.day === 'number' ? incTime.day : undefined;

    const comp = timelineObj.compromise || {};
    const disc = timelineObj.discovery || {};
    const cont = timelineObj.containment || {};
    const exfi = timelineObj.exfiltration || {};

    return {
      incidentYear,
      incidentMonth,
      incidentDay,
      compromiseUnit: typeof comp.unit === 'string' ? comp.unit : undefined,
      compromiseValue: typeof comp.value === 'number' ? comp.value : undefined,
      discoveryUnit: typeof disc.unit === 'string' ? disc.unit : undefined,
      discoveryValue: typeof disc.value === 'number' ? disc.value : undefined,
      containmentUnit: typeof cont.unit === 'string' ? cont.unit : undefined,
      containmentValue: typeof cont.value === 'number' ? cont.value : undefined,
      exfiltrationUnit: typeof exfi.unit === 'string' ? exfi.unit : undefined,
      exfiltrationValue: typeof exfi.value === 'number' ? exfi.value : undefined,
    };
  }

  private static extractDiscoveryMethod(methodObj: any): string | undefined {
    if (!methodObj) return undefined;
    if (typeof methodObj === 'string') return methodObj;
    if (typeof methodObj === 'object') {
      const keys = Object.keys(methodObj);
      if (keys.length > 0) return keys[0];
    }
    return undefined;
  }

  private static extractActors(actorObj: any): VerisActorDimension[] {
    const list: VerisActorDimension[] = [];
    if (!actorObj || typeof actorObj !== 'object') return list;

    const categoryMap: Record<string, 'External' | 'Internal' | 'Partner' | 'Unknown'> = {
      external: 'External',
      internal: 'Internal',
      partner: 'Partner',
      unknown: 'Unknown',
    };

    for (const [key, detailsObj] of Object.entries(actorObj)) {
      const details = detailsObj as any;
      const normKey = key.toLowerCase();
      const actorCategory = categoryMap[normKey] || 'Unknown';
      if (details && typeof details === 'object') {
        const motive = Array.isArray(details.motive)
          ? details.motive.join(', ')
          : typeof details.motive === 'string'
          ? details.motive
          : undefined;
        const country = Array.isArray(details.country)
          ? details.country.join(', ')
          : typeof details.country === 'string'
          ? details.country
          : undefined;
        const variety = Array.isArray(details.variety)
          ? details.variety.join(', ')
          : typeof details.variety === 'string'
          ? details.variety
          : undefined;

        list.push({
          actorCategory,
          actorSubtype: variety,
          motive,
          country,
          sourcePath: `actor.${key}`,
        });
      } else {
        list.push({ actorCategory, sourcePath: `actor.${key}` });
      }
    }

    return list;
  }

  private static extractActions(actionObj: any): VerisActionDimension[] {
    const list: VerisActionDimension[] = [];
    if (!actionObj || typeof actionObj !== 'object') return list;

    const categoryMap: Record<string, 'Hacking' | 'Malware' | 'Social' | 'Misuse' | 'Physical' | 'Error' | 'Environmental' | 'Unknown'> = {
      hacking: 'Hacking',
      malware: 'Malware',
      social: 'Social',
      misuse: 'Misuse',
      physical: 'Physical',
      error: 'Error',
      environmental: 'Environmental',
      unknown: 'Unknown',
    };

    for (const [key, detailsObj] of Object.entries(actionObj)) {
      const details = detailsObj as any;
      const normKey = key.toLowerCase();
      const actionCategory = categoryMap[normKey] || 'Unknown';
      if (details && typeof details === 'object') {
        const variety = Array.isArray(details.variety)
          ? details.variety.join(', ')
          : typeof details.variety === 'string'
          ? details.variety
          : undefined;
        const vector = Array.isArray(details.vector)
          ? details.vector.join(', ')
          : typeof details.vector === 'string'
          ? details.vector
          : undefined;

        list.push({
          actionCategory,
          vector,
          variety,
        });
      } else {
        list.push({ actionCategory });
      }
    }

    return list;
  }

  private static extractAssets(assetObj: any): VerisAssetDimension[] {
    const list: VerisAssetDimension[] = [];
    if (!assetObj || typeof assetObj !== 'object') return list;

    if (Array.isArray(assetObj.assets)) {
      for (const item of assetObj.assets) {
        if (!item || typeof item !== 'object') continue;
        const varietyStr = typeof item.variety === 'string' ? item.variety : '';
        let category: 'Server' | 'Network' | 'User Device' | 'Media' | 'Person' | 'Unknown' = 'Unknown';

        if (varietyStr.startsWith('S -') || varietyStr.includes('Server')) category = 'Server';
        else if (varietyStr.startsWith('N -') || varietyStr.includes('Network')) category = 'Network';
        else if (varietyStr.startsWith('U -') || varietyStr.includes('User')) category = 'User Device';
        else if (varietyStr.startsWith('M -') || varietyStr.includes('Media')) category = 'Media';
        else if (varietyStr.startsWith('P -') || varietyStr.includes('Person')) category = 'Person';

        list.push({
          assetCategory: category,
          assetVariety: varietyStr || undefined,
          amount: typeof item.amount === 'number' ? item.amount : undefined,
        });
      }
    }

    return list;
  }

  private static extractAttributes(attributeObj: any): VerisAttributeDimension[] {
    const list: VerisAttributeDimension[] = [];
    if (!attributeObj || typeof attributeObj !== 'object') return list;

    if (attributeObj.confidentiality) {
      const c = attributeObj.confidentiality;
      const variety = Array.isArray(c.data)
        ? c.data.map((d: any) => d.variety || d).join(', ')
        : undefined;
      const dataVariety = Array.isArray(c.data_disclosure) ? c.data_disclosure.join(', ') : undefined;
      list.push({
        attributeCategory: 'Confidentiality',
        variety,
        dataVariety,
        recordCount: typeof c.data_total === 'number' ? c.data_total : undefined,
      });
    }

    if (attributeObj.integrity) {
      const i = attributeObj.integrity;
      const variety = Array.isArray(i.variety) ? i.variety.join(', ') : undefined;
      list.push({
        attributeCategory: 'Integrity',
        variety,
      });
    }

    if (attributeObj.availability) {
      const a = attributeObj.availability;
      const variety = Array.isArray(a.variety) ? a.variety.join(', ') : undefined;
      list.push({
        attributeCategory: 'Availability',
        variety,
      });
    }

    return list;
  }

  /**
   * Tightened CVE Evidence extraction:
   * Extracts authoritative CVE IDs ONLY when present in explicit structured fields
   * (e.g., action.hacking.cve, action.malware.cve, action.error.cve, cve_id, cve).
   * Does NOT extract from free-text notes/summary to avoid fabricating unconfirmed relationships.
   */
  private static extractExplicitCves(raw: any): VerisExplicitCve[] {
    const list: VerisExplicitCve[] = [];
    const seen = new Set<string>();

    const checkAndAdd = (cveVal: any, evidenceSource: string) => {
      if (!cveVal) return;
      const cveStrings: string[] = [];

      if (typeof cveVal === 'string') {
        cveVal.split(/[,;\s]+/).forEach((s) => cveStrings.push(s.trim()));
      } else if (Array.isArray(cveVal)) {
        cveVal.forEach((item) => {
          if (typeof item === 'string') cveStrings.push(item.trim());
          else if (item && typeof item.cve === 'string') cveStrings.push(item.cve.trim());
        });
      }

      for (const str of cveStrings) {
        const upper = str.toUpperCase();
        if (/^CVE-\d{4}-\d{4,7}$/.test(upper)) {
          const key = `${upper}:${evidenceSource}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({
              cveId: upper,
              evidenceSource,
              sourcePath: evidenceSource,
            });
          }
        }
      }
    };

    // 1. Structured action fields
    if (raw.action?.hacking?.cve) {
      checkAndAdd(raw.action.hacking.cve, 'action.hacking.cve');
    }
    if (raw.action?.malware?.cve) {
      checkAndAdd(raw.action.malware.cve, 'action.malware.cve');
    }
    if (raw.action?.error?.cve) {
      checkAndAdd(raw.action.error.cve, 'action.error.cve');
    }

    // 2. Structured top-level fields
    if (raw.cve) {
      checkAndAdd(raw.cve, 'cve');
    }
    if (raw.cve_id) {
      checkAndAdd(raw.cve_id, 'cve_id');
    }

    return list;
  }
}
