import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return (
    <main className="flex-1 overflow-y-auto z-0 relative" style={{ background: '#F5F5F5' }}>
      <div className="max-w-7xl mx-auto p-6 space-y-5 animate-fade-in">
        {children}
      </div>
    </main>
  );
};
