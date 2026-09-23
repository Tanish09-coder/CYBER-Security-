import { MitreAttackMapper } from '../mitre-attack.mapper';
import { StixBaseObject } from '../mitre-attack.types';

describe('MitreAttackMapper', () => {
  describe('extractAttackId', () => {
    it('should extract ATT&CK ID regardless of reference array ordering', () => {
      const obj: StixBaseObject = {
        type: 'attack-pattern',
        id: 'attack-pattern--1',
        external_references: [
          { source_name: 'cve', external_id: 'CVE-2021-44228' },
          { source_name: 'capec', external_id: 'CAPEC-100' },
          { source_name: 'mitre-attack', external_id: 'T1059.001', url: 'https://attack.mitre.org/techniques/T1059/001' },
        ],
      };

      expect(MitreAttackMapper.extractAttackId(obj)).toBe('T1059.001');
    });

    it('should return null when no mitre-attack external_reference exists', () => {
      const obj: StixBaseObject = {
        type: 'attack-pattern',
        id: 'attack-pattern--2',
        external_references: [
          { source_name: 'capec', external_id: 'CAPEC-100' },
        ],
      };

      expect(MitreAttackMapper.extractAttackId(obj)).toBeNull();
    });
  });

  describe('toNormalizedTactic', () => {
    it('should normalize x-mitre-tactic correctly', () => {
      const obj: StixBaseObject = {
        type: 'x-mitre-tactic',
        id: 'x-mitre-tactic--d108bedf-967c-451a-acde-eed22b8686b4',
        name: 'Initial Access',
        description: 'The adversary is trying to get into your network.',
        x_mitre_shortname: 'initial-access',
        created: '2018-10-17T00:14:20.652Z',
        modified: '2026-04-11T16:04:38.212Z',
        revoked: false,
        x_mitre_deprecated: false,
        created_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5',
        external_references: [
          { source_name: 'mitre-attack', external_id: 'TA0001' },
        ],
      };

      const result = MitreAttackMapper.toNormalizedTactic(obj);
      expect(result).not.toBeNull();
      expect(result?.stixId).toBe('x-mitre-tactic--d108bedf-967c-451a-acde-eed22b8686b4');
      expect(result?.attackId).toBe('TA0001');
      expect(result?.name).toBe('Initial Access');
      expect(result?.shortName).toBe('initial-access');
      expect(result?.revoked).toBe(false);
      expect(result?.deprecated).toBe(false);
    });
  });

  describe('toNormalizedTechnique', () => {
    it('should normalize technique and sub-technique attributes accurately', () => {
      const obj: StixBaseObject = {
        type: 'attack-pattern',
        id: 'attack-pattern--970a4a58-6933-4f9e-876e-aa5e4939b70b',
        name: 'PowerShell',
        description: 'Adversaries may abuse PowerShell commands.',
        x_mitre_is_subtechnique: true,
        x_mitre_platforms: ['Windows'],
        kill_chain_phases: [
          { kill_chain_name: 'mitre-attack', phase_name: 'execution' },
        ],
        x_mitre_permissions_required: ['User'],
        created: '2020-01-23T18:03:46.248Z',
        modified: '2026-03-27T19:54:33.176Z',
        revoked: false,
        x_mitre_deprecated: false,
        external_references: [
          { source_name: 'mitre-attack', external_id: 'T1059.001' },
        ],
      };

      const result = MitreAttackMapper.toNormalizedTechnique(obj);
      expect(result).not.toBeNull();
      expect(result?.attackId).toBe('T1059.001');
      expect(result?.isSubtechnique).toBe(true);
      expect(result?.platforms).toEqual(['Windows']);
      expect(result?.killChainPhases).toEqual([
        { kill_chain_name: 'mitre-attack', phase_name: 'execution' },
      ]);
    });
  });

  describe('toNormalizedMitigation', () => {
    it('should normalize course-of-action to mitigation', () => {
      const obj: StixBaseObject = {
        type: 'course-of-action',
        id: 'course-of-action--78378372-test',
        name: 'Antivirus/Antimalware',
        description: 'Use signatures or heuristics.',
        external_references: [
          { source_name: 'mitre-attack', external_id: 'M1049' },
        ],
      };

      const result = MitreAttackMapper.toNormalizedMitigation(obj);
      expect(result?.attackId).toBe('M1049');
      expect(result?.name).toBe('Antivirus/Antimalware');
    });
  });

  describe('toNormalizedGroup', () => {
    it('should normalize intrusion-set to threat group with aliases', () => {
      const obj: StixBaseObject = {
        type: 'intrusion-set',
        id: 'intrusion-set--89948291-test',
        name: 'APT29',
        description: 'APT29 is a threat group.',
        aliases: ['Cozy Bear', 'NOBELIUM'],
        external_references: [
          { source_name: 'mitre-attack', external_id: 'G0016' },
        ],
      };

      const result = MitreAttackMapper.toNormalizedGroup(obj);
      expect(result?.attackId).toBe('G0016');
      expect(result?.name).toBe('APT29');
      expect(result?.aliases).toEqual(['Cozy Bear', 'NOBELIUM']);
    });
  });

  describe('toNormalizedSoftware', () => {
    it('should normalize malware and tools with correct software_type', () => {
      const malwareObj: StixBaseObject = {
        type: 'malware',
        id: 'malware--1',
        name: 'Mimikatz',
        external_references: [{ source_name: 'mitre-attack', external_id: 'S0002' }],
      };
      const toolObj: StixBaseObject = {
        type: 'tool',
        id: 'tool--1',
        name: 'PsExec',
        external_references: [{ source_name: 'mitre-attack', external_id: 'S0029' }],
      };

      const m = MitreAttackMapper.toNormalizedSoftware(malwareObj);
      const t = MitreAttackMapper.toNormalizedSoftware(toolObj);

      expect(m?.softwareType).toBe('MALWARE');
      expect(m?.attackId).toBe('S0002');
      expect(t?.softwareType).toBe('TOOL');
      expect(t?.attackId).toBe('S0029');
    });
  });

  describe('toNormalizedRelationship', () => {
    it('should preserve STIX relationships with source, target, and type', () => {
      const relObj: StixBaseObject = {
        type: 'relationship',
        id: 'relationship--rel1',
        relationship_type: 'uses',
        source_ref: 'intrusion-set--g0016',
        target_ref: 'attack-pattern--t1059',
        description: 'APT29 uses PowerShell commands.',
      };

      const rel = MitreAttackMapper.toNormalizedRelationship(relObj);
      expect(rel).not.toBeNull();
      expect(rel?.relationshipType).toBe('uses');
      expect(rel?.sourceStixId).toBe('intrusion-set--g0016');
      expect(rel?.targetStixId).toBe('attack-pattern--t1059');
      expect(rel?.sourceType).toBe('intrusion-set');
      expect(rel?.targetType).toBe('attack-pattern');
    });

    it('should preserve official relationships even when endpoint types are non-standard', () => {
      const relObj: StixBaseObject = {
        type: 'relationship',
        id: 'relationship--rel2',
        relationship_type: 'targets',
        source_ref: 'campaign--c0001',
        target_ref: 'identity--org1',
      };

      const rel = MitreAttackMapper.toNormalizedRelationship(relObj);
      expect(rel).not.toBeNull();
      expect(rel?.sourceStixId).toBe('campaign--c0001');
      expect(rel?.targetStixId).toBe('identity--org1');
    });
  });

  describe('revoked & deprecated preservation', () => {
    it('should preserve revoked and deprecated flags accurately without discarding records', () => {
      const revokedObj: StixBaseObject = {
        type: 'attack-pattern',
        id: 'attack-pattern--revoked',
        name: 'Old Technique',
        revoked: true,
        x_mitre_deprecated: true,
        external_references: [{ source_name: 'mitre-attack', external_id: 'T1000' }],
      };

      const tech = MitreAttackMapper.toNormalizedTechnique(revokedObj);
      expect(tech?.revoked).toBe(true);
      expect(tech?.deprecated).toBe(true);
    });
  });
});
