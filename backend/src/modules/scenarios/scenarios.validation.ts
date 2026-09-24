// =============================================================================
// CyberRiskOS — What-If Simulation Zod Validation Schemas
// Phase: Phase 4 — What-If Simulation Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P4-01)
// =============================================================================

import { z } from 'zod';

export const scenarioActionSchema = z.object({
  actionType: z.enum([
    'PATCH_VULNERABILITY',
    'IMPLEMENT_CONTROL',
    'ISOLATE_ASSET',
    'DECOMMISSION_ASSET',
  ]),
  targetAssetId: z.string().min(1, 'Target asset ID is required'),
  targetCveId: z.string().optional(),
  controlCode: z.string().optional(),
  description: z.string().optional(),
});

export const scenarioSimulationRequestSchema = z.object({
  scenarioName: z.string().optional().default('Hypothetical Remediation Scenario'),
  actions: z.array(scenarioActionSchema).min(1, 'At least one remediation action is required'),
  assetId: z.string().optional(),
  baselineRiskInputs: z.array(z.any()).optional(),
  baselineFinancialInputs: z.array(z.any()).optional(),
});
