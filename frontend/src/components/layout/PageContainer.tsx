import React from 'react';

interface PageContainerProps { children: React.ReactNode; }

export const PageContainer: React.FC<PageContainerProps> = ({ children }) => (
  <main className="gov-page-content">
    <div style={{ maxWidth: 1400, margin: '0 auto' }} className="animate-fade-in">
      {children}
    </div>
  </main>
);
