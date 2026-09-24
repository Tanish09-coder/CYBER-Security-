// =============================================================================
// CyberRiskOS — AI Explanation Assistant Service
// Phase: Phase 8 — AI Explanation Assistant
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
//
// ARCHITECTURE & MANDATORY GROUNDING DIRECTIVES:
//   1. Authoritative Backend Resolution: Does NOT accept client-supplied score/EAL/ROSI figures.
//      Resolves ground truth from persistent repositories (`risk_results`, `financial_results`, solver engine).
//   2. Prompt Builder constructs prompt with PromptSanitizer to strip PII & secrets.
//   3. Deterministic Dual-Layer Grounding:
//      - Layer 1: Structured Claims Validation (`sourceField` / `claimedValue`).
//      - Layer 2: Defense-in-depth numeric anchor checking.
//   4. Fallback Guarantee: If AI provider is unavailable, errors out, or fails grounding,
//      returns grounded TEMPLATE_GENERATED / GROUNDING_FAILED / PROVIDER_ERROR with safe template.
// =============================================================================

import axios, { AxiosError } from 'axios';
import { logger } from '../../config/logger';
import { riskRepository } from '../risk/risk.repository';
import { financialRepository } from '../financial/financial.repository';
import { OptimizationService, optimizationService } from '../optimization/optimization.service';
import { OptimizationResultDTO } from '../optimization/optimization.types';
import {
  RiskExplanationRequestDTO,
  FinancialExplanationRequestDTO,
  StrategyComparisonRequestDTO,
  ResolvedRiskContext,
  ResolvedFinancialContext,
  ResolvedStrategyComparisonContext,
  StrategyItemDTO,
  AIExplanationResponseDTO,
  GroundingAnchor,
  GroundingValidationDTO,
  StructuredClaimDTO,
  ExplanationStatus,
  FactorContributionDTO,
} from './assistant.types';
import {
  buildRiskExplanationPrompt,
  buildFinancialExplanationPrompt,
  buildStrategyComparisonPrompt,
  BuiltPrompt,
} from './assistant.prompt-builder';

export const ASSISTANT_MODEL_VERSION = '1.0.0';

export class AssistantServiceError extends Error {
  constructor(message: string, public readonly statusCode: number = 400) {
    super(message);
    this.name = 'AssistantServiceError';
  }
}

// ---------------------------------------------------------------------------
// Grounding & Structured Claim Validator
// ---------------------------------------------------------------------------

function extractNumbersFromText(text: string): number[] {
  let normalized = text;
  while (/\d,\d{3}/.test(normalized)) {
    normalized = normalized.replace(/(\d),(\d{3}(?!\d))/g, '$1$2');
  }
  const matches = normalized.match(/\b\d+(?:\.\d+)?\b/g) ?? [];
  return matches.map((m) => parseFloat(m));
}

export function validateGrounding(
  responseText: string,
  anchors: GroundingAnchor[],
  structuredClaims?: StructuredClaimDTO[]
): GroundingValidationDTO {
  const numbersInResponse = extractNumbersFromText(responseText);
  const violations: GroundingValidationDTO['violations'] = [];
  let verifiedCount = 0;

  // 1. Numeric Anchor Defense-in-Depth Checking
  for (const anchor of anchors) {
    const absExpected = Math.abs(anchor.expectedValue);
    const tolerance = anchor.tolerancePct ?? 5.0;

    if (absExpected < 0.001) {
      verifiedCount++;
      continue;
    }

    const found = numbersInResponse.some((n) => {
      const relDiff = Math.abs(n - anchor.expectedValue) / absExpected;
      return relDiff <= tolerance / 100.0;
    });

    if (found) {
      verifiedCount++;
    } else {
      violations.push({
        field: anchor.field,
        expectedValue: anchor.expectedValue,
        tolerancePct: tolerance,
        note: `Expected value ${anchor.expectedValue} (±${tolerance}%) not found in response text.`,
      });
    }
  }

  // 2. Structured Claims Validation
  const verifiedClaims: StructuredClaimDTO[] = [];
  if (structuredClaims) {
    for (const claim of structuredClaims) {
      let isVerified = false;
      if (typeof claim.expectedValue === 'number') {
        const expVal = claim.expectedValue;
        // Exact canonical precision for structured deterministic claims (tolerance <= 0.001)
        isVerified = numbersInResponse.some((n) => Math.abs(n - expVal) <= 0.001);
      } else if (typeof claim.expectedValue === 'string') {
        isVerified = responseText.toLowerCase().includes(claim.expectedValue.toLowerCase());
      } else {
        isVerified = true;
      }
      verifiedClaims.push({ ...claim, isVerified });
    }
  }

  const passed = violations.length === 0 && verifiedClaims.every((c) => c.isVerified);

  return {
    passed,
    anchorCount: anchors.length,
    verifiedCount,
    violations,
    structuredClaims: verifiedClaims,
    validationNote: passed
      ? 'All ground truth anchors and structured claims verified in explanation.'
      : `${violations.length} anchor violation(s) detected. Grounding check failed.`,
  };
}

// ---------------------------------------------------------------------------
// External AI Provider HTTP Client (OpenAI)
// ---------------------------------------------------------------------------

async function callOpenAI(
  prompt: string,
  apiKey: string,
  model: string,
  timeoutMs: number
): Promise<{ text: string; provider: string }> {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a CyberRiskOS AI security advisor. You MUST cite ONLY the numeric values ' +
            'provided in the grounded context. Do NOT invent risk scores, financial figures, ' +
            'or breach probabilities. Non-compliance invalidates your response.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: timeoutMs,
    }
  );

  const text: string = response.data?.choices?.[0]?.message?.content ?? '';
  return { text, provider: `openai/${model}` };
}

// ---------------------------------------------------------------------------
// Main Assistant Service Class
// ---------------------------------------------------------------------------

export class AssistantService {
  private readonly aiProvider: string;
  private readonly openAiApiKey: string | undefined;
  private readonly openAiModel: string;
  private readonly aiTimeoutMs: number;

  constructor() {
    this.aiProvider = process.env.AI_EXPLANATION_PROVIDER ?? 'TEMPLATE';
    this.openAiApiKey =
      process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== ''
        ? process.env.OPENAI_API_KEY.trim()
        : undefined;
    this.openAiModel = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    this.aiTimeoutMs = parseInt(process.env.AI_EXPLANATION_TIMEOUT_MS ?? '15000', 10);
  }

  // -------------------------------------------------------------------------
  // Authoritative Context Resolvers
  // -------------------------------------------------------------------------

  async resolveRiskContext(req: RiskExplanationRequestDTO): Promise<ResolvedRiskContext> {
    let record: any = null;
    if (req.riskResultId) {
      record = await riskRepository.findById(req.riskResultId);
    } else if (req.assetId && req.cveId) {
      record = await riskRepository.findByAssetAndCve(req.assetId, req.cveId);
    }

    if (!record) {
      throw new AssistantServiceError(
        `Authoritative risk result record not found for query parameters. Evaluated risk score must be persisted first.`,
        404
      );
    }

    const mappedFactors: FactorContributionDTO[] = (record.factors || []).map((f: any) => ({
      factorName: f.factorName || f.factor_name || f.factor || 'Factor',
      contribution: typeof f.contribution === 'number' ? f.contribution : parseFloat(String(f.contribution || '0')),
      description: f.description || '',
    }));

    const assetId = record.asset_id || record.assetId || 'unknown-asset';
    const cveId = record.cve_id || record.cveId || 'unknown-cve';
    const scoreVal = record.score !== undefined ? record.score : record.risk_score !== undefined ? record.risk_score : record.riskScore;
    const levelVal = record.level || record.severity || 'MEDIUM';

    return {
      riskResultId: record.id,
      assetId,
      assetName: req.assetName || `Asset ${assetId.substring(0, 8)}`,
      cveId,
      riskScore: parseFloat(String(scoreVal ?? 0)),
      severity: levelVal as any,
      factors: mappedFactors,
      dataCompleteness: (record.data_completeness != null ? record.data_completeness : record.dataCompleteness) != null ? parseFloat(String(record.data_completeness ?? record.dataCompleteness)) : 1.0,
      missingDataWarnings: record.missing_data_warnings || record.missingDataWarnings || [],
      modelVersion: record.model_version || record.modelVersion || '1.0.0',
      evaluatedAt: (record.evaluated_at || record.evaluatedAt) ? new Date(record.evaluated_at || record.evaluatedAt).toISOString() : new Date().toISOString(),
    };
  }

  async resolveFinancialContext(req: FinancialExplanationRequestDTO): Promise<ResolvedFinancialContext> {
    let record: any = null;
    if (req.financialResultId) {
      record = await financialRepository.findById(req.financialResultId);
    } else if (req.assetId && req.cveId) {
      record = await financialRepository.findByAssetAndCve(req.assetId, req.cveId);
    }

    if (!record) {
      throw new AssistantServiceError(
        `Authoritative financial result record not found for query parameters. Evaluated exposure must be persisted first.`,
        404
      );
    }

    const rawEalStatus = record.eal_status || record.ealStatus;
    const ealStatus: 'CALCULATED' | 'NOT_AVAILABLE' =
      rawEalStatus === 'CALCULATED' || rawEalStatus === 'AVAILABLE'
        ? 'CALCULATED'
        : 'NOT_AVAILABLE';

    const assetId = record.asset_id || record.assetId || 'unknown-asset';
    const cveId = record.cve_id || record.cveId || 'unknown-cve';

    const getNum = (v1: any, v2: any) => {
      const val = v1 !== null && v1 !== undefined ? v1 : v2;
      return val !== null && val !== undefined ? parseFloat(String(val)) : null;
    };

    return {
      financialResultId: record.id,
      assetId,
      assetName: `Asset ${assetId.substring(0, 8)}`,
      cveId,
      sle: getNum(record.sle, null),
      alef: getNum(record.alef, null),
      eal: getNum(record.eal, null),
      ealStatus,
      currency: record.currency ?? null, // null = org currency unavailable at financial evaluation time
      primaryLoss: getNum(record.primary_loss, record.primaryLoss),
      secondaryLoss: getNum(record.secondary_loss, record.secondaryLoss),
      estimatedOutageHours: getNum(record.estimated_outage_hours, record.estimatedOutageHours),
      dataCompleteness: (record.data_completeness != null ? record.data_completeness : record.dataCompleteness) != null ? parseFloat(String(record.data_completeness ?? record.dataCompleteness)) : 1.0,
      modelVersion: record.model_version || record.modelVersion || '1.0.0',
    };
  }

  async resolveStrategyComparisonContext(
    req: StrategyComparisonRequestDTO
  ): Promise<ResolvedStrategyComparisonContext> {
    let optResult: OptimizationResultDTO | null = null;

    // 1. Try resolving by explicit optimizationResultId
    if (req.optimizationResultId) {
      optResult = OptimizationService.getResult(req.optimizationResultId);
    }

    // 2. Fallback: if caller passed candidateActions and budgetLimit, run optimization
    if (!optResult && req.candidateActions && req.candidateActions.length > 0 && req.budgetLimit !== undefined) {
      optResult = await optimizationService.solve({
        budgetLimit: req.budgetLimit,
        currency: req.currency ?? null, // null = caller did not supply authoritative currency
        candidateActions: req.candidateActions,
      });
    }

    // 3. Fallback: check latest cached optimization run
    if (!optResult) {
      const latest = OptimizationService.getLatestResult();
      if (latest) {
        optResult = latest.result;
      }
    }

    if (!optResult || !optResult.strategies || optResult.strategies.length < 2) {
      throw new AssistantServiceError(
        `Authoritative optimization results not found for strategy comparison. ` +
        `Client must execute an optimization solve or provide a valid optimizationResultId.`,
        404
      );
    }

    const budgetLimit = optResult.budgetLimit;
    const currency = optResult.currency;

    // Select strategies by IDs or pick the first two available strategies
    const stratAData = req.strategyIds?.[0]
      ? optResult.strategies.find((s) => s.strategyId === req.strategyIds![0]) || optResult.strategies[0]
      : optResult.strategies[0];

    const stratBData = req.strategyIds?.[1]
      ? optResult.strategies.find((s) => s.strategyId === req.strategyIds![1]) || optResult.strategies[1]
      : optResult.strategies[1];

    const mapToItem = (s: any): StrategyItemDTO => ({
      strategyId: s.strategyId,
      strategyName: s.strategyName,
      totalCost: s.totalCost,
      totalRiskReduction: s.totalRiskReduction,
      totalEalReduction: s.totalEalReduction,
      ealStatus: s.totalEalReduction !== null && s.totalEalReduction !== undefined ? 'CALCULATED' : 'NOT_AVAILABLE',
      rosiPct: s.rosiPct !== undefined ? s.rosiPct : null,
      actionCount: s.actionCount || (s.selectedActions ? s.selectedActions.length : 0),
      description: s.description || '',
    });

    return {
      optimizationResultId: optResult.optimizationResultId || req.optimizationResultId || 'opt-res-authoritative',
      strategyA: mapToItem(stratAData),
      strategyB: mapToItem(stratBData),
      budgetLimit,
      currency,
    };
  }

  // -------------------------------------------------------------------------
  // Main Public Endpoints
  // -------------------------------------------------------------------------

  async explainRisk(req: RiskExplanationRequestDTO): Promise<AIExplanationResponseDTO> {
    const context = await this.resolveRiskContext(req);
    const built = buildRiskExplanationPrompt(context);
    const claims: StructuredClaimDTO[] = [
      { sourceField: 'riskScore', claimedValue: context.riskScore, isVerified: false, expectedValue: context.riskScore },
    ];
    return this.orchestrate(built, 'EXPLAIN_RISK', claims);
  }

  async explainFinancial(req: FinancialExplanationRequestDTO): Promise<AIExplanationResponseDTO> {
    const context = await this.resolveFinancialContext(req);
    const built = buildFinancialExplanationPrompt(context);
    const claims: StructuredClaimDTO[] = [];
    if (context.sle != null) {
      claims.push({ sourceField: 'sle', claimedValue: context.sle, isVerified: false, expectedValue: context.sle });
    }
    if (context.eal != null) {
      claims.push({ sourceField: 'eal', claimedValue: context.eal, isVerified: false, expectedValue: context.eal });
    }
    return this.orchestrate(built, 'EXPLAIN_FINANCIAL', claims);
  }

  async compareStrategies(req: StrategyComparisonRequestDTO): Promise<AIExplanationResponseDTO> {
    const context = await this.resolveStrategyComparisonContext(req);
    const built = buildStrategyComparisonPrompt(context);
    const claims: StructuredClaimDTO[] = [
      { sourceField: 'strategyA.totalCost', claimedValue: context.strategyA.totalCost, isVerified: false, expectedValue: context.strategyA.totalCost },
      { sourceField: 'strategyB.totalCost', claimedValue: context.strategyB.totalCost, isVerified: false, expectedValue: context.strategyB.totalCost },
    ];
    return this.orchestrate(built, 'COMPARE_STRATEGIES', claims);
  }

  // -------------------------------------------------------------------------
  // Orchestration Pipeline
  // -------------------------------------------------------------------------

  private async orchestrate(
    built: BuiltPrompt,
    requestType: AIExplanationResponseDTO['requestType'],
    structuredClaims?: StructuredClaimDTO[]
  ): Promise<AIExplanationResponseDTO> {
    const generatedAt = new Date().toISOString();
    const warnings: string[] = [];

    const useOpenAI = this.aiProvider === 'OPENAI' && this.openAiApiKey !== undefined;

    if (!useOpenAI) {
      const status: ExplanationStatus =
        this.aiProvider === 'OPENAI' && !this.openAiApiKey
          ? 'AI_UNAVAILABLE'
          : 'TEMPLATE_GENERATED';

      if (status === 'AI_UNAVAILABLE') {
        warnings.push('AI_EXPLANATION_PROVIDER is set to OPENAI but OPENAI_API_KEY is not configured. Returning template explanation.');
      }

      const grounding = validateGrounding(built.templateExplanation, built.groundingAnchors, structuredClaims);

      return {
        requestType,
        explanationStatus: status,
        explanation: built.templateExplanation,
        groundingValidation: grounding,
        promptGroundingCitation: built.groundingCitation,
        aiProvider: 'TEMPLATE',
        modelVersion: ASSISTANT_MODEL_VERSION,
        generatedAt,
        warnings,
        integrationStatus: 'PHASE 8 LOCAL IMPLEMENTATION VERIFIED / FINAL CROSS-MODULE INTEGRATION PENDING',
      };
    }

    try {
      logger.info('[AssistantService] Calling OpenAI with prompt-sanitized context', {
        requestType,
        model: this.openAiModel,
      });

      const aiResult = await callOpenAI(
        built.aiPrompt,
        this.openAiApiKey!,
        this.openAiModel,
        this.aiTimeoutMs
      );

      if (!aiResult.text || aiResult.text.trim().length === 0) {
        warnings.push('AI provider returned an empty response. Falling back to template explanation.');
        return this.templateFallback(built, requestType, 'PROVIDER_ERROR', generatedAt, warnings, aiResult.provider, structuredClaims);
      }

      const grounding = validateGrounding(aiResult.text, built.groundingAnchors, structuredClaims);

      if (!grounding.passed) {
        warnings.push('AI response grounding validation FAILED. Returning safe template explanation.');
        return {
          requestType,
          explanationStatus: 'GROUNDING_FAILED',
          explanation: built.templateExplanation,
          groundingValidation: grounding,
          promptGroundingCitation: built.groundingCitation,
          aiProvider: aiResult.provider,
          modelVersion: ASSISTANT_MODEL_VERSION,
          generatedAt,
          warnings,
          integrationStatus: 'PHASE 8 LOCAL IMPLEMENTATION VERIFIED / FINAL CROSS-MODULE INTEGRATION PENDING',
        };
      }

      return {
        requestType,
        explanationStatus: 'AI_GENERATED',
        explanation: aiResult.text,
        groundingValidation: grounding,
        promptGroundingCitation: built.groundingCitation,
        aiProvider: aiResult.provider,
        modelVersion: ASSISTANT_MODEL_VERSION,
        generatedAt,
        warnings,
        integrationStatus: 'PHASE 8 LOCAL IMPLEMENTATION VERIFIED / FINAL CROSS-MODULE INTEGRATION PENDING',
      };
    } catch (err: unknown) {
      const axErr = err as AxiosError;
      const isTimeout = axErr.code === 'ECONNABORTED' || (axErr.message ?? '').includes('timeout');
      const errorMsg = isTimeout
        ? `AI provider timed out after ${this.aiTimeoutMs}ms.`
        : `AI provider error: ${axErr.message ?? 'Unknown error'}`;

      warnings.push(`${errorMsg} Returning deterministic template explanation.`);
      return this.templateFallback(built, requestType, 'PROVIDER_ERROR', generatedAt, warnings, this.openAiModel, structuredClaims);
    }
  }

  private templateFallback(
    built: BuiltPrompt,
    requestType: AIExplanationResponseDTO['requestType'],
    status: ExplanationStatus,
    generatedAt: string,
    warnings: string[],
    aiProvider: string,
    structuredClaims?: StructuredClaimDTO[]
  ): AIExplanationResponseDTO {
    const grounding = validateGrounding(built.templateExplanation, built.groundingAnchors, structuredClaims);
    return {
      requestType,
      explanationStatus: status,
      explanation: built.templateExplanation,
      groundingValidation: grounding,
      promptGroundingCitation: built.groundingCitation,
      aiProvider,
      modelVersion: ASSISTANT_MODEL_VERSION,
      generatedAt,
      warnings,
      integrationStatus: 'PHASE 8 LOCAL IMPLEMENTATION VERIFIED / FINAL CROSS-MODULE INTEGRATION PENDING',
    };
  }
}

export const assistantService = new AssistantService();
