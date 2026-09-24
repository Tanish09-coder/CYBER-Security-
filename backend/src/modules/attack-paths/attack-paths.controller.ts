// =============================================================================
// CyberRiskOS — Attack Path & Blast Radius Controller Layer
// Phase: Phase 7B — Attack Path Intelligence
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P7B-02)
// =============================================================================

import { Request, Response } from 'express';
import { attackPathsService, AttackPathsService } from './attack-paths.service';
import { AttackPathEngineServiceError } from './attack-paths.client';

export class AttackPathsController {
  constructor(private service: AttackPathsService = attackPathsService) {}

  /**
   * GET /api/attack-paths
   * Returns enterprise attack graph, discovered attack paths, and structural choke points.
   */
  getAttackGraph = async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.query.organizationId as string | undefined;
      const result = await this.service.getAttackGraph(orgId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      this.handleError(err, res, 'Get Attack Graph Failed');
    }
  };

  /**
   * POST /api/attack-paths/analyze
   * Analyzes an ad-hoc custom graph topology submitted in the request body.
   */
  analyzeCustomGraph = async (req: Request, res: Response): Promise<void> => {
    try {
      const { nodes, edges } = req.body;
      if (!Array.isArray(nodes) || nodes.length === 0) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Field "nodes" must be a non-empty array of graph nodes.',
        });
        return;
      }

      const result = await this.service.analyzeCustomGraph(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      this.handleError(err, res, 'Custom Graph Analysis Failed');
    }
  };

  /**
   * GET /api/attack-paths/choke-points
   * Returns prioritized structural choke points where intervention eliminates maximum attack paths.
   */
  getChokePoints = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const orgId = req.query.organizationId as string | undefined;
      const chokePoints = await this.service.getChokePoints(limit, orgId);
      res.status(200).json({
        success: true,
        data: chokePoints,
      });
    } catch (err: any) {
      this.handleError(err, res, 'Get Choke Points Failed');
    }
  };

  /**
   * GET /api/attack-paths/asset/:id
   * Returns upstream attack paths and downstream blast radius for a given asset.
   */
  getAssetBlastRadius = async (req: Request, res: Response): Promise<void> => {
    try {
      const assetId = req.params.id;
      const orgId = req.query.organizationId as string | undefined;
      const blastRadius = await this.service.getAssetBlastRadius(assetId, orgId);
      res.status(200).json({
        success: true,
        data: blastRadius,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('Asset not found')) {
        res.status(404).json({
          error: 'Asset Not Found',
          message: err.message,
        });
        return;
      }
      this.handleError(err, res, 'Get Asset Blast Radius Failed');
    }
  };

  private handleError(err: any, res: Response, fallbackTitle: string): void {
    if (err instanceof AttackPathEngineServiceError || err?.name === 'AttackPathEngineServiceError') {
      res.status(err.statusCode || 500).json({
        error: err.code || 'GRAPH_ENGINE_ERROR',
        message: err.message,
      });
      return;
    }

    res.status(500).json({
      error: fallbackTitle,
      message: err.message || 'Internal server error during attack path processing',
    });
  }
}

export const attackPathsController = new AttackPathsController();
