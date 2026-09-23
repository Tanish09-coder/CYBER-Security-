import {
  StixBaseObject,
  NormalizedMitreTactic,
  NormalizedMitreTechnique,
  NormalizedMitreMitigation,
  NormalizedMitreGroup,
  NormalizedMitreSoftware,
  NormalizedMitreRelationship,
} from './mitre-attack.types';
import { logger } from '../../config/logger';

export class MitreAttackMapper {
  /**
   * Authoritatively extracts the MITRE ATT&CK external ID (e.g. TA0001, T1059, M1036, G0001, S0001).
   * Does NOT assume array ordering; finds source_name matching 'mitre-attack' or 'mitre-enterprise-attack'.
   */
  static extractAttackId(obj: StixBaseObject): string | null {
    if (!obj.external_references || !Array.isArray(obj.external_references)) {
      return null;
    }

    const ref = obj.external_references.find(
      (r) =>
        r &&
        (r.source_name === 'mitre-attack' ||
          r.source_name === 'mitre-enterprise-attack' ||
          r.source_name === 'mitre-mobile-attack' ||
          r.source_name === 'mitre-ics-attack') &&
        r.external_id &&
        typeof r.external_id === 'string' &&
        r.external_id.trim().length > 0
    );

    return ref?.external_id ? ref.external_id.trim() : null;
  }

  static toNormalizedTactic(obj: StixBaseObject): NormalizedMitreTactic | null {
    const attackId = this.extractAttackId(obj);
    if (!attackId) {
      logger.warn(`Skipping x-mitre-tactic with missing external_id: ${obj.id}`);
      return null;
    }

    const rawShortName =
      obj.x_mitre_shortname ||
      (obj as any).short_name ||
      (obj as any).shortname ||
      (obj as any).x_mitre_short_name;

    const shortName = typeof rawShortName === 'string' && rawShortName.trim().length > 0
      ? rawShortName.trim().toLowerCase()
      : undefined;

    return {
      stixId: obj.id,
      attackId,
      name: obj.name || 'Unnamed Tactic',
      description: obj.description || undefined,
      shortName,
      created: obj.created || undefined,
      modified: obj.modified || undefined,
      revoked: Boolean(obj.revoked),
      deprecated: Boolean(obj.x_mitre_deprecated),
      sourceCreatedByRef: obj.created_by_ref || undefined,
    };
  }

  static toNormalizedTechnique(obj: StixBaseObject): NormalizedMitreTechnique | null {
    const attackId = this.extractAttackId(obj);
    if (!attackId) {
      logger.warn(`Skipping attack-pattern with missing external_id: ${obj.id}`);
      return null;
    }

    const isSubtechnique = Boolean(obj.x_mitre_is_subtechnique);

    const killChainPhases = Array.isArray(obj.kill_chain_phases)
      ? obj.kill_chain_phases.map((k) => ({
          kill_chain_name: typeof k?.kill_chain_name === 'string' ? k.kill_chain_name.trim().toLowerCase() : '',
          phase_name: typeof k?.phase_name === 'string' ? k.phase_name.trim().toLowerCase() : '',
        }))
      : [];

    return {
      stixId: obj.id,
      attackId,
      name: obj.name || 'Unnamed Technique',
      description: obj.description || undefined,
      isSubtechnique,
      // Note: parentAttackId and parentStixId are resolved authoritatively from
      // subtechnique-of STIX relationships per project requirement.
      platforms: Array.isArray(obj.x_mitre_platforms) ? obj.x_mitre_platforms : [],
      killChainPhases,
      permissionsRequired: Array.isArray(obj.x_mitre_permissions_required)
        ? obj.x_mitre_permissions_required
        : undefined,
      effectivePermissions: Array.isArray(obj.x_mitre_effective_permissions)
        ? obj.x_mitre_effective_permissions
        : undefined,
      defenseBypassed: Array.isArray(obj.x_mitre_defense_bypassed)
        ? obj.x_mitre_defense_bypassed
        : undefined,
      dataSources: Array.isArray(obj.x_mitre_data_sources)
        ? obj.x_mitre_data_sources
        : undefined,
      created: obj.created || undefined,
      modified: obj.modified || undefined,
      revoked: Boolean(obj.revoked),
      deprecated: Boolean(obj.x_mitre_deprecated),
    };
  }

  static toNormalizedMitigation(obj: StixBaseObject): NormalizedMitreMitigation | null {
    const attackId = this.extractAttackId(obj);
    if (!attackId) {
      logger.warn(`Skipping course-of-action with missing external_id: ${obj.id}`);
      return null;
    }

    return {
      stixId: obj.id,
      attackId,
      name: obj.name || 'Unnamed Mitigation',
      description: obj.description || undefined,
      created: obj.created || undefined,
      modified: obj.modified || undefined,
      revoked: Boolean(obj.revoked),
      deprecated: Boolean(obj.x_mitre_deprecated),
    };
  }

  static toNormalizedGroup(obj: StixBaseObject): NormalizedMitreGroup | null {
    const attackId = this.extractAttackId(obj);
    if (!attackId) {
      logger.warn(`Skipping intrusion-set with missing external_id: ${obj.id}`);
      return null;
    }

    return {
      stixId: obj.id,
      attackId,
      name: obj.name || 'Unnamed Group',
      description: obj.description || undefined,
      aliases: Array.isArray(obj.aliases) ? obj.aliases : [],
      created: obj.created || undefined,
      modified: obj.modified || undefined,
      revoked: Boolean(obj.revoked),
      deprecated: Boolean(obj.x_mitre_deprecated),
    };
  }

  static toNormalizedSoftware(obj: StixBaseObject): NormalizedMitreSoftware | null {
    const attackId = this.extractAttackId(obj);
    if (!attackId) {
      logger.warn(`Skipping software object (${obj.type}) with missing external_id: ${obj.id}`);
      return null;
    }

    const softwareType =
      obj.type === 'malware' ? 'MALWARE' : obj.type === 'tool' ? 'TOOL' : 'OTHER';

    const rawAliases = Array.isArray(obj.x_mitre_aliases)
      ? obj.x_mitre_aliases
      : Array.isArray(obj.aliases)
      ? obj.aliases
      : [];

    return {
      stixId: obj.id,
      attackId,
      name: obj.name || 'Unnamed Software',
      description: obj.description || undefined,
      softwareType,
      aliases: rawAliases,
      platforms: Array.isArray(obj.x_mitre_platforms) ? obj.x_mitre_platforms : undefined,
      created: obj.created || undefined,
      modified: obj.modified || undefined,
      revoked: Boolean(obj.revoked),
      deprecated: Boolean(obj.x_mitre_deprecated),
    };
  }

  static toNormalizedRelationship(obj: StixBaseObject): NormalizedMitreRelationship | null {
    if (!obj.relationship_type || !obj.source_ref || !obj.target_ref) {
      return null;
    }

    const sourceType = obj.source_ref.includes('--')
      ? obj.source_ref.split('--')[0]
      : undefined;
    const targetType = obj.target_ref.includes('--')
      ? obj.target_ref.split('--')[0]
      : undefined;

    return {
      stixRelationshipId: obj.id,
      relationshipType: obj.relationship_type,
      sourceStixId: obj.source_ref,
      targetStixId: obj.target_ref,
      sourceType,
      targetType,
      description: obj.description || undefined,
      created: obj.created || undefined,
      modified: obj.modified || undefined,
      revoked: Boolean(obj.revoked),
    };
  }
}
