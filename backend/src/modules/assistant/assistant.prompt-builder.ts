// =============================================================================
// CyberRiskOS — AI Explanation Assistant Prompt Builder
// Phase: Phase 8 — AI Explanation Assistant
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
//
// GROUNDING CONTRACT:
//   This module constructs prompts whose numeric values are locked exclusively
//   to the deterministic calculation outputs received from the upstream engines.
//   Prompts apply PromptSanitizer to strip PII and internal secrets prior to LLM dispatch.
// =============================================================================

import {
  ResolvedRiskContext,
  ResolvedFinancialContext,
  ResolvedStrategyComparisonContext,
  GroundingAnchor,
} from './assistant.types';
import { PromptSanitizer } from './assistant.sanitizer';

export interface BuiltPrompt {
  /** Grounded and sanitized prompt for sending to an external AI provider. */
  aiPrompt: string;
  /** Deterministic explanation generated directly from structured inputs (no AI required). */
  templateExplanation: string;
  /** Ground truth anchors for post-generation grounding validation. */
  groundingAnchors: GroundingAnchor[];
  /** Human-readable list of injected ground truth values for audit transparency. */
  groundingCitation: string;
}

const ASSISTANT_MODEL_VERSION = '1.0.0';

function fmtNum(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function fmtCurrency(n: number | null, currency: string | null): string {
  if (n === null) return 'NOT AVAILABLE';
  if (!currency) return `NOT_AVAILABLE`;
  return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// =============================================================================
// Grounded Prompt Builder: Explain Risk
// =============================================================================
export function buildRiskExplanationPrompt(req: ResolvedRiskContext): BuiltPrompt {
  const score = fmtNum(req.riskScore);
  const completeness = req.dataCompleteness != null ? fmtNum(req.dataCompleteness * 100, 1) + '%' : 'N/A';
  const warnings = req.missingDataWarnings?.join('; ') || 'None';

  let factorsBlock = '';
  if (req.factors && req.factors.length > 0) {
    factorsBlock = req.factors
      .map((f) => `    - ${f.factorName}: ${fmtNum(f.contribution)} — ${f.description}`)
      .join('\n');
  } else {
    factorsBlock = '    - Factor breakdown not provided';
  }

  const groundingAnchors: GroundingAnchor[] = [
    { field: 'riskScore', expectedValue: req.riskScore, tolerancePct: 1.0 },
  ];

  const groundingCitation = [
    `Risk Score: ${score} / 100.0`,
    `Severity: ${req.severity}`,
    `CVE: ${req.cveId}`,
    `Asset: ${req.assetName}`,
    `Model Version: v${req.modelVersion}`,
  ].join(' | ');

  const rawAiPrompt = `[CYBERRISKOS GROUNDED EXPLANATION CONTEXT — DO NOT MODIFY OR CONTRADICT]

Asset:         ${req.assetName} (ID: ${req.assetId})
Vulnerability: ${req.cveId}
Risk Score:    ${score} / 100.0 (BOUNDED IN [0.0, 100.0])
Severity:      ${req.severity} (CyberRiskOS Risk Model v${req.modelVersion} band)
Data Completeness: ${completeness}

Risk Factor Breakdown (from deterministic model):
${factorsBlock}

Missing Data Warnings: ${warnings}

[MANDATORY INSTRUCTIONS — VIOLATION OF THESE RULES WILL INVALIDATE YOUR RESPONSE]
1. You are a CyberRiskOS AI security advisor providing executive-ready explanations.
2. EXPLAIN why this asset/CVE combination has a risk score of ${score} (severity: ${req.severity}).
3. You MUST reference the risk score as exactly ${score} at least once.
4. You MUST NOT invent or substitute any numeric value not listed in the context above.
5. Do NOT claim breach probabilities, likelihood percentages, or financial losses.
6. Do NOT reference ATT&CK techniques, CVE descriptions, or threat intelligence beyond what is shown.
7. Do NOT suggest the risk score means a specific probability of breach.
8. Keep your response to 3–5 paragraphs. Use professional, executive-ready language.
[END OF GROUNDED CONTEXT]

Explain the CyberRiskOS risk assessment for ${req.cveId} on ${req.assetName}:`;

  const aiPrompt = PromptSanitizer.sanitize(rawAiPrompt);

  const templateLines: string[] = [
    `CyberRiskOS Risk Assessment: ${req.cveId} on ${req.assetName}`,
    `${'─'.repeat(70)}`,
    '',
    `Risk Score:   ${score} / 100.0`,
    `Severity:     ${req.severity}`,
    `Model:        CyberRiskOS Risk Model v${req.modelVersion}`,
    `Asset ID:     ${req.assetId}`,
    `Data Completeness: ${completeness}`,
    '',
    'Risk Factor Breakdown:',
  ];

  if (req.factors && req.factors.length > 0) {
    req.factors.forEach((f) => {
      templateLines.push(`  • ${f.factorName}: ${fmtNum(f.contribution)} — ${f.description}`);
    });
  }

  templateLines.push('');
  templateLines.push(
    `Assessment: ${req.assetName} has a modeled risk score of ${score} / 100.0 for vulnerability ` +
      `${req.cveId}. This score was computed deterministically by CyberRiskOS Risk Model ` +
      `v${req.modelVersion} using verified CVSS technical severity and asset consequence scaling. ` +
      `The score is bounded in [0.0, 100.0] and does not represent a probability of breach.`
  );

  if (warnings !== 'None') {
    templateLines.push('');
    templateLines.push(`Data Completeness Warnings: ${warnings}`);
  }

  templateLines.push('');
  templateLines.push(
    `[CYBERRISKOS MODEL DISCLAIMER] This risk score is a deterministic model output ` +
      `(CyberRiskOS Risk Model v${req.modelVersion}). It does not constitute a guarantee ` +
      `of security posture or a prediction of breach. All factor coefficients and policy ` +
      `scalars are documented in docs/RISK_ENGINE_CONTRACT.md.`
  );

  return {
    aiPrompt,
    templateExplanation: templateLines.join('\n'),
    groundingAnchors,
    groundingCitation,
  };
}

// =============================================================================
// Grounded Prompt Builder: Explain Financial Exposure
// =============================================================================
export function buildFinancialExplanationPrompt(req: ResolvedFinancialContext): BuiltPrompt {
  const sleFmt = req.sle != null ? fmtNum(req.sle) : 'NOT AVAILABLE';
  const alefFmt = req.alef != null ? fmtNum(req.alef, 4) : 'NOT AVAILABLE';
  const ealFmt = req.eal != null ? fmtNum(req.eal) : 'NOT AVAILABLE';
  const ealAvailable = req.ealStatus === 'CALCULATED' && req.eal != null;
  const primaryFmt = req.primaryLoss != null ? fmtCurrency(req.primaryLoss, req.currency) : 'N/A';
  const secondaryFmt = req.secondaryLoss != null ? fmtCurrency(req.secondaryLoss, req.currency) : 'N/A';
  const completeness = req.dataCompleteness != null ? fmtNum(req.dataCompleteness * 100, 1) + '%' : 'N/A';

  const groundingAnchors: GroundingAnchor[] = [];
  if (req.sle != null) {
    groundingAnchors.push({ field: 'sle', expectedValue: req.sle, tolerancePct: 1.0 });
  }
  if (req.alef != null) {
    groundingAnchors.push({ field: 'alef', expectedValue: req.alef, tolerancePct: 5.0 });
  }
  if (req.eal != null) {
    groundingAnchors.push({ field: 'eal', expectedValue: req.eal, tolerancePct: 1.0 });
  }

  const groundingCitation = [
    `Asset: ${req.assetName}`,
    `SLE: ${sleFmt} ${req.currency}`,
    `ALEF: ${alefFmt} events/year`,
    `EAL: ${ealFmt} ${req.currency}`,
    `EAL Status: ${req.ealStatus}`,
    `Model: v${req.modelVersion}`,
  ].join(' | ');

  const rawAiPrompt = `[CYBERRISKOS GROUNDED FINANCIAL CONTEXT — DO NOT MODIFY OR CONTRADICT]

Asset:  ${req.assetName} (ID: ${req.assetId})
${req.cveId ? `CVE:    ${req.cveId}` : ''}
Model:  CyberRiskOS Financial Model v${req.modelVersion}

FINANCIAL EXPOSURE RESULTS (deterministic model outputs):
  Single Loss Expectancy (SLE):         ${sleFmt} ${req.currency}
    Primary Loss (Downtime / Breach):   ${primaryFmt}
    Secondary Loss (Recovery):          ${secondaryFmt}
  Annual Loss Event Frequency (ALEF):   ${alefFmt} events/year  [USER-PROVIDED INPUT]
  Estimated Annualized Loss (EAL):      ${ealAvailable ? `${ealFmt} ${req.currency}` : 'NOT AVAILABLE'}
  EAL Status: ${req.ealStatus}

${!ealAvailable ? `EAL IS NOT AVAILABLE because ALEF (annual loss event frequency) was not provided by the operator.\nTo enable EAL calculation, the ALEF must be specified as a user-provided annualized incident frequency.\nDo NOT fabricate or estimate an EAL value.` : ''}

Data Completeness: ${completeness}

[MANDATORY INSTRUCTIONS]
1. Explain the financial exposure for ${req.assetName} using ONLY the values above.
2. ${ealAvailable ? `Reference the EAL as exactly ${ealFmt} ${req.currency}.` : 'Explain clearly that EAL is NOT AVAILABLE due to missing ALEF. Do NOT invent an EAL figure.'}
3. Reference the SLE as ${sleFmt} ${req.currency} if provided.
4. Do NOT derive or claim breach/loss probabilities from CVSS, risk scores, or KEV membership.
5. Do NOT claim guaranteed losses — these are MODELED / ESTIMATED figures.
6. Label all figures as "modeled" or "estimated", never as "actual" or "guaranteed."
7. Keep response to 3–5 paragraphs, professional and executive-ready.
[END OF GROUNDED FINANCIAL CONTEXT]

Explain the CyberRiskOS financial exposure assessment for ${req.assetName}:`;

  const aiPrompt = PromptSanitizer.sanitize(rawAiPrompt);

  const templateLines: string[] = [
    `CyberRiskOS Financial Exposure Analysis: ${req.assetName}`,
    `${'─'.repeat(70)}`,
    `Model: CyberRiskOS Financial Model v${req.modelVersion} — MODELED / ESTIMATED`,
    `       (Not a guarantee of actual loss. For risk management purposes only.)`,
    '',
    `Asset ID: ${req.assetId}`,
    req.cveId ? `CVE:     ${req.cveId}` : '',
    `Currency: ${req.currency}`,
    `Data Completeness: ${completeness}`,
    '',
    `Single Loss Expectancy (SLE): ${sleFmt} ${req.currency}`,
    `  • Primary Loss (Downtime / Breach Impact):  ${primaryFmt}`,
    `  • Secondary Loss (Recovery / Response Cost): ${secondaryFmt}`,
    '',
    `Annual Loss Event Frequency (ALEF): ${alefFmt} events/year`,
    `  Source: User-provided operator input (not derived from CVSS or risk scores).`,
    '',
  ];

  if (ealAvailable) {
    templateLines.push(`Estimated Annualized Loss (EAL = ALEF × SLE): ${ealFmt} ${req.currency}`);
    templateLines.push(
      `  Interpretation: On a modeled annualized basis, this asset/vulnerability combination ` +
        `represents ${ealFmt} ${req.currency} of estimated loss exposure under the provided ` +
        `frequency assumption of ${alefFmt} events/year.`
    );
  } else {
    templateLines.push(`Estimated Annualized Loss (EAL): NOT AVAILABLE`);
    templateLines.push(
      `  Reason: The Annual Loss Event Frequency (ALEF) was not provided by the operator. ` +
        `EAL requires a user-specified annualized frequency (events/year). ` +
        `Without ALEF, CyberRiskOS will not fabricate or estimate EAL. ` +
        `The Single Loss Expectancy (SLE) of ${sleFmt} ${req.currency} remains valid ` +
        `and represents the modeled magnitude of a single loss event.`
    );
  }

  templateLines.push('');
  templateLines.push(
    `[CYBERRISKOS FINANCIAL MODEL DISCLAIMER] All figures are MODELED / ESTIMATED ` +
      `outputs of CyberRiskOS Financial Model v${req.modelVersion}. They are not ` +
      `guaranteed or actual losses. The ALEF is operator-provided and not derived ` +
      `from CVSS, risk scores, or KEV membership. See docs/FINANCIAL_MODEL.md.`
  );

  return {
    aiPrompt,
    templateExplanation: templateLines.filter((l) => l !== '').join('\n').replace(/\n{3,}/g, '\n\n'),
    groundingAnchors,
    groundingCitation,
  };
}

// =============================================================================
// Grounded Prompt Builder: Compare Strategies
// =============================================================================
export function buildStrategyComparisonPrompt(req: ResolvedStrategyComparisonContext): BuiltPrompt {
  const { strategyA: a, strategyB: b } = req;

  const costDelta = Math.abs(a.totalCost - b.totalCost);
  const aEalRed = a.totalEalReduction ?? 0.0;
  const bEalRed = b.totalEalReduction ?? 0.0;
  const ealDelta = Math.abs(aEalRed - bEalRed);
  const higherCostStrategy = a.totalCost >= b.totalCost ? a.strategyName : b.strategyName;
  const higherEalStrategy = aEalRed >= bEalRed ? a.strategyName : b.strategyName;

  const groundingAnchors: GroundingAnchor[] = [
    { field: 'strategyA.totalCost', expectedValue: a.totalCost, tolerancePct: 1.0 },
    { field: 'strategyB.totalCost', expectedValue: b.totalCost, tolerancePct: 1.0 },
    { field: 'budgetLimit', expectedValue: req.budgetLimit, tolerancePct: 1.0 },
  ];

  if (a.totalEalReduction != null) {
    groundingAnchors.push({ field: 'strategyA.totalEalReduction', expectedValue: a.totalEalReduction, tolerancePct: 1.0 });
  }
  if (b.totalEalReduction != null) {
    groundingAnchors.push({ field: 'strategyB.totalEalReduction', expectedValue: b.totalEalReduction, tolerancePct: 1.0 });
  }

  if (a.rosiPct != null) {
    groundingAnchors.push({ field: 'strategyA.rosiPct', expectedValue: a.rosiPct, tolerancePct: 2.0 });
  }
  if (b.rosiPct != null) {
    groundingAnchors.push({ field: 'strategyB.rosiPct', expectedValue: b.rosiPct, tolerancePct: 2.0 });
  }

  const groundingCitation = [
    `Budget: ${fmtNum(req.budgetLimit)} ${req.currency}`,
    `A.Cost: ${fmtNum(a.totalCost)} | A.EAL: ${a.totalEalReduction != null ? fmtNum(a.totalEalReduction) : 'N/A'} | A.ROSI: ${a.rosiPct != null ? fmtNum(a.rosiPct) + '%' : 'N/A'}`,
    `B.Cost: ${fmtNum(b.totalCost)} | B.EAL: ${b.totalEalReduction != null ? fmtNum(b.totalEalReduction) : 'N/A'} | B.ROSI: ${b.rosiPct != null ? fmtNum(b.rosiPct) + '%' : 'N/A'}`,
  ].join(' | ');

  const rawAiPrompt = `[CYBERRISKOS STRATEGY COMPARISON — GROUNDED CONTEXT — DO NOT MODIFY OR CONTRADICT]

Budget Ceiling:  ${fmtNum(req.budgetLimit)} ${req.currency}

STRATEGY A: ${a.strategyName} (ID: ${a.strategyId})
  Description:          ${a.description}
  Total Investment:     ${fmtNum(a.totalCost)} ${req.currency}
  Modeled Risk Reduction: ${fmtNum(a.totalRiskReduction)} (continuous score reduction, not a probability)
  Modeled EAL Reduction:  ${a.totalEalReduction != null ? `${fmtNum(a.totalEalReduction)} ${req.currency}` : 'NOT AVAILABLE'}
  ROSI:                 ${a.rosiPct != null ? fmtNum(a.rosiPct) + '%' : 'NOT AVAILABLE (EAL inputs missing)'}
  Actions Selected:     ${a.actionCount}

STRATEGY B: ${b.strategyName} (ID: ${b.strategyId})
  Description:          ${b.description}
  Total Investment:     ${fmtNum(b.totalCost)} ${req.currency}
  Modeled Risk Reduction: ${fmtNum(b.totalRiskReduction)} (continuous score reduction, not a probability)
  Modeled EAL Reduction:  ${b.totalEalReduction != null ? `${fmtNum(b.totalEalReduction)} ${req.currency}` : 'NOT AVAILABLE'}
  ROSI:                 ${b.rosiPct != null ? fmtNum(b.rosiPct) + '%' : 'NOT AVAILABLE (EAL inputs missing)'}
  Actions Selected:     ${b.actionCount}

TRADE-OFF SUMMARY:
  Investment Difference:   ${fmtNum(costDelta)} ${req.currency} (${higherCostStrategy} costs more)
  EAL Reduction Difference: ${fmtNum(ealDelta)} ${req.currency} (${higherEalStrategy} reduces more)

[MANDATORY INSTRUCTIONS — CRITICAL ANTI-HALLUCINATION RULES]
1. DO NOT recommend a single "winner" or "best" strategy. CyberRiskOS does not pick winners.
2. Present trade-offs objectively. Security leadership makes the final selection.
3. Reference Strategy A cost as exactly ${fmtNum(a.totalCost)} and Strategy B cost as exactly ${fmtNum(b.totalCost)}.
4. Reference EAL reductions as ${a.totalEalReduction != null ? fmtNum(a.totalEalReduction) : 'NOT AVAILABLE'} (A) and ${b.totalEalReduction != null ? fmtNum(b.totalEalReduction) : 'NOT AVAILABLE'} (B).
5. Label risk reductions as "modeled" — do NOT claim breach probability improvements.
6. If ROSI is NOT AVAILABLE, explain this is due to missing EAL inputs (not model failure).
7. Keep response to 3–5 paragraphs. Use executive decision-support language.
[END OF GROUNDED CONTEXT]

Compare Strategy A (${a.strategyName}) vs Strategy B (${b.strategyName}) for security leadership:`;

  const aiPrompt = PromptSanitizer.sanitize(rawAiPrompt);

  const templateLines: string[] = [
    `CyberRiskOS Investment Strategy Trade-Off Analysis`,
    `${'─'.repeat(70)}`,
    `Budget Ceiling: ${fmtCurrency(req.budgetLimit, req.currency)}`,
    '',
    `STRATEGY A: ${a.strategyName}`,
    `  Investment:         ${fmtCurrency(a.totalCost, req.currency)}`,
    `  Modeled Risk Δ:     ${fmtNum(a.totalRiskReduction)} (continuous score units)`,
    `  Modeled EAL Δ:      ${fmtCurrency(a.totalEalReduction, req.currency)}`,
    `  ROSI:               ${a.rosiPct != null ? fmtNum(a.rosiPct) + '%' : 'NOT AVAILABLE'}`,
    `  Actions Selected:   ${a.actionCount}`,
    `  Description:        ${a.description}`,
    '',
    `STRATEGY B: ${b.strategyName}`,
    `  Investment:         ${fmtCurrency(b.totalCost, req.currency)}`,
    `  Modeled Risk Δ:     ${fmtNum(b.totalRiskReduction)} (continuous score units)`,
    `  Modeled EAL Δ:      ${fmtCurrency(b.totalEalReduction, req.currency)}`,
    `  ROSI:               ${b.rosiPct != null ? fmtNum(b.rosiPct) + '%' : 'NOT AVAILABLE'}`,
    `  Actions Selected:   ${b.actionCount}`,
    `  Description:        ${b.description}`,
    '',
    `Trade-Off Analysis:`,
    `  ${higherCostStrategy} requires ${fmtCurrency(costDelta, req.currency)} more investment.`,
    `  ${higherEalStrategy} delivers ${fmtCurrency(ealDelta, req.currency)} greater modeled EAL reduction.`,
    '',
    `Decision Guidance:`,
    `  CyberRiskOS presents both strategies as feasible candidates within the budget ceiling ` +
      `of ${fmtCurrency(req.budgetLimit, req.currency)}. Security leadership must select ` +
      `the strategy aligned with organizational risk appetite, capital efficiency targets, ` +
      `and remediation velocity requirements. CyberRiskOS does not recommend a single winner.`,
    '',
    `[CYBERRISKOS OPTIMIZER DISCLAIMER] All cost, risk reduction, and EAL figures are ` +
      `deterministic outputs of CyberRiskOS Investment Optimizer v${ASSISTANT_MODEL_VERSION}. ` +
      `Risk reductions are continuous model score reductions, not probabilities of breach. ` +
      `EAL figures depend on user-provided ALEF. See docs/OPTIMIZATION.md.`,
  ];

  return {
    aiPrompt,
    templateExplanation: templateLines.join('\n'),
    groundingAnchors,
    groundingCitation,
  };
}
