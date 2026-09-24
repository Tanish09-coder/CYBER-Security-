# =============================================================================
# CyberRiskOS — AI Grounding Validator Test Suite
# Phase: Phase 8 — AI Explanation Assistant
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
#
# TESTS:
#   - extract_numbers_from_text: comma normalization, basic extraction
#   - validate_response_grounding: pass/fail scenarios
#   - Anti-hallucination: wrong value claims → violations detected
#   - Zero-anchor trivial pass
#   - Near-zero anchor trivial verification
#   - Tolerance boundary testing
#   - Multiple anchor partial failure
# =============================================================================

import pytest
from app.ai.grounding import (
    GroundingAnchor,
    StructuredClaim,
    extract_numbers_from_text,
    validate_response_grounding,
)


# ---------------------------------------------------------------------------
# extract_numbers_from_text tests
# ---------------------------------------------------------------------------

class TestExtractNumbers:
    def test_extracts_simple_integer(self):
        numbers = extract_numbers_from_text("The score is 82 out of 100.")
        assert 82.0 in numbers
        assert 100.0 in numbers

    def test_extracts_decimal_number(self):
        numbers = extract_numbers_from_text("Risk score: 82.50")
        assert 82.5 in numbers

    def test_normalizes_thousands_separator(self):
        numbers = extract_numbers_from_text("EAL: $37,500.00")
        assert 37500.0 in numbers

    def test_normalizes_multi_comma_large_number(self):
        numbers = extract_numbers_from_text("Total loss: $1,234,567.89")
        assert 1234567.89 in numbers

    def test_returns_empty_for_no_numbers(self):
        numbers = extract_numbers_from_text("No numbers here at all.")
        assert numbers == []

    def test_extracts_multiple_numbers(self):
        numbers = extract_numbers_from_text("Scores: 42.5, 73.0, and 99.9")
        assert 42.5 in numbers
        assert 73.0 in numbers
        assert 99.9 in numbers


# ---------------------------------------------------------------------------
# validate_response_grounding: PASS scenarios
# ---------------------------------------------------------------------------

class TestGroundingValidationPass:
    def test_exact_value_match_passes(self):
        result = validate_response_grounding(
            "The risk score is 82.50 out of 100.0.",
            [GroundingAnchor(field="riskScore", expected_value=82.5, tolerance_pct=1.0)],
        )
        assert result.passed is True
        assert len(result.violations) == 0
        assert result.verified_count == 1
        assert result.anchor_count == 1

    def test_value_within_tolerance_passes(self):
        # 37499.50 is within 1% of 37500.00
        result = validate_response_grounding(
            "EAL: 37499.50 USD",
            [GroundingAnchor(field="eal", expected_value=37500.0, tolerance_pct=1.0)],
        )
        assert result.passed is True

    def test_comma_formatted_value_passes(self):
        result = validate_response_grounding(
            "Estimated Annualized Loss: $37,500.00 USD.",
            [GroundingAnchor(field="eal", expected_value=37500.0, tolerance_pct=1.0)],
        )
        assert result.passed is True

    def test_zero_anchors_trivially_passes(self):
        result = validate_response_grounding("Any text here.", [])
        assert result.passed is True
        assert result.anchor_count == 0
        assert result.validated_note_present()

    def test_near_zero_anchor_trivially_verified(self):
        result = validate_response_grounding(
            "Some text with no relevant numbers.",
            [GroundingAnchor(field="zeroField", expected_value=0.0, tolerance_pct=5.0)],
        )
        assert result.passed is True
        assert result.verified_count == 1

    def test_multiple_anchors_all_present(self):
        text = "Risk score: 82.50. EAL: 37500.00 USD. Budget: 50000."
        result = validate_response_grounding(
            text,
            [
                GroundingAnchor(field="riskScore", expected_value=82.5, tolerance_pct=1.0),
                GroundingAnchor(field="eal", expected_value=37500.0, tolerance_pct=1.0),
                GroundingAnchor(field="budget", expected_value=50000.0, tolerance_pct=1.0),
            ],
        )
        assert result.passed is True
        assert result.verified_count == 3
        assert result.anchor_count == 3


# ---------------------------------------------------------------------------
# validate_response_grounding: FAIL (anti-hallucination) scenarios
# ---------------------------------------------------------------------------

class TestGroundingValidationFail:
    def test_absent_anchor_value_fails(self):
        """AI response omits the risk score entirely → violation."""
        result = validate_response_grounding(
            "This asset has a vulnerability. Immediate remediation is advised.",
            [GroundingAnchor(field="riskScore", expected_value=82.5, tolerance_pct=1.0)],
        )
        assert result.passed is False
        assert len(result.violations) == 1
        assert result.violations[0].field == "riskScore"
        assert result.violations[0].expected_value == 82.5

    def test_wrong_risk_score_causes_violation(self):
        """AI claims score is 99.99 when ground truth is 42.5 → violation."""
        result = validate_response_grounding(
            "The risk score is 99.99 indicating critical severity.",
            [GroundingAnchor(field="riskScore", expected_value=42.5, tolerance_pct=1.0)],
        )
        assert result.passed is False
        assert result.violations[0].field == "riskScore"
        assert result.violations[0].expected_value == 42.5

    def test_fabricated_eal_causes_violation(self):
        """AI fabricates EAL of 500000 when actual is 45000 → violation."""
        result = validate_response_grounding(
            "The modeled EAL is $500,000.00 representing significant annual exposure.",
            [GroundingAnchor(field="eal", expected_value=45000.0, tolerance_pct=1.0)],
        )
        assert result.passed is False
        assert result.violations[0].expected_value == 45000.0

    def test_partial_anchor_failure_reported_correctly(self):
        """Risk score is present but EAL is absent → one violation."""
        text = "Risk score: 82.50 out of 100."
        result = validate_response_grounding(
            text,
            [
                GroundingAnchor(field="riskScore", expected_value=82.5, tolerance_pct=1.0),
                GroundingAnchor(field="eal", expected_value=45000.0, tolerance_pct=1.0),
            ],
        )
        assert result.passed is False
        assert result.verified_count == 1
        assert len(result.violations) == 1
        assert result.violations[0].field == "eal"

    def test_violation_note_contains_field_name(self):
        result = validate_response_grounding(
            "No relevant numbers here.",
            [GroundingAnchor(field="myField", expected_value=99.99, tolerance_pct=2.0)],
        )
        assert result.passed is False
        assert "myField" in result.violations[0].note or "99.99" in result.violations[0].note


# ---------------------------------------------------------------------------
# Tolerance boundary tests
# ---------------------------------------------------------------------------

class TestToleranceBoundary:
    def test_value_at_exact_tolerance_boundary_passes(self):
        # 1% of 100.0 = 1.0. Value 101.0 should pass at exactly 1% tolerance.
        result = validate_response_grounding(
            "Score: 101.0",
            [GroundingAnchor(field="s", expected_value=100.0, tolerance_pct=1.0)],
        )
        assert result.passed is True

    def test_value_just_outside_tolerance_fails(self):
        # 1% of 100.0 = 1.0. Value 102.0 (2%) should fail at 1% tolerance.
        result = validate_response_grounding(
            "Score: 102.0",
            [GroundingAnchor(field="s", expected_value=100.0, tolerance_pct=1.0)],
        )
        assert result.passed is False

    def test_wide_tolerance_passes_approximate_value(self):
        # 10% tolerance: 45000 matches expected 50000 within 10%
        result = validate_response_grounding(
            "Cost: 45000",
            [GroundingAnchor(field="cost", expected_value=50000.0, tolerance_pct=10.0)],
        )
        assert result.passed is True


# ---------------------------------------------------------------------------
# Validation note content tests
# ---------------------------------------------------------------------------

class TestValidationNote:
    def test_passed_note_is_affirmative(self):
        result = validate_response_grounding(
            "The score is 50.0.",
            [GroundingAnchor(field="score", expected_value=50.0, tolerance_pct=1.0)],
        )
        assert "verified" in result.validation_note.lower()

    def test_failed_note_mentions_violation_count(self):
        result = validate_response_grounding(
            "Nothing useful here.",
            [
                GroundingAnchor(field="a", expected_value=50.0, tolerance_pct=1.0),
                GroundingAnchor(field="b", expected_value=75.0, tolerance_pct=1.0),
            ],
        )
        assert "2 of 2" in result.validation_note


# ---------------------------------------------------------------------------
# Shared Golden Vector Test Suite
# ---------------------------------------------------------------------------

import json
import os

class TestGoldenVectors:
    def test_shared_golden_vectors(self):
        json_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "grounding_golden_vectors.json")
        if not os.path.exists(json_path):
            pytest.skip("Shared golden vectors JSON file not found at data/grounding_golden_vectors.json")

        with open(json_path, "r", encoding="utf-8") as f:
            vectors = json.load(f)

        for vector in vectors:
            ctx = vector.get("authoritativeContext", {})
            text = vector.get("candidateText", "")
            expected_passed = vector.get("expectedPassed", True)

            anchors = []
            structured_claims = []
            if "riskScore" in ctx:
                anchors.append(GroundingAnchor(field="riskScore", expected_value=ctx["riskScore"], tolerance_pct=1.0))
            if "sle" in ctx and ctx["sle"] is not None:
                anchors.append(GroundingAnchor(field="sle", expected_value=ctx["sle"], tolerance_pct=1.0))
            if "alef" in ctx and ctx["alef"] is not None:
                anchors.append(GroundingAnchor(field="alef", expected_value=ctx["alef"], tolerance_pct=5.0))
            if "eal" in ctx and ctx["eal"] is not None:
                anchors.append(GroundingAnchor(field="eal", expected_value=ctx["eal"], tolerance_pct=1.0))
            if "ealStatus" in ctx and ctx["ealStatus"] == "NOT_AVAILABLE":
                structured_claims.append(StructuredClaim(source_field="ealStatus", claimed_value="NOT AVAILABLE", expected_value="NOT AVAILABLE"))
            if "strategyACost" in ctx:
                anchors.append(GroundingAnchor(field="strategyACost", expected_value=ctx["strategyACost"], tolerance_pct=1.0))
            if "strategyBCost" in ctx:
                anchors.append(GroundingAnchor(field="strategyBCost", expected_value=ctx["strategyBCost"], tolerance_pct=1.0))

            res = validate_response_grounding(text, anchors, structured_claims)
            assert res.passed == expected_passed, f"Golden Vector {vector['testCaseId']} failed: expected {expected_passed}, got {res.passed}"

# Helper to keep the fixture test readable
def _gvr_note_present(result) -> bool:
    return isinstance(result.validation_note, str) and len(result.validation_note) > 0


# Monkey-patch the zero-anchor test helper
import types
def _validated_note_present(self):
    return isinstance(self.validation_note, str) and len(self.validation_note) > 0

from app.ai.grounding import GroundingValidationResult
GroundingValidationResult.validated_note_present = _validated_note_present
