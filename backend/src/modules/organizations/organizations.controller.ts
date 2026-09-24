// =============================================================================
// CyberRiskOS — Organizations & Business Units Controller
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { Request, Response } from 'express';
import { OrganizationService, OrganizationNotFoundError } from './organizations.service';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  createBusinessUnitSchema,
  updateBusinessUnitSchema,
  organizationIdParamSchema,
  uuidSchema,
} from './organizations.validation';
import { logger } from '../../config/logger';

export class OrganizationController {
  private service: OrganizationService;

  constructor(service?: OrganizationService) {
    this.service = service || new OrganizationService();
  }

  // ---------------------------------------------------------------------------
  // Organization Endpoints
  // ---------------------------------------------------------------------------

  createOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = createOrganizationSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const org = await this.service.createOrganization(validation.data);
      res.status(201).json(org);
    } catch (err: any) {
      logger.error('Failed to create organization', { error: err.message });
      res.status(500).json({
        error: 'CreateError',
        message: err.message,
      });
    }
  };

  getOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const idValidation = uuidSchema.safeParse(req.params.id);
      if (!idValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: idValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const org = await this.service.getOrganizationById(idValidation.data);
      if (!org) {
        res.status(404).json({
          error: 'NotFound',
          message: `Organization ${idValidation.data} not found`,
        });
        return;
      }

      res.status(200).json(org);
    } catch (err: any) {
      logger.error('Failed to get organization', { error: err.message });
      res.status(500).json({
        error: 'QueryError',
        message: err.message,
      });
    }
  };

  listOrganizations = async (req: Request, res: Response): Promise<void> => {
    try {
      const orgs = await this.service.listOrganizations();
      res.status(200).json({
        count: orgs.length,
        data: orgs,
      });
    } catch (err: any) {
      logger.error('Failed to list organizations', { error: err.message });
      res.status(500).json({
        error: 'QueryError',
        message: err.message,
      });
    }
  };

  updateOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const idValidation = uuidSchema.safeParse(req.params.id);
      if (!idValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: idValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const bodyValidation = updateOrganizationSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: bodyValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const org = await this.service.updateOrganization(idValidation.data, bodyValidation.data);
      if (!org) {
        res.status(404).json({
          error: 'NotFound',
          message: `Organization ${idValidation.data} not found`,
        });
        return;
      }

      res.status(200).json(org);
    } catch (err: any) {
      logger.error('Failed to update organization', { error: err.message });
      res.status(500).json({
        error: 'UpdateError',
        message: err.message,
      });
    }
  };

  deleteOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const idValidation = uuidSchema.safeParse(req.params.id);
      if (!idValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: idValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const deleted = await this.service.deleteOrganization(idValidation.data);
      if (!deleted) {
        res.status(404).json({
          error: 'NotFound',
          message: `Organization ${idValidation.data} not found`,
        });
        return;
      }

      res.status(200).json({
        message: `Organization ${idValidation.data} deleted successfully`,
      });
    } catch (err: any) {
      logger.error('Failed to delete organization', { error: err.message });
      res.status(500).json({
        error: 'DeleteError',
        message: err.message,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Business Unit Endpoints
  // ---------------------------------------------------------------------------

  createBusinessUnit = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = createBusinessUnitSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const bu = await this.service.createBusinessUnit(validation.data);
      res.status(201).json(bu);
    } catch (err: any) {
      if (err instanceof OrganizationNotFoundError) {
        res.status(404).json({
          error: 'NotFound',
          message: err.message,
        });
        return;
      }

      logger.error('Failed to create business unit', { error: err.message });
      res.status(500).json({
        error: 'CreateError',
        message: err.message,
      });
    }
  };

  getBusinessUnit = async (req: Request, res: Response): Promise<void> => {
    try {
      const idValidation = uuidSchema.safeParse(req.params.id);
      if (!idValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: idValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const bu = await this.service.getBusinessUnitById(idValidation.data);
      if (!bu) {
        res.status(404).json({
          error: 'NotFound',
          message: `Business unit ${idValidation.data} not found`,
        });
        return;
      }

      res.status(200).json(bu);
    } catch (err: any) {
      logger.error('Failed to get business unit', { error: err.message });
      res.status(500).json({
        error: 'QueryError',
        message: err.message,
      });
    }
  };

  listBusinessUnits = async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = req.query.organizationId as string | undefined;

      if (organizationId) {
        const idValidation = uuidSchema.safeParse(organizationId);
        if (!idValidation.success) {
          res.status(400).json({
            error: 'Validation Error',
            details: idValidation.error.errors.map((e) => e.message),
          });
          return;
        }
      }

      const units = await this.service.listBusinessUnits(organizationId);
      res.status(200).json({
        count: units.length,
        data: units,
      });
    } catch (err: any) {
      logger.error('Failed to list business units', { error: err.message });
      res.status(500).json({
        error: 'QueryError',
        message: err.message,
      });
    }
  };

  updateBusinessUnit = async (req: Request, res: Response): Promise<void> => {
    try {
      const idValidation = uuidSchema.safeParse(req.params.id);
      if (!idValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: idValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const bodyValidation = updateBusinessUnitSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: bodyValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const bu = await this.service.updateBusinessUnit(idValidation.data, bodyValidation.data);
      if (!bu) {
        res.status(404).json({
          error: 'NotFound',
          message: `Business unit ${idValidation.data} not found`,
        });
        return;
      }

      res.status(200).json(bu);
    } catch (err: any) {
      logger.error('Failed to update business unit', { error: err.message });
      res.status(500).json({
        error: 'UpdateError',
        message: err.message,
      });
    }
  };

  deleteBusinessUnit = async (req: Request, res: Response): Promise<void> => {
    try {
      const idValidation = uuidSchema.safeParse(req.params.id);
      if (!idValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: idValidation.error.errors.map((e) => e.message),
        });
        return;
      }

      const deleted = await this.service.deleteBusinessUnit(idValidation.data);
      if (!deleted) {
        res.status(404).json({
          error: 'NotFound',
          message: `Business unit ${idValidation.data} not found`,
        });
        return;
      }

      res.status(200).json({
        message: `Business unit ${idValidation.data} deleted successfully`,
      });
    } catch (err: any) {
      logger.error('Failed to delete business unit', { error: err.message });
      res.status(500).json({
        error: 'DeleteError',
        message: err.message,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Enterprise Dimension Aggregations (Phase 6)
  // ---------------------------------------------------------------------------

  getBusinessUnitSummaries = async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = req.query.organizationId as string | undefined;
      const summaries = await this.service.getBusinessUnitSummaries(organizationId);
      res.status(200).json({ businessUnits: summaries, total: summaries.length });
    } catch (err: any) {
      logger.error('Failed to get business unit summaries', { error: err.message });
      res.status(500).json({ error: 'QueryError', message: err.message });
    }
  };

  getOrganizationDimensions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const dimensions = await this.service.getOrganizationDimensions(id);
      res.status(200).json(dimensions);
    } catch (err: any) {
      logger.error('Failed to get organization dimensions', { error: err.message });
      res.status(500).json({ error: 'QueryError', message: err.message });
    }
  };
}
