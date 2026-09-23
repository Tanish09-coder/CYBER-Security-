import { OrganizationRepository } from '../modules/organizations/organizations.repository';
import { AssetRepository } from '../modules/assets/assets.repository';
import { ControlsRepository } from '../modules/controls/controls.repository';
import { logger } from '../config/logger';

async function seed() {
  const orgRepo = new OrganizationRepository();
  const assetRepo = new AssetRepository();
  const controlsRepo = new ControlsRepository();

  logger.info('Starting enterprise context seed...');

  // 1. Create Organization 1
  const org1 = await orgRepo.createOrganization({
    name: 'CyberCorp Global',
    industry: 'Finance',
    employee_count: 5000,
    annual_revenue: 1000000000,
  });

  // 2. Create Organization 2
  const org2 = await orgRepo.createOrganization({
    name: 'Acme Retail',
    industry: 'Retail',
    employee_count: 1000,
    annual_revenue: 50000000,
  });

  // 3. Create Assets for Org 1
  const assetsOrg1 = [];
  assetsOrg1.push(await assetRepo.createAsset({
    organization_id: org1.id,
    name: 'Core Banking DB',
    asset_type: 'database',
    environment: 'Production',
    is_internet_facing: false,
    business_criticality: 5,
    data_classification: 'Restricted',
  }));
  assetsOrg1.push(await assetRepo.createAsset({
    organization_id: org1.id,
    name: 'Public Marketing Site',
    asset_type: 'web_server',
    environment: 'Production',
    is_internet_facing: true,
    business_criticality: 2,
    data_classification: 'Public',
  }));
  assetsOrg1.push(await assetRepo.createAsset({
    organization_id: org1.id,
    name: 'Employee Intranet',
    asset_type: 'application',
    environment: 'Internal',
    is_internet_facing: false,
    business_criticality: 3,
    data_classification: 'Internal',
  }));

  // 4. Create Assets for Org 2
  const assetsOrg2 = [];
  assetsOrg2.push(await assetRepo.createAsset({
    organization_id: org2.id,
    name: 'Retail POS Gateway',
    asset_type: 'server',
    environment: 'Production',
    is_internet_facing: true,
    business_criticality: 4,
    data_classification: 'Confidential',
  }));

  // 5. Assign Controls
  const controls = await controlsRepo.listCatalogControls();
  const mfa = controls.find(c => c.code === 'MFA');
  const edr = controls.find(c => c.code === 'EDR');
  const backup = controls.find(c => c.code === 'BACKUP');
  const encryption = controls.find(c => c.code === 'ENCRYPTION');

  if (mfa && edr && backup && encryption) {
    // Core Banking DB
    await controlsRepo.upsertAssetControl(assetsOrg1[0].id, mfa, { status: 'IMPLEMENTED', control_code: 'MFA' });
    await controlsRepo.upsertAssetControl(assetsOrg1[0].id, edr, { status: 'IMPLEMENTED', control_code: 'EDR' });
    await controlsRepo.upsertAssetControl(assetsOrg1[0].id, backup, { status: 'PARTIAL', control_code: 'BACKUP' });
    await controlsRepo.upsertAssetControl(assetsOrg1[0].id, encryption, { status: 'IMPLEMENTED', control_code: 'ENCRYPTION' });

    // Public Marketing Site
    await controlsRepo.upsertAssetControl(assetsOrg1[1].id, mfa, { status: 'NOT_IMPLEMENTED', control_code: 'MFA' });
    await controlsRepo.upsertAssetControl(assetsOrg1[1].id, edr, { status: 'UNKNOWN', control_code: 'EDR' });
    
    // Employee Intranet
    await controlsRepo.upsertAssetControl(assetsOrg1[2].id, mfa, { status: 'PARTIAL', control_code: 'MFA' });
    await controlsRepo.upsertAssetControl(assetsOrg1[2].id, edr, { status: 'IMPLEMENTED', control_code: 'EDR' });

    // Retail POS Gateway (Org 2)
    await controlsRepo.upsertAssetControl(assetsOrg2[0].id, mfa, { status: 'IMPLEMENTED', control_code: 'MFA' });
    await controlsRepo.upsertAssetControl(assetsOrg2[0].id, edr, { status: 'IMPLEMENTED', control_code: 'EDR' });
  }

  logger.info('Seed complete!');
  process.exit(0);
}

seed().catch(err => {
  logger.error(err);
  process.exit(1);
});
