import { CisaKevItem, NormalizedCisaKevEntry } from './cisa-kev.types';

export class CisaKevMapper {
  static toNormalizedEntry(item: CisaKevItem): NormalizedCisaKevEntry {
    const cveId = item.cveID.trim().toUpperCase();

    return {
      cveId,
      vendorProject: item.vendorProject?.trim() || undefined,
      product: item.product?.trim() || undefined,
      vulnerabilityName: item.vulnerabilityName?.trim() || undefined,
      dateAdded: item.dateAdded?.trim() || undefined,
      shortDescription: item.shortDescription?.trim() || undefined,
      requiredAction: item.requiredAction?.trim() || undefined,
      dueDate: item.dueDate?.trim() || undefined,
      knownRansomwareCampaignUse: item.knownRansomwareCampaignUse?.trim() || undefined,
      notes: item.notes?.trim() || undefined,
      sourceRecordId: cveId,
    };
  }
}
