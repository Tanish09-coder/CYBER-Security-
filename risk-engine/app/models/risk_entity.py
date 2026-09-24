# =============================================================================
# CyberRiskOS — Risk Engine Entity Models & Provenance Helpers
# Phase: Phase 2 — Risk Quantification
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/RISK_ENGINE_CONTRACT.md
# =============================================================================

import hashlib
import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from app.schemas.risk_input import RiskSeverity, FactorCategory


@dataclass(frozen=True)
class ProvenanceHasher:
    """
    Utility for generating deterministic SHA-256 provenance hashes
    from canonical JSON representations of evaluation inputs.
    """

    @staticmethod
    def compute_hash(payload: Dict[str, Any]) -> str:
        canonical_json = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
        return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()


@dataclass
class FactorExplanation:
    name: str
    category: FactorCategory
    value: Any
    weight: float
    contribution: float
    rationale: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "category": self.category.value if isinstance(self.category, FactorCategory) else self.category,
            "value": self.value,
            "weight": self.weight,
            "contribution": self.contribution,
            "rationale": self.rationale,
        }


@dataclass
class RiskEvaluationEntity:
    asset_id: str
    asset_name: str
    cve_id: str
    base_cvss: Optional[float]
    risk_score: float
    severity: RiskSeverity
    factors: List[FactorExplanation]
    missing_data_warnings: List[str] = field(default_factory=list)
    data_completeness_score: float = 1.0
    risk_flags: List[str] = field(default_factory=list)
    model_version: str = "1.0.0"
    provenance_hash: str = ""
    evaluated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
