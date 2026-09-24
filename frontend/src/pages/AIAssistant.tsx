import React, { useState } from 'react';
import { AlertCircle, Loader2, Sparkles, Send, CheckCircle, XCircle } from 'lucide-react';
import { assistantApi } from '../api/assistant';
import { AIExplanationResponseDTO, ExplanationRequestType } from '../types/assistant';

export const AIAssistant: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [assetId, setAssetId] = useState('');
  const [cveId, setCveId] = useState('');
  const [reqType, setReqType] = useState<ExplanationRequestType>('EXPLAIN_RISK');
  
  const [response, setResponse] = useState<AIExplanationResponseDTO | null>(null);

  const handleSubmit = async () => {
    if (!assetId.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      setResponse(null);

      if (reqType === 'EXPLAIN_RISK') {
         const res = await assistantApi.explainRisk({ assetId, cveId });
         setResponse(res.data);
      } else if (reqType === 'EXPLAIN_FINANCIAL') {
         const res = await assistantApi.explainFinancial({ assetId, cveId });
         setResponse(res.data);
      } else {
         setError("Strategy Comparison is currently driven from the Optimizer UI.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate explanation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-text-primary flex items-center">
          <Sparkles className="w-6 h-6 mr-2 text-brand-primary" />
          AI Explanation Assistant
        </h2>
      </div>
      <p className="text-xs text-text-secondary mb-6">
        Generate context-aware, grounded explanations for risk and financial exposures.
      </p>

      {/* Input Panel */}
      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden mb-6">
         <div className="px-6 py-4 border-b border-app-border bg-surface-secondary flex justify-between items-center">
           <h3 className="text-sm font-semibold text-text-primary">Request Explanation</h3>
         </div>
         <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <select 
                value={reqType}
                onChange={(e) => setReqType(e.target.value as ExplanationRequestType)}
                className="px-3 py-2 border border-app-border rounded-md text-sm text-text-primary bg-white focus:outline-none focus:border-brand-primary"
              >
                <option value="EXPLAIN_RISK">Explain Risk Score</option>
                <option value="EXPLAIN_FINANCIAL">Explain Financial Exposure</option>
              </select>
              
              <input 
                type="text" 
                placeholder="Asset ID (e.g. ASSET-1)"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="flex-1 px-3 py-2 border border-app-border rounded-md text-sm text-text-primary focus:outline-none focus:border-brand-primary"
              />

              <input 
                type="text" 
                placeholder="CVE ID (Optional, e.g. CVE-2023-1234)"
                value={cveId}
                onChange={(e) => setCveId(e.target.value)}
                className="flex-1 px-3 py-2 border border-app-border rounded-md text-sm text-text-primary focus:outline-none focus:border-brand-primary"
              />
              
              <button 
                onClick={handleSubmit}
                disabled={!assetId.trim() || loading}
                className="flex items-center px-4 py-2 bg-brand-primary text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>
         </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-red-900 mb-2">Generation Failed</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Response Panel */}
      {response && !loading && (
        <div className="space-y-6">
          <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-app-border bg-surface-secondary flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">AI Explanation</h3>
                <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                  response.explanationStatus === 'AI_GENERATED' ? 'bg-green-100 text-green-800' :
                  response.explanationStatus === 'TEMPLATE_GENERATED' ? 'bg-blue-100 text-blue-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {response.explanationStatus.replace('_', ' ')}
                </span>
             </div>
             <div className="p-6">
               <div className="prose prose-sm max-w-none text-text-secondary whitespace-pre-wrap">
                  {response.explanation}
               </div>
               {response.warnings.length > 0 && (
                 <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
                   <h4 className="text-xs font-bold text-amber-900 mb-2">Model Warnings</h4>
                   <ul className="list-disc pl-4 text-xs text-amber-800 space-y-1">
                     {response.warnings.map((w, i) => <li key={i}>{w}</li>)}
                   </ul>
                 </div>
               )}
             </div>
          </div>

          <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-app-border bg-surface-secondary">
                <h3 className="text-sm font-semibold text-text-primary">Grounding & Verifiability</h3>
             </div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <div className="flex items-center mb-4">
                     {response.groundingValidation.passed ? (
                       <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                     ) : (
                       <XCircle className="w-5 h-5 text-red-500 mr-2" />
                     )}
                     <span className="text-sm font-bold text-text-primary">
                       {response.groundingValidation.passed ? "Ground Truth Verified" : "Grounding Validation Failed"}
                     </span>
                  </div>
                  <p className="text-xs text-text-secondary mb-4">
                     {response.groundingValidation.validationNote}
                  </p>
                  <p className="text-xs text-text-secondary">
                     Anchors Evaluated: <span className="font-bold">{response.groundingValidation.anchorCount}</span>
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                     Anchors Verified: <span className="font-bold">{response.groundingValidation.verifiedCount}</span>
                  </p>
               </div>
               {response.groundingValidation.violations.length > 0 && (
                 <div>
                    <h4 className="text-xs font-bold text-text-primary mb-3">Detected Hallucinations (Violations)</h4>
                    <ul className="space-y-2">
                       {response.groundingValidation.violations.map((v, i) => (
                         <li key={i} className="text-xs p-3 bg-red-50 border border-red-100 rounded text-red-800">
                           <span className="font-bold">{v.field}</span>: {v.note} (Expected: {v.expectedValue})
                         </li>
                       ))}
                    </ul>
                 </div>
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
