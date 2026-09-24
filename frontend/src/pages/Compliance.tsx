import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { fetchApi } from '../api/client';

export const Compliance: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Let the actual backend 501 Not Implemented trigger the catch block.
        await fetchApi('/v1/compliance');
      } catch (err: any) {
        setError(err.message || 'API Contract for Compliance mapping is not yet implemented.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      <p className="text-sm font-medium text-text-secondary">Evaluating compliance mappings...</p>
    </div>
  );

  if (error) return (
    <div className="p-6 h-full flex flex-col items-center justify-center">
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg max-w-lg text-center shadow-sm">
        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-4" />
        <h3 className="text-sm font-bold text-amber-900 mb-2">Not Implemented</h3>
        <p className="text-xs text-amber-700">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-text-primary mb-6">Compliance Posture</h2>
    </div>
  );
};
