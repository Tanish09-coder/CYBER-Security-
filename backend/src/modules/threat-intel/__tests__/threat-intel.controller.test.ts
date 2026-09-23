import { ThreatIntelController } from '../threat-intel.controller';
import { Request, Response } from 'express';

describe('ThreatIntelController', () => {
  let controller: ThreatIntelController;
  let mockCisaService: any;
  let mockMitreService: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockCisaService = {
      getStatus: jest.fn(),
      getKevSummary: jest.fn(),
      getKevCatalog: jest.fn(),
    };

    mockMitreService = {
      getStatus: jest.fn(),
    };

    controller = new ThreatIntelController(mockCisaService, mockMitreService);

    mockReq = {
      query: {},
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getSummary', () => {
    it('should return a combined summary', async () => {
      mockCisaService.getStatus.mockResolvedValue({
        lastSyncAt: '2023-10-01T00:00:00Z',
        lastSuccessfulRun: { status: 'COMPLETED' },
      });
      mockCisaService.getKevSummary.mockResolvedValue({
        activeCount: 100,
        knownRansomwareCount: 20,
        overdueCount: 5,
      });
      mockMitreService.getStatus.mockResolvedValue({
        domain: 'enterprise-attack',
        currentVersion: '14.0',
        counts: { tactics: 14, techniques: 200, subtechniques: 400, groups: 130, software: 700, mitigations: 40 },
        lastSuccessfulSync: { completed_at: '2023-10-02T00:00:00Z' },
      });

      await controller.getSummary(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cisaKev: {
              activeCount: 100,
              knownRansomwareCount: 20,
              overdueCount: 5,
              lastSyncAt: '2023-10-01T00:00:00Z',
              lastSuccessfulRun: { status: 'COMPLETED' },
            },
            mitreAttack: {
              domain: 'enterprise-attack',
              releaseVersion: '14.0',
              releaseId: null,
              tacticsCount: 14,
              techniquesCount: 600,
              groupsCount: 130,
              softwareCount: 700,
              mitigationsCount: 40,
              lastSyncAt: '2023-10-02T00:00:00Z',
            },
          }),
        })
      );
    });

    it('should handle empty states', async () => {
      mockCisaService.getStatus.mockResolvedValue({ lastSyncAt: null, lastSuccessfulRun: null });
      mockCisaService.getKevSummary.mockResolvedValue({ activeCount: 0, knownRansomwareCount: 0, overdueCount: 0 });
      mockMitreService.getStatus.mockResolvedValue({
        domain: 'enterprise-attack',
        currentVersion: null,
        counts: { tactics: 0, techniques: 0, subtechniques: 0, groups: 0, software: 0, mitigations: 0 },
        lastSuccessfulSync: null,
      });

      await controller.getSummary(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cisaKev: { activeCount: 0, knownRansomwareCount: 0, overdueCount: 0, lastSyncAt: null, lastSuccessfulRun: null },
          }),
        })
      );
    });

    it('should handle service errors gracefully', async () => {
      mockCisaService.getStatus.mockRejectedValue(new Error('DB failure'));

      await controller.getSummary(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Internal Server Error', message: 'DB failure' }));
    });
  });

  describe('getKevCatalog', () => {
    it('should call cisa service with default pagination', async () => {
      mockCisaService.getKevCatalog.mockResolvedValue({ data: [], pagination: {} });
      
      await controller.getKevCatalog(mockReq as Request, mockRes as Response);

      expect(mockCisaService.getKevCatalog).toHaveBeenCalledWith({
        page: 1,
        limit: 25,
        search: undefined,
        ransomware: undefined,
        dateAddedFrom: undefined,
        dateAddedTo: undefined,
        dueDateFrom: undefined,
        dueDateTo: undefined,
      });
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should pass filters properly', async () => {
      mockReq.query = {
        page: '2',
        limit: '10',
        search: 'log4j',
        ransomware: 'true',
        dateAddedFrom: '2021-01-01',
        dateAddedTo: '2021-12-31',
      };
      
      mockCisaService.getKevCatalog.mockResolvedValue({ data: [], pagination: {} });
      
      await controller.getKevCatalog(mockReq as Request, mockRes as Response);

      expect(mockCisaService.getKevCatalog).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: 'log4j',
        ransomware: true,
        dateAddedFrom: '2021-01-01',
        dateAddedTo: '2021-12-31',
        dueDateFrom: undefined,
        dueDateTo: undefined,
      });
    });

    it('should return 400 for invalid page parameter', async () => {
      mockReq.query = { page: '0' };
      await controller.getKevCatalog(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid ransomware boolean', async () => {
      mockReq.query = { ransomware: 'yes' };
      await controller.getKevCatalog(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid date string', async () => {
      mockReq.query = { dateAddedFrom: 'invalid-date' };
      await controller.getKevCatalog(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for reversed date range', async () => {
      mockReq.query = { dateAddedFrom: '2023-01-01', dateAddedTo: '2022-01-01' };
      await controller.getKevCatalog(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'dateAddedFrom cannot be after dateAddedTo' });
    });
  });
});
