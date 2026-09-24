# =============================================================================
# CyberRiskOS — Return on Security Investment (ROSI) Calculator
# Phase: Phase 5 — Investment Optimization + ROSI
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/OPTIMIZATION.md
# =============================================================================

from typing import Tuple, Optional


class RosiCalculator:
    """
    Deterministic Return on Security Investment (ROSI) Calculator.
    Standard Industry Formula:
      ROSI = (Modeled Monetary Risk Reduction [ΔEAL] - Mitigation Cost) / Mitigation Cost
    Handles division-by-zero, negative costs, and zero-benefit boundary cases.
    """

    @staticmethod
    def calculate(
        eal_reduction: float, cost: float
    ) -> Tuple[float, Optional[float], Optional[float]]:
        """
        Calculates:
          1. Net Financial Benefit (ΔEAL - Cost)
          2. ROSI Ratio ((ΔEAL - Cost) / Cost)
          3. ROSI Percentage (((ΔEAL - Cost) / Cost) * 100)

        Returns: (net_benefit, rosi_ratio, rosi_pct)
        """
        net_benefit = round(eal_reduction - cost, 2)

        if cost <= 0.0:
            # Zero-cost action (e.g. policy toggle or configuration change):
            # Cannot divide by zero. Return None for ratio/pct while preserving net benefit.
            if eal_reduction > 0.0:
                return net_benefit, None, None
            return 0.0, 0.0, 0.0

        ratio = round((eal_reduction - cost) / cost, 4)
        pct = round(ratio * 100.0, 2)

        return net_benefit, ratio, pct
