import { VcdbMapper } from '../vcdb.mapper';

describe('VcdbMapper', () => {
  it('should map a complete VERIS 4A incident with victim metadata and structured CVEs', () => {
    const rawIncident = {
      incident_id: 'INC-2024-999',
      summary: 'SQL Injection leading to customer data leak CVE-2023-9999 mentioned in text notes',
      reference: 'https://example.com/incident-report',
      schema_version: '1.3.6',
      security_incident: 'Confirmed',
      confidence: 'High',
      victim: {
        victim_id: ['Acme Corp'],
        industry: '522110',
        country: ['US'],
        employee_count: '1000 to 9999',
        state: 'CA',
      },
      actor: {
        external: {
          motive: ['Financial'],
          variety: ['Organized crime'],
        },
      },
      action: {
        hacking: {
          variety: ['SQLi', 'Exploit vuln'],
          vector: ['Web application'],
          cve: ['CVE-2023-1234', 'CVE-2023-5678'],
        },
      },
      asset: {
        assets: [
          { variety: 'S - Web application' },
          { variety: 'S - Database' },
        ],
      },
      attribute: {
        confidentiality: {
          data: [{ variety: 'Personal' }, { variety: 'Medical' }],
          data_disclosure: 'Yes',
          data_total: 5000,
        },
      },
      timeline: {
        incident: { year: 2023, month: 5, day: 12 },
        compromise: { unit: 'Minutes' },
        exfiltration: { unit: 'Hours' },
        discovery: { unit: 'Weeks' },
      },
      notes: 'Contains mention of CVE-2024-0000 in free text notes, which must NOT create an authoritative CVE join.',
    };

    const mapped = VcdbMapper.toNormalizedIncident(rawIncident);

    expect(mapped).not.toBeNull();
    if (!mapped) return;

    expect(mapped.vcdbId).toBe('INC-2024-999');
    expect(mapped.schemaVersion).toBe('1.3.6');
    expect(mapped.victimIndustry).toBe('522110');
    expect(mapped.victimCountry).toBe('US');

    // 4A Actors
    expect(mapped.actors).toHaveLength(1);
    expect(mapped.actors[0].actorCategory).toBe('External');
    expect(mapped.actors[0].motive).toBe('Financial');

    // 4A Actions
    expect(mapped.actions).toHaveLength(1);
    expect(mapped.actions[0].actionCategory).toBe('Hacking');
    expect(mapped.actions[0].variety).toContain('SQLi');

    // 4A Assets
    expect(mapped.assets).toHaveLength(2);
    expect(mapped.assets[0].assetCategory).toBe('Server');
    expect(mapped.assets[0].assetVariety).toBe('S - Web application');

    // 4A Attributes
    expect(mapped.attributes).toHaveLength(1);
    expect(mapped.attributes[0].attributeCategory).toBe('Confidentiality');

    // Timeline
    expect(mapped.timeline).toBeDefined();
    expect(mapped.timeline?.incidentYear).toBe(2023);

    // Tightened CVE Rule check:
    // Only structured action.hacking.cve values ('CVE-2023-1234', 'CVE-2023-5678') are mapped!
    // Free text mentions ('CVE-2023-9999', 'CVE-2024-0000') MUST NOT be mapped to vcdb_incident_cves!
    expect(mapped.explicitCves).toHaveLength(2);
    const cveIds = mapped.explicitCves.map((c) => c.cveId).sort();
    expect(cveIds).toEqual(['CVE-2023-1234', 'CVE-2023-5678']);
  });

  it('should fallback gracefully when optional VERIS fields are missing', () => {
    const rawMinimal = {
      incident_id: 'INC-MINIMAL-01',
    };

    const mapped = VcdbMapper.toNormalizedIncident(rawMinimal);
    expect(mapped).not.toBeNull();
    if (!mapped) return;

    expect(mapped.vcdbId).toBe('INC-MINIMAL-01');
    expect(mapped.actors).toHaveLength(0);
    expect(mapped.actions).toHaveLength(0);
    expect(mapped.assets).toHaveLength(0);
    expect(mapped.attributes).toHaveLength(0);
    expect(mapped.explicitCves).toHaveLength(0);
    expect(mapped.schemaVersion).toBeUndefined();
  });
});
