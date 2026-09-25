import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchApi } from '../api/client';
import { OrganizationResponse } from '../api/organizations';

export interface WorkspaceContextType {
  activeOrg: OrganizationResponse;
  organizations: OrganizationResponse[];
  setActiveOrg: (org: OrganizationResponse) => void;
  isDemoMode: boolean;
  demoJourneyStep: number;
  setDemoJourneyStep: (step: number) => void;
  nextJourneyStep: () => void;
  prevJourneyStep: () => void;
  showFirstTimeTour: boolean;
  setShowFirstTimeTour: (show: boolean) => void;
}

// Fallback synthetic demo organization
const DEFAULT_DEMO_ORG: OrganizationResponse = {
  id: 'demo-apex-financial-01',
  name: 'Apex Financial Enterprises (Demo)',
  industry: 'Financial Services',
  employeeCount: 12500,
  annualRevenue: 2500000000,
  currency: 'USD',
  metadata: { is_demo: true, demo_tag: 'Official Judge Demonstration Workspace' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([DEFAULT_DEMO_ORG]);
  const [activeOrg, setActiveOrgState] = useState<OrganizationResponse>(DEFAULT_DEMO_ORG);
  const [demoJourneyStep, setDemoJourneyStepState] = useState<number>(() => {
    const saved = localStorage.getItem('cyberriskos_journey_step');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [showFirstTimeTour, setShowFirstTimeTour] = useState<boolean>(() => {
    return localStorage.getItem('cyberriskos_tour_completed') !== 'true';
  });

  useEffect(() => {
    let isMounted = true;
    const fetchOrgs = async () => {
      try {
        const res = await fetchApi<{ data: OrganizationResponse[] }>('/api/organizations');
        if (isMounted && res && res.data && res.data.length > 0) {
          setOrganizations(res.data);
          // Find demo org or first non-lab org
          const foundDemo = res.data.find(o => 
            o.name.includes('(Demo)') || o.name.includes('Apex Financial')
          );
          if (foundDemo) {
            setActiveOrgState(foundDemo);
          } else {
            // Filter out development lab for public judge view
            const publicOrg = res.data.find(o => !o.name.includes('Security Lab')) || res.data[0];
            setActiveOrgState(publicOrg);
          }
        }
      } catch (e) {
        console.warn('WorkspaceContext: Failed to fetch organizations from API, using default demo workspace', e);
      }
    };

    fetchOrgs();
  }, []);

  const setActiveOrg = (org: OrganizationResponse) => {
    // Prevent defaulting to Security Lab for judge flows unless explicitly selected
    setActiveOrgState(org);
  };

  const setDemoJourneyStep = (step: number) => {
    const bounded = Math.max(1, Math.min(9, step));
    setDemoJourneyStepState(bounded);
    localStorage.setItem('cyberriskos_journey_step', bounded.toString());
  };

  const nextJourneyStep = () => {
    setDemoJourneyStep(demoJourneyStep + 1);
  };

  const prevJourneyStep = () => {
    setDemoJourneyStep(demoJourneyStep - 1);
  };

  const isDemoMode = activeOrg.name.includes('(Demo)') || activeOrg.name.includes('Apex Financial') || (activeOrg.metadata as any)?.is_demo === true;

  return (
    <WorkspaceContext.Provider
      value={{
        activeOrg,
        organizations,
        setActiveOrg,
        isDemoMode,
        demoJourneyStep,
        setDemoJourneyStep,
        nextJourneyStep,
        prevJourneyStep,
        showFirstTimeTour,
        setShowFirstTimeTour,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
