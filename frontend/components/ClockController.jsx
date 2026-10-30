'use client';

import React, { useState } from 'react';
import { Calendar, FastForward, RotateCcw, Clock, Sparkles } from 'lucide-react';

export default function ClockController({ currentDate, onAdvance, onReset, loading }) {
  const [customDays, setCustomDays] = useState(1);
  const [auditBanner, setAuditBanner] = useState(null);

  const handleAdvanceClick = async (days) => {
    try {
      const result = await onAdvance(days);
      if (result && result.audit) {
        const engineCount = result.audit.engine?.messagesDispatched || 0;
        const escCount = result.audit.escalations?.length || 0;
        setAuditBanner(`Advanced ${days} day(s) to ${result.currentDate}. Dispatched ${engineCount} WhatsApp message(s), ${escCount} manager escalation(s).`);
        setTimeout(() => setAuditBanner(null), 6000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 px-4 py-3 shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Simulated Date Display */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 flex items-center justify-center">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <span>Simulated Date (Fake Clock)</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-300">
              {currentDate || 'Loading...'}
            </div>
          </div>
        </div>

        {/* Fast-forward Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <FastForward className="w-3.5 h-3.5" /> Fast-Forward:
          </span>
          <button
            onClick={() => handleAdvanceClick(1)}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition shadow-sm disabled:opacity-50"
          >
            +1 Day
          </button>
          <button
            onClick={() => handleAdvanceClick(3)}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition shadow-sm disabled:opacity-50"
          >
            +3 Days (Soft)
          </button>
          <button
            onClick={() => handleAdvanceClick(7)}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition shadow-sm disabled:opacity-50"
          >
            +7 Days (Firm Case)
          </button>
          <button
            onClick={() => handleAdvanceClick(15)}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-md transition shadow-sm disabled:opacity-50"
          >
            +15 Days (Final Notice)
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            disabled={loading}
            title="Reset database to baseline seed state"
            className="ml-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 rounded-md transition disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Seed
          </button>
        </div>
      </div>

      {/* Live notification pill */}
      {auditBanner && (
        <div className="mt-2 text-xs bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 px-3 py-1.5 rounded flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{auditBanner}</span>
          </div>
          <button onClick={() => setAuditBanner(null)} className="text-emerald-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}
    </div>
  );
}

