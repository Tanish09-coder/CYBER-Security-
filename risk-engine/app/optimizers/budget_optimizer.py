# =============================================================================
# CyberRiskOS — Multi-Strategy Budget Optimizer Core
# Phase: Phase 5 — Investment Optimization + ROSI
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/OPTIMIZATION.md
# Rationale:
# - Deterministic multi-strategy solver under budget & dependency constraints
# - Evaluates candidate actions without picking a single political "winner"
# - Generates Strategy A (Max Reduction), Strategy B (Balanced ROSI), Strategy C (Quick Wins)
# =============================================================================

from datetime import datetime, timezone
from typing import List, Dict, Set, Optional, Tuple

from app.schemas.optimization_input import (
    OptimizationRequestSchema,
    OptimizationResultSchema,
    StrategyResultSchema,
    RemediationCandidateActionSchema,
    OptimizationStrategyType,
)
from app.calculators.rosi import RosiCalculator


class BudgetOptimizer:
    """
    Deterministic Multi-Strategy Investment Optimizer under budget and dependency constraints.
    """

    MODEL_VERSION: str = "1.0.0"

    @classmethod
    def solve(cls, request: OptimizationRequestSchema) -> OptimizationResultSchema:
        budget = request.budget_limit
        actions = request.candidate_actions
        base_risk = request.baseline_portfolio_risk
        base_eal = request.baseline_portfolio_eal

        # Build lookup table of candidate actions
        action_map: Dict[str, RemediationCandidateActionSchema] = {
            a.action_id: a for a in actions
        }

        # ---------------------------------------------------------------------
        # 1. Objective: MAX_MODELED_EAL_REDUCTION
        # Strictly maximizes modeled monetary EAL savings within budget ceiling.
        # ---------------------------------------------------------------------
        strat_eal_actions = cls._solve_max_eal_reduction(actions, budget, action_map)
        strat_eal = cls._build_strategy_result(
            strategy_id="STRATEGY_MAX_MODELED_EAL_REDUCTION",
            strategy_name="Maximum Modeled EAL Reduction",
            strategy_type=OptimizationStrategyType.MAX_MODELED_EAL_REDUCTION,
            description="Aggressively maximizes total monetary EAL savings within the allocated budget limit.",
            selected_actions=strat_eal_actions,
            budget=budget,
            base_risk=base_risk,
            base_eal=base_eal,
        )

        # ---------------------------------------------------------------------
        # 2. Objective: MAX_ROSI (Capital Efficiency)
        # Strictly maximizes Return on Security Investment (ROSI) ratio.
        # ---------------------------------------------------------------------
        strat_rosi_actions = cls._solve_max_rosi(actions, budget, action_map)
        strat_rosi = cls._build_strategy_result(
            strategy_id="STRATEGY_MAX_ROSI",
            strategy_name="Balanced Capital Efficiency (Max ROSI)",
            strategy_type=OptimizationStrategyType.MAX_ROSI,
            description="Prioritizes actions delivering the highest Return on Security Investment (ROSI) ratio per dollar spent.",
            selected_actions=strat_rosi_actions,
            budget=budget,
            base_risk=base_risk,
            base_eal=base_eal,
        )

        # ---------------------------------------------------------------------
        # 3. Objective: MAX_MODELED_RISK_REDUCTION
        # Strictly maximizes continuous technical risk score reduction.
        # ---------------------------------------------------------------------
        strat_risk_actions = cls._solve_max_risk_reduction(actions, budget, action_map)
        strat_risk = cls._build_strategy_result(
            strategy_id="STRATEGY_MAX_MODELED_RISK_REDUCTION",
            strategy_name="Maximum Modeled Risk Reduction",
            strategy_type=OptimizationStrategyType.MAX_MODELED_RISK_REDUCTION,
            description="Prioritizes candidate remediations delivering the maximum continuous risk score reduction.",
            selected_actions=strat_risk_actions,
            budget=budget,
            base_risk=base_risk,
            base_eal=base_eal,
        )

        if request.objective == OptimizationStrategyType.MAX_MODELED_RISK_REDUCTION:
            strategies = [strat_risk]
        elif request.objective == OptimizationStrategyType.MAX_MODELED_EAL_REDUCTION:
            strategies = [strat_eal]
        elif request.objective == OptimizationStrategyType.MAX_ROSI:
            strategies = [strat_rosi]
        else:
            strategies = [strat_eal, strat_rosi, strat_risk]

        evaluated_at = datetime.now(timezone.utc).isoformat()

        return OptimizationResultSchema(
            budgetLimit=budget,
            currency=request.currency,
            strategies=strategies,
            totalCandidates=len(actions),
            evaluatedAt=evaluated_at,
            modelVersion=cls.MODEL_VERSION,
        )

    # -------------------------------------------------------------------------
    # Explicit Solver Heuristics (Unmixed Objectives)
    # -------------------------------------------------------------------------
    @classmethod
    def _solve_max_eal_reduction(
        cls,
        actions: List[RemediationCandidateActionSchema],
        budget: float,
        action_map: Dict[str, RemediationCandidateActionSchema],
    ) -> List[RemediationCandidateActionSchema]:
        """
        Explicit Objective: MAX_MODELED_EAL_REDUCTION
        Sort strictly by total EAL reduction descending (with negative cost as tiebreaker).
        Does NOT mix risk score into monetary objective.
        """
        sorted_candidates = sorted(
            actions,
            key=lambda a: (a.estimated_eal_reduction, -a.cost),
            reverse=True,
        )
        return cls._select_feasible_actions(sorted_candidates, budget, action_map)

    @classmethod
    def _solve_max_rosi(
        cls,
        actions: List[RemediationCandidateActionSchema],
        budget: float,
        action_map: Dict[str, RemediationCandidateActionSchema],
    ) -> List[RemediationCandidateActionSchema]:
        """
        Explicit Objective: MAX_ROSI
        Sort strictly by Return on Security Investment ratio: (EAL_reduction - Cost) / Cost descending.
        """
        def rosi_key(a: RemediationCandidateActionSchema) -> float:
            if a.cost <= 0.0:
                return float("inf") if a.estimated_eal_reduction > 0 else 0.0
            return (a.estimated_eal_reduction - a.cost) / a.cost

        sorted_candidates = sorted(
            actions,
            key=lambda a: (rosi_key(a), a.estimated_eal_reduction, -a.cost),
            reverse=True,
        )
        return cls._select_feasible_actions(sorted_candidates, budget, action_map)

    @classmethod
    def _solve_max_risk_reduction(
        cls,
        actions: List[RemediationCandidateActionSchema],
        budget: float,
        action_map: Dict[str, RemediationCandidateActionSchema],
    ) -> List[RemediationCandidateActionSchema]:
        """
        Explicit Objective: MAX_MODELED_RISK_REDUCTION
        Sort strictly by continuous risk score reduction descending (with negative cost as tiebreaker).
        Does NOT mix monetary EAL into technical risk score objective.
        """
        sorted_candidates = sorted(
            actions,
            key=lambda a: (a.estimated_risk_reduction, -a.cost),
            reverse=True,
        )
        return cls._select_feasible_actions(sorted_candidates, budget, action_map)

    @classmethod
    def _select_feasible_actions(
        cls,
        sorted_candidates: List[RemediationCandidateActionSchema],
        budget: float,
        action_map: Dict[str, RemediationCandidateActionSchema],
    ) -> List[RemediationCandidateActionSchema]:
        """
        Iteratively selects candidate actions respecting remaining budget,
        prerequisite dependencies, and mutually exclusive conflict rules.
        """
        selected: Dict[str, RemediationCandidateActionSchema] = {}
        total_cost = 0.0

        for candidate in sorted_candidates:
            if candidate.action_id in selected:
                continue

            # Check if adding candidate + its missing dependencies fits budget and conflicts
            needed_actions, needed_cost = cls._resolve_dependencies(
                candidate, selected, action_map
            )

            if needed_actions is None:
                # Unresolvable dependency or missing dependency in action map
                continue

            # Check budget feasibility
            if total_cost + needed_cost > budget:
                continue

            # Check mutually exclusive conflict rules
            has_conflict = False
            for act in needed_actions:
                for conflict_id in act.conflicts_with:
                    if conflict_id in selected or any(na.action_id == conflict_id for na in needed_actions):
                        has_conflict = True
                        break
                if has_conflict:
                    break

            if has_conflict:
                continue

            # Feasible! Add all needed actions
            for act in needed_actions:
                if act.action_id not in selected:
                    selected[act.action_id] = act
                    total_cost += act.cost

        return list(selected.values())

    @classmethod
    def _resolve_dependencies(
        cls,
        candidate: RemediationCandidateActionSchema,
        already_selected: Dict[str, RemediationCandidateActionSchema],
        action_map: Dict[str, RemediationCandidateActionSchema],
    ) -> Tuple[Optional[List[RemediationCandidateActionSchema]], float]:
        """
        Recursively resolves dependencies for candidate action.
        Returns (list_of_actions_to_add, additional_cost_needed) or (None, 0.0) if impossible.
        """
        to_add: List[RemediationCandidateActionSchema] = []
        visited: Set[str] = set()
        additional_cost = 0.0

        def traverse(act: RemediationCandidateActionSchema) -> bool:
            nonlocal additional_cost
            if act.action_id in visited or act.action_id in already_selected:
                return True
            visited.add(act.action_id)

            for dep_id in act.dependencies:
                dep_act = action_map.get(dep_id)
                if not dep_act:
                    return False  # Missing dependency in catalog
                if not traverse(dep_act):
                    return False

            to_add.append(act)
            additional_cost += act.cost
            return True

        success = traverse(candidate)
        if not success:
            return None, 0.0

        return to_add, additional_cost

    @classmethod
    def _build_strategy_result(
        cls,
        strategy_id: str,
        strategy_name: str,
        strategy_type: OptimizationStrategyType,
        description: str,
        selected_actions: List[RemediationCandidateActionSchema],
        budget: float,
        base_risk: Optional[float],
        base_eal: Optional[float],
    ) -> StrategyResultSchema:
        total_cost = round(sum(a.cost for a in selected_actions), 2)
        remaining_budget = round(max(0.0, budget - total_cost), 2)
        total_risk_red = round(sum(a.estimated_risk_reduction for a in selected_actions), 2)
        total_eal_red = round(sum(a.estimated_eal_reduction for a in selected_actions), 2)

        sim_risk = (
            round(max(0.0, base_risk - total_risk_red), 2)
            if base_risk is not None
            else None
        )
        sim_eal = (
            round(max(0.0, base_eal - total_eal_red), 2)
            if base_eal is not None
            else None
        )

        net_benefit, rosi_ratio, rosi_pct = RosiCalculator.calculate(
            total_eal_red, total_cost
        )

        return StrategyResultSchema(
            strategyId=strategy_id,
            strategyName=strategy_name,
            strategyType=strategy_type,
            description=description,
            selectedActions=selected_actions,
            totalCost=total_cost,
            remainingBudget=remaining_budget,
            totalRiskReduction=total_risk_red,
            totalEalReduction=total_eal_red,
            simulatedPortfolioRisk=sim_risk,
            simulatedPortfolioEal=sim_eal,
            netFinancialBenefit=net_benefit,
            rosiPct=rosi_pct,
            rosiRatio=rosi_ratio,
            actionCount=len(selected_actions),
        )
