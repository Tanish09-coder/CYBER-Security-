import { NvdMapper } from '../nvd.mapper';
import v40Fixture from './fixtures/nvd-cve-v40.json';
import v31Fixture from './fixtures/nvd-cve-v31.json';
import noCvssFixture from './fixtures/nvd-cve-no-cvss.json';

describe('NvdMapper', () => {
  it('should map CVE metadata correctly', () => {
    const result = NvdMapper.toNormalizedVulnerability(v31Fixture as any);

    expect(result.cveId).toBe('CVE-2021-44228');
    expect(result.sourceIdentifier).toBe('cve@mitre.org');
    expect(result.vulnStatus).toBe('Analyzed');
    expect(result.publishedAt).toBe('2021-12-10T10:15:00.000');
    expect(result.modifiedAt).toBe('2023-11-07T12:00:00.000');
    expect(result.source).toBe('NVD');
    expect(result.sourceRecordId).toBe('CVE-2021-44228');
    expect(result.description).toContain('Apache Log4j2');
  });

  it('should prioritize CVSS v4.0 over CVSS v3.1', () => {
    const result = NvdMapper.toNormalizedVulnerability(v40Fixture as any);

    expect(result.cvssVersion).toBe('4.0');
    expect(result.cvssBaseScore).toBe(9.3);
    expect(result.cvssBaseSeverity).toBe('CRITICAL');
    expect(result.attackVector).toBe('NETWORK');
    expect(result.attackComplexity).toBe('LOW');
  });

  it('should fall back to CVSS v3.1 when CVSS v4.0 is not present', () => {
    const result = NvdMapper.toNormalizedVulnerability(v31Fixture as any);

    expect(result.cvssVersion).toBe('3.1');
    expect(result.cvssBaseScore).toBe(10.0);
    expect(result.cvssBaseSeverity).toBe('CRITICAL');
    expect(result.scope).toBe('CHANGED');
  });

  it('should preserve all available CVSS assessments and their sources', () => {
    const result = NvdMapper.toNormalizedVulnerability(v31Fixture as any);

    expect(result.cvssAssessments.length).toBe(2);
    const nvdAssessment = result.cvssAssessments.find((a) => a.source === 'nvd@nist.gov');
    const apacheAssessment = result.cvssAssessments.find((a) => a.source === 'security@apache.org');

    expect(nvdAssessment).toBeDefined();
    expect(nvdAssessment?.type).toBe('Primary');
    expect(nvdAssessment?.baseScore).toBe(10.0);

    expect(apacheAssessment).toBeDefined();
    expect(apacheAssessment?.type).toBe('Secondary');
    expect(apacheAssessment?.baseScore).toBe(10.0);
  });

  it('should set CVSS metrics to null/undefined when not provided (never invent scores)', () => {
    const result = NvdMapper.toNormalizedVulnerability(noCvssFixture as any);

    expect(result.cvssVersion).toBeUndefined();
    expect(result.cvssBaseScore).toBeUndefined();
    expect(result.cvssBaseSeverity).toBeUndefined();
    expect(result.cvssAssessments.length).toBe(0);
  });

  it('should extract valid CWE identifiers', () => {
    const result = NvdMapper.toNormalizedVulnerability(v31Fixture as any);

    expect(result.weaknesses.length).toBe(1);
    expect(result.weaknesses[0].cweId).toBe('CWE-502');
  });

  it('should extract affected CPEs with version bounds', () => {
    const result = NvdMapper.toNormalizedVulnerability(v31Fixture as any);

    expect(result.cpes.length).toBe(1);
    expect(result.cpes[0].criteria).toBe('cpe:2.3:a:apache:log4j:*:*:*:*:*:*:*:*');
    expect(result.cpes[0].vulnerable).toBe(true);
    expect(result.cpes[0].versionStartIncluding).toBe('2.0-beta9');
    expect(result.cpes[0].versionEndExcluding).toBe('2.15.0');
  });

  it('should extract references and tags', () => {
    const result = NvdMapper.toNormalizedVulnerability(v31Fixture as any);

    expect(result.references.length).toBe(1);
    expect(result.references[0].url).toBe('https://logging.apache.org/log4j/2.x/security.html');
    expect(result.references[0].tags).toContain('Vendor Advisory');
  });
});
