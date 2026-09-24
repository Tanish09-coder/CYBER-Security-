import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return (
    <main className="flex-1 overflow-y-auto p-8 bg-app-bg text-text-primary z-0 relative">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {children}
      </div>
    </main>
  );
};
