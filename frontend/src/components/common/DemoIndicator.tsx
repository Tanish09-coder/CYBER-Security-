import React from 'react';
import { Info, ShieldCheck, Database, Cpu } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const DemoIndicator: React.FC = () => {
  const { activeOrg, isDemoMode } = useWorkspace();

  if (!isDemoMode) return null;

  return (
    <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between border-b border-blue-800/40 shadow-sm relative z-30">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 font-bold tracking-tight bg-blue-500/20 px-2.5 py-1 rounded border border-blue-400/30 text-blue-200">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span>{activeOrg.name}</span>
          <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-extrabold ml-1">
            DEMO WORKSPACE
          </span>
        </div>

        <div className="group relative hidden sm:flex items-center text-slate-300 hover:text-white cursor-help transition-colors">
          <Info className="w-3.5 h-3.5 mr-1 text-blue-400" />
          <span className="text-[11px] underline decoration-dotted">Enterprise data is synthetic demo context</span>
          
          {/* Tooltip */}
          <div className="absolute left-0 top-full mt-1.5 w-80 p-3 bg-slate-900 text-slate-200 text-[11px] rounded-md shadow-xl border border-slate-700 hidden group-hover:block z-50 leading-relaxed">
            <p className="font-bold text-white mb-1">Authoritative vs Synthetic Data Policy</p>
            <p className="mb-2">Enterprise context (assets, revenue, topology) is synthetic demo data created for evaluation.</p>
            <p className="text-emerald-400 font-semibold flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" />
              Cyber threat intelligence is sourced live from NIST NVD, CISA KEV, MITRE ATT&CK, and VCDB.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 mt-1 sm:mt-0">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-700/50 uppercase tracking-wider">
          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
          REAL INTELLIGENCE
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-950 text-amber-300 border border-amber-700/50 uppercase tracking-wider">
          <Cpu className="w-3 h-3 mr-1 text-amber-400" />
          DEMO ENTERPRISE DATA
        </span>
      </div>
    </div>
  );
};
