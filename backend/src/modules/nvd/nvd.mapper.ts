import {
  NvdCveItem,
  CvssMetricV40,
  CvssMetricV3,
  CvssMetricV2,
} from './nvd.types';

export interface NormalizedCvssAssessment {
  source: string;
  type: string;
  version: string;
  vectorString?: string;
  baseScore: number;
  baseSeverity?: string;
  attackVector?: string;
  attackComplexity?: string;
  privilegesRequired?: string;
  userInteraction?: string;
  scope?: string;
  confidentialityImpact?: string;
  integrityImpact?: string;
  availabilityImpact?: string;
  rawMetricJson: any;
}

export interface NormalizedVulnerability {
  cveId: string;
  description?: string;
  sourceIdentifier?: string;
  vulnStatus?: string;
  publishedAt?: string;
  modifiedAt?: string;
  source: string;
  sourceRecordId: string;

  // Preferred / Display Metrics
  cvssVersion?: string;
  cvssBaseScore?: number;
  cvssBaseSeverity?: string;
  attackVector?: string;
  attackComplexity?: string;
  privilegesRequired?: string;
  userInteraction?: string;
  scope?: string;
  confidentialityImpact?: string;
  integrityImpact?: string;
  availabilityImpact?: string;

  // Preserved Child Collections
  cvssAssessments: NormalizedCvssAssessment[];
  weaknesses: { cweId: string; description?: string }[];
  references: { url: string; source?: string; tags?: string[] }[];
  cpes: {
    criteria: string;
    vulnerable: boolean;
    versionStartIncluding?: string;
    versionStartExcluding?: string;
    versionEndIncluding?: string;
    versionEndExcluding?: string;
  }[];
}

export class NvdMapper {
  static toNormalizedVulnerability(cve: NvdCveItem): NormalizedVulnerability {
    // 1. Description (Prefer English)
    let description: string | undefined = undefined;
    if (cve.descriptions && cve.descriptions.length > 0) {
      const enDesc = cve.descriptions.find((d) => d.lang.toLowerCase() === 'en');
      description = enDesc ? enDesc.value : cve.descriptions[0].value;
    }

    // 2. Extract and preserve ALL CVSS assessments across all sources (NVD/NIST, CNA, ADP)
    const cvssAssessments: NormalizedCvssAssessment[] = [];
    const metrics = cve.metrics || {};

    // CVSS v4.0
    if (metrics.cvssMetricV40) {
      for (const m of metrics.cvssMetricV40) {
        cvssAssessments.push({
          source: m.source,
          type: m.type,
          version: '4.0',
          vectorString: m.cvssData?.vectorString,
          baseScore: m.cvssData?.baseScore,
          baseSeverity: m.cvssData?.baseSeverity,
          attackVector: m.cvssData?.attackVector,
          attackComplexity: m.cvssData?.attackComplexity,
          privilegesRequired: m.cvssData?.privilegesRequired,
          userInteraction: m.cvssData?.userInteraction,
          scope: m.cvssData?.scope,
          confidentialityImpact: m.cvssData?.confidentialityImpact,
          integrityImpact: m.cvssData?.integrityImpact,
          availabilityImpact: m.cvssData?.availabilityImpact,
          rawMetricJson: m,
        });
      }
    }

    // CVSS v3.1
    if (metrics.cvssMetricV31) {
      for (const m of metrics.cvssMetricV31) {
        cvssAssessments.push({
          source: m.source,
          type: m.type,
          version: '3.1',
          vectorString: m.cvssData?.vectorString,
          baseScore: m.cvssData?.baseScore,
          baseSeverity: m.cvssData?.baseSeverity,
          attackVector: m.cvssData?.attackVector,
          attackComplexity: m.cvssData?.attackComplexity,
          privilegesRequired: m.cvssData?.privilegesRequired,
          userInteraction: m.cvssData?.userInteraction,
          scope: m.cvssData?.scope,
          confidentialityImpact: m.cvssData?.confidentialityImpact,
          integrityImpact: m.cvssData?.integrityImpact,
          availabilityImpact: m.cvssData?.availabilityImpact,
          rawMetricJson: m,
        });
      }
    }

    // CVSS v3.0
    if (metrics.cvssMetricV30) {
      for (const m of metrics.cvssMetricV30) {
        cvssAssessments.push({
          source: m.source,
          type: m.type,
          version: '3.0',
          vectorString: m.cvssData?.vectorString,
          baseScore: m.cvssData?.baseScore,
          baseSeverity: m.cvssData?.baseSeverity,
          attackVector: m.cvssData?.attackVector,
          attackComplexity: m.cvssData?.attackComplexity,
          privilegesRequired: m.cvssData?.privilegesRequired,
          userInteraction: m.cvssData?.userInteraction,
          scope: m.cvssData?.scope,
          confidentialityImpact: m.cvssData?.confidentialityImpact,
          integrityImpact: m.cvssData?.integrityImpact,
          availabilityImpact: m.cvssData?.availabilityImpact,
          rawMetricJson: m,
        });
      }
    }

    // CVSS v2.0
    if (metrics.cvssMetricV2) {
      for (const m of metrics.cvssMetricV2) {
        cvssAssessments.push({
          source: m.source,
          type: m.type,
          version: '2.0',
          vectorString: m.cvssData?.vectorString,
          baseScore: m.cvssData?.baseScore,
          baseSeverity: m.baseSeverity || (m.cvssData?.baseScore >= 7 ? 'HIGH' : m.cvssData?.baseScore >= 4 ? 'MEDIUM' : 'LOW'),
          attackVector: m.cvssData?.accessVector,
          attackComplexity: m.cvssData?.accessComplexity,
          privilegesRequired: m.cvssData?.authentication,
          confidentialityImpact: m.cvssData?.confidentialityImpact,
          integrityImpact: m.cvssData?.integrityImpact,
          availabilityImpact: m.cvssData?.availabilityImpact,
          rawMetricJson: m,
        });
      }
    }

    // 3. Derive preferred / display assessment
    // Priority: v4.0 > v3.1 > v3.0 > v2.0, with Primary preferred over Secondary
    const preferred = NvdMapper.selectPreferredAssessment(cvssAssessments);

    // 4. Extract Weaknesses (CWE)
    const weaknesses: { cweId: string; description?: string }[] = [];
    if (cve.weaknesses) {
      for (const w of cve.weaknesses) {
        for (const d of w.description || []) {
          const val = d.value.trim();
          if (/^CWE-\d+$/i.test(val)) {
            weaknesses.push({
              cweId: val.toUpperCase(),
              description: `Source: ${w.source}`,
            });
          }
        }
      }
    }

    // 5. Extract Configurations / CPEs
    const cpes: NormalizedVulnerability['cpes'] = [];
    if (cve.configurations) {
      for (const config of cve.configurations) {
        for (const node of config.nodes || []) {
          for (const match of node.cpeMatch || []) {
            cpes.push({
              criteria: match.criteria,
              vulnerable: match.vulnerable !== false,
              versionStartIncluding: match.versionStartIncluding,
              versionStartExcluding: match.versionStartExcluding,
              versionEndIncluding: match.versionEndIncluding,
              versionEndExcluding: match.versionEndExcluding,
            });
          }
        }
      }
    }

    // 6. Extract References
    const references: NormalizedVulnerability['references'] = [];
    if (cve.references) {
      for (const r of cve.references) {
        references.push({
          url: r.url,
          source: r.source,
          tags: r.tags || [],
        });
      }
    }

    return {
      cveId: cve.id.toUpperCase(),
      description,
      sourceIdentifier: cve.sourceIdentifier,
      vulnStatus: cve.vulnStatus,
      publishedAt: cve.published,
      modifiedAt: cve.lastModified,
      source: 'NVD',
      sourceRecordId: cve.id.toUpperCase(),

      // Preferred CVSS Metrics
      cvssVersion: preferred?.version,
      cvssBaseScore: preferred?.baseScore,
      cvssBaseSeverity: preferred?.baseSeverity,
      attackVector: preferred?.attackVector,
      attackComplexity: preferred?.attackComplexity,
      privilegesRequired: preferred?.privilegesRequired,
      userInteraction: preferred?.userInteraction,
      scope: preferred?.scope,
      confidentialityImpact: preferred?.confidentialityImpact,
      integrityImpact: preferred?.integrityImpact,
      availabilityImpact: preferred?.availabilityImpact,

      cvssAssessments,
      weaknesses,
      references,
      cpes,
    };
  }

  private static selectPreferredAssessment(
    assessments: NormalizedCvssAssessment[]
  ): NormalizedCvssAssessment | undefined {
    if (assessments.length === 0) return undefined;

    const versionRank: Record<string, number> = {
      '4.0': 4,
      '3.1': 3,
      '3.0': 2,
      '2.0': 1,
    };

    return [...assessments].sort((a, b) => {
      const rankA = versionRank[a.version] || 0;
      const rankB = versionRank[b.version] || 0;
      if (rankA !== rankB) return rankB - rankA;

      // Prefer Primary over Secondary
      const isPrimaryA = a.type?.toLowerCase() === 'primary' ? 1 : 0;
      const isPrimaryB = b.type?.toLowerCase() === 'primary' ? 1 : 0;
      return isPrimaryB - isPrimaryA;
    })[0];
  }
}
