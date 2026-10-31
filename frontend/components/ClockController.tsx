'use client';

import React, { useState } from 'react';
import { Calendar, FastForward, RotateCcw, Clock, Sparkles, HelpCircle, Check, ArrowRight } from 'lucide-react';

export default function ClockController({
  currentDate,
  onAdvance,
  onReset,
  loading,
  onSelectScenario,
}: {
  currentDate: string;
  onAdvance: (days: number) => Promise<any>;
  onReset: () => void;
  loading: boolean;
  onSelectScenario?: (id: number) => void;
}) {
  const [customDays, setCustomDays] = useState(1);
  const [auditBanner, setAuditBanner] = useState(null);
  const [showScenarioHelp, setShowScenarioHelp] = useState(false);

  const handleAdvanceClick = async (days) => {
    try {
      const result = await onAdvance(days);
      if (result && result.audit) {
        const engineCount = result.audit.engine?.messagesDispatched || 0;
        const escCount = result.audit.escalations?.length || 0;
        setAuditBanner(
          `Fast-forwarded ${days} day(s) → ${result.currentDate}. Dispatched ${engineCount} WhatsApp message(s), ${escCount} manager escalation(s).`
        );
        setTimeout(() => setAuditBanner(null), 6000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const scenarios = [
    { id: 1, title: 'Scenario 1: Early Pay', desc: 'Pay INV-1004 (Metro Mart) before due date -> No reminder sent.' },
    { id: 2, title: 'Scenario 2: 40% Partial', desc: 'Pay 40% of INV-1006 (Royal Supermarket) on Day +3 -> Next reminder shows ₹36,000.' },
    { id: 3, title: 'Scenario 3: PROMISE Pause', desc: 'FreshCorner replies PROMISE 2026-11-05 -> Outreach halts until date.' },
    { id: 4, title: 'Scenario 4: DISPUTE', desc: 'Bharat Provisions replies DISPUTE -> Collections pause & case opens.' },
    { id: 5, title: 'Scenario 5: STOP Opt-out', desc: 'Modern Essentials replies STOP -> Zero messages & sales alerted.' },
    { id: 6, title: 'Scenario 6: 3 Overdue Bills', desc: 'Advance 1 day for Apex Retailers -> 1 combined message, not 3.' },
  ];

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 px-4 py-2.5 shadow-md sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Simulated Date Display */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/25 flex items-center justify-center shadow-inner">
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <span>Simulated Clock</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-lg font-bold font-mono text-emerald-300 tracking-tight">
              {currentDate || 'Loading...'}
            </div>
          </div>
        </div>

        {/* Fast-forward Controls */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          <span className="text-[11px] text-slate-400 font-medium mr-1 hidden lg:flex items-center gap-1">
            <FastForward className="w-3 h-3 text-slate-400" /> Advance:
          </span>

          <button
            onClick={() => handleAdvanceClick(1)}
            disabled={loading}
            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition active:scale-95 disabled:opacity-50"
            title="Advance simulated clock by 1 day"
          >
            +1 Day
          </button>

          <button
            onClick={() => handleAdvanceClick(3)}
            disabled={loading}
            className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition active:scale-95 disabled:opacity-50"
            title="Advance simulated clock by 3 days (Soft Follow-up trigger)"
          >
            +3 Days <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(Soft)</span>
          </button>

          <button
            onClick={() => handleAdvanceClick(7)}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition active:scale-95 shadow-sm shadow-indigo-900/30 disabled:opacity-50 flex items-center gap-1"
            title="Advance simulated clock by 7 days (Firm Follow-up + Case creation)"
          >
            <span>+7 Days</span>
            <span className="text-[10px] bg-indigo-700/80 px-1 rounded font-normal hidden sm:inline">Firm Case</span>
          </button>

          <button
            onClick={() => handleAdvanceClick(15)}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition active:scale-95 shadow-sm shadow-rose-900/30 disabled:opacity-50 flex items-center gap-1"
            title="Advance simulated clock by 15 days (Final Notice + GM Escalation)"
          >
            <span>+15 Days</span>
            <span className="text-[10px] bg-rose-700/80 px-1 rounded font-normal hidden sm:inline">GM Notice</span>
          </button>

          {/* Scenario Helper Toggle */}
          <button
            onClick={() => setShowScenarioHelp(!showScenarioHelp)}
            className={`p-1.5 text-xs font-semibold rounded-lg border transition ${
              showScenarioHelp
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
            }`}
            title="Show 6 Demo Scenarios Quick Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            disabled={loading}
            title="Reset database to baseline seed state (2026-10-20)"
            className="ml-1 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg transition active:scale-95 disabled:opacity-50"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset Seed</span>
          </button>
        </div>
      </div>

      {/* Scenario Quick Guide Dropdown */}
      {showScenarioHelp && (
        <div className="mt-3 p-3 bg-slate-950/90 border border-slate-700 rounded-xl animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 6 Mandatory Reviewer Scenarios Guide
            </span>
            <button
              onClick={() => setShowScenarioHelp(false)}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Close ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {scenarios.map((s) => (
              <div
                key={s.id}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-[11px] hover:border-slate-700 transition"
              >
                <div className="font-semibold text-emerald-400 mb-0.5">{s.title}</div>
                <div className="text-slate-400 leading-snug">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live notification pill */}
      {auditBanner && (
        <div className="mt-2 text-xs bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 px-3 py-1.5 rounded-lg flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>{auditBanner}</span>
          </div>
          <button
            onClick={() => setAuditBanner(null)}
            className="text-emerald-400 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
