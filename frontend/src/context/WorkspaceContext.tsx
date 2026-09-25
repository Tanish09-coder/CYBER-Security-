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

// Fallback Indian Enterprise demo organization
const DEFAULT_DEMO_ORG: OrganizationResponse = {
  id: 'demo-bharat-digital-01',
  name: 'Bharat Digital Financial Services (Demo)',
  industry: 'Banking & Financial Services',
  employeeCount: 24500,
  annualRevenue: 185000000000, // ₹18,500 Crore
  currency: 'INR',
  metadata: { is_demo: true, demo_tag: 'Official Indian Enterprise Workspace (INR ₹)' },
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
          // Find Indian Bharat Digital demo org
          const foundDemo = res.data.find(o => 
            o.name.includes('Bharat Digital') || o.name.includes('(Demo)')
          );
          if (foundDemo) {
            // Force currency to INR for Indian enterprise context
            foundDemo.currency = 'INR';
            setActiveOrgState(foundDemo);
          } else {
            const publicOrg = res.data.find(o => !o.name.includes('Security Lab')) || res.data[0];
            publicOrg.currency = 'INR';
            setActiveOrgState(publicOrg);
          }
        }
      } catch (e) {
        console.warn('WorkspaceContext: Using default Indian enterprise workspace', e);
      }
    };

    fetchOrgs();
  }, []);

  const setActiveOrg = (org: OrganizationResponse) => {
    org.currency = 'INR';
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

  const isDemoMode = true;

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
