import { CisaKevMapper } from '../cisa-kev.mapper';

describe('CisaKevMapper', () => {
  it('should normalize official CISA KEV fields accurately', () => {
    const raw = {
      cveID: 'cve-2021-44228',
      vendorProject: 'Apache',
      product: 'Log4j',
      vulnerabilityName: 'Apache Log4j Remote Code Execution Vulnerability',
      dateAdded: '2021-12-10',
      shortDescription: 'Apache Log4j2 contains an unauthenticated remote code execution vulnerability.',
      requiredAction: 'Apply updates per vendor instructions.',
      dueDate: '2021-12-24',
      knownRansomwareCampaignUse: 'Known',
      notes: 'https://nvd.nist.gov/vuln/detail/CVE-2021-44228',
    };

    const normalized = CisaKevMapper.toNormalizedEntry(raw);

    expect(normalized.cveId).toBe('CVE-2021-44228');
    expect(normalized.vendorProject).toBe('Apache');
    expect(normalized.product).toBe('Log4j');
    expect(normalized.vulnerabilityName).toBe('Apache Log4j Remote Code Execution Vulnerability');
    expect(normalized.dateAdded).toBe('2021-12-10');
    expect(normalized.shortDescription).toContain('Log4j2 contains');
    expect(normalized.requiredAction).toBe('Apply updates per vendor instructions.');
    expect(normalized.dueDate).toBe('2021-12-24');
    expect(normalized.knownRansomwareCampaignUse).toBe('Known');
    expect(normalized.notes).toBe('https://nvd.nist.gov/vuln/detail/CVE-2021-44228');
    expect(normalized.sourceRecordId).toBe('CVE-2021-44228');
  });

  it('should preserve undefined/null when optional fields are omitted', () => {
    const raw = {
      cveID: 'CVE-2024-11111',
    };

    const normalized = CisaKevMapper.toNormalizedEntry(raw);

    expect(normalized.cveId).toBe('CVE-2024-11111');
    expect(normalized.vendorProject).toBeUndefined();
    expect(normalized.product).toBeUndefined();
    expect(normalized.requiredAction).toBeUndefined();
    expect(normalized.knownRansomwareCampaignUse).toBeUndefined();
  });
});
