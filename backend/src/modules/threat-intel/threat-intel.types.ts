export interface ThreatIntelSummaryResponse {
  data: {
    cisaKev: {
      activeCount: number;
      knownRansomwareCount: number;
      overdueCount: number;
      lastSyncAt: string | null;
      lastSuccessfulRun: any;
    };
    mitreAttack: {
      domain: string;
      releaseVersion: string | null;
      releaseId: string | null;
      tacticsCount: number;
      techniquesCount: number;
      groupsCount: number;
      softwareCount: number;
      mitigationsCount: number;
      lastSyncAt: string | null;
    };
    generatedAt: string;
  };
}
