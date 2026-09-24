# =============================================================================
# CyberRiskOS — AI Explanation Grounding Validator (Python)
# Phase: Phase 8 — AI Explanation Assistant
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
#
# PURPOSE:
#   Validates that AI-generated explanation text accurately cites the ground
#   truth numeric values produced by deterministic CyberRiskOS calculation
#   engines (Risk Model v1, Financial Exposure Engine, Investment Optimizer).
#
# GROUNDING CONTRACT:
#   - An "anchor" is an exact numeric value from a deterministic calculation.
#   - An AI response "passes grounding" when every anchor appears in the
#     response text within the specified percentage tolerance.
#   - If ANY anchor is absent, the response is flagged GROUNDING_FAILED
#     and the safe deterministic template explanation is used instead.
#
# ANTI-HALLUCINATION MECHANISM:
#   Template explanations (generated directly from structured inputs) are
#   always grounded by construction. They serve as the safe fallback when AI
#   responses fail grounding validation.
#
# LIMITATIONS (explicitly documented):
#   - Numeric-presence validator only. Does NOT understand sentence semantics.
#   - A number matching an anchor but representing a different concept would
#     still pass (conservative heuristic, favors availability over strictness).
#   - Near-zero anchors (abs < 0.001) are trivially verified.
#   - Designed for use with deterministic CyberRiskOS calculation outputs.
# =============================================================================

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class GroundingAnchor:
    """
    A single ground truth anchor derived from a deterministic calculation output.

    Attributes:
        field:          Human-readable field identifier (e.g., 'riskScore', 'eal').
        expected_value: The exact numeric value to verify in the AI response.
        tolerance_pct:  Allowed relative deviation (%). Default: 5.0%.
                        A tolerance of 1.0% means the detected value must be within
                        ±1% of the expected value.
    """
    field: str
    expected_value: float
    tolerance_pct: float = 5.0


@dataclass
class GroundingViolation:
    """
    Represents a single grounding validation failure: an anchor whose
    expected value was not found in the AI response text.
    """
    field: str
    expected_value: float
    tolerance_pct: float
    note: str


@dataclass
class StructuredClaim:
    """
    Structured claim extracted or asserted for qualitative / semantic grounding.
    e.g. source_field='ealStatus', expected_value='NOT AVAILABLE'
    """
    source_field: str
    claimed_value: any
    expected_value: any = None
    is_verified: bool = False


@dataclass
class GroundingValidationResult:
    """
    Outcome of a grounding validation run against a single AI response.

    Attributes:
        passed:            True only if ALL non-trivial anchors and structured claims are verified.
        anchor_count:      Total number of anchors checked.
        verified_count:    Number of anchors successfully verified.
        violations:        List of anchors not found in the response.
        validation_note:   Human-readable summary of the validation outcome.
        structured_claims: List of evaluated structured claims.
    """
    passed: bool
    anchor_count: int
    verified_count: int
    violations: List[GroundingViolation]
    validation_note: str
    structured_claims: List[StructuredClaim] = field(default_factory=list)


def extract_numbers_from_text(text: str) -> List[float]:
    """
    Extracts all numeric values from text after normalizing thousands separators.

    Examples:
        "73,450.25" → 73450.25
        "1,234,567" → 1234567.0
        "The risk score is 82.50" → [82.5]

    Args:
        text: The response or explanation text to parse.

    Returns:
        List of floating-point values extracted from the text.
    """
    # Iteratively normalize thousands separators until none remain
    # e.g., "1,234,567" → "1234567" in two passes
    normalized = text
    while re.search(r"\d,\d{3}(?!\d)", normalized):
        normalized = re.sub(r"(\d),(\d{3})(?!\d)", r"\1\2", normalized)

    matches = re.findall(r"\b\d+(?:\.\d+)?\b", normalized)
    return [float(m) for m in matches]


def validate_response_grounding(
    response_text: str,
    anchors: List[GroundingAnchor],
    structured_claims: Optional[List[StructuredClaim]] = None,
) -> GroundingValidationResult:
    """
    Validates that an AI-generated response text contains all ground truth anchor
    values within the specified percentage tolerance and satisfies structured claims.
    """
    numbers_in_response = extract_numbers_from_text(response_text)
    violations: List[GroundingViolation] = []
    verified_count = 0

    for anchor in anchors:
        abs_expected = abs(anchor.expected_value)

        # Near-zero anchors: trivially verified (0.0 appears in virtually any text)
        if abs_expected < 0.001:
            verified_count += 1
            continue

        # Check if any extracted number is within tolerance of the expected value
        found = any(
            abs(num - anchor.expected_value) / abs_expected <= anchor.tolerance_pct / 100.0
            for num in numbers_in_response
        )

        if found:
            verified_count += 1
        else:
            violations.append(
                GroundingViolation(
                    field=anchor.field,
                    expected_value=anchor.expected_value,
                    tolerance_pct=anchor.tolerance_pct,
                    note=(
                        f"Expected value {anchor.expected_value} "
                        f"(±{anchor.tolerance_pct}%) not found in response text."
                    ),
                )
            )

    verified_claims: List[StructuredClaim] = []
    if structured_claims:
        for claim in structured_claims:
            is_verified = False
            exp = claim.expected_value
            if isinstance(exp, (int, float)):
                abs_exp = abs(exp)
                is_verified = any(
                    abs(num - exp) < 0.001 if abs_exp < 0.001 else abs(num - exp) / abs_exp <= 0.05
                    for num in numbers_in_response
                )
            elif isinstance(exp, str):
                is_verified = exp.lower() in response_text.lower()
            else:
                is_verified = True
            verified_claims.append(
                StructuredClaim(
                    source_field=claim.source_field,
                    claimed_value=claim.claimed_value,
                    expected_value=claim.expected_value,
                    is_verified=is_verified,
                )
            )

    claims_passed = all(c.is_verified for c in verified_claims)
    passed = len(violations) == 0 and claims_passed
    note = (
        "All ground truth anchors and structured claims verified in explanation."
        if passed
        else (
            f"{len(violations)} of {len(anchors)} anchor(s) not verified or structured claim failed. "
            f"Response may not accurately cite CyberRiskOS model outputs."
        )
    )

    return GroundingValidationResult(
        passed=passed,
        anchor_count=len(anchors),
        verified_count=verified_count,
        violations=violations,
        validation_note=note,
        structured_claims=verified_claims,
    )
