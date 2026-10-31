'use client';

import React, { useState } from 'react';
import { Send, CheckCircle, Calendar, AlertTriangle, Ban, ThumbsUp, Sparkles } from 'lucide-react';

export default function QuickReplyBar({ customer, onSendReply, loading }) {
  const [inputText, setInputText] = useState('');

  if (!customer) return null;

  const handleSend = (textToSend?: string) => {
    let text = (textToSend || inputText).trim();
    if (!text) return;

    // First letter capital and rest formatted (e.g. Paid, Promise 2026-11-05, Dispute, Stop, Yes)
    const upper = text.toUpperCase();
    if (upper === 'PAID') {
      text = 'Paid';
    } else if (upper.startsWith('PROMISE')) {
      text = 'Promise' + text.substring(7);
    } else if (upper.startsWith('DISPUTE')) {
      text = 'Dispute' + text.substring(7);
    } else if (upper === 'STOP') {
      text = 'Stop';
    } else if (upper === 'YES') {
      text = 'Yes';
    } else {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }

    onSendReply(text);
    setInputText('');
  };

  return (
    <div className="bg-white border-t border-slate-200/90 p-2.5 sm:p-3 space-y-2 z-10 shadow-sm">
      {/* Simulation Quick Reply Action Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-nowrap sm:flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mr-1 flex items-center gap-1 whitespace-nowrap">
          Quick Reply Chips:
        </span>

        {/* 1. Paid */}
        <button
          onClick={() => handleSend('Paid')}
          disabled={loading}
          title="Simulate customer stating payment has been transferred"
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full transition active:scale-95 shadow-2xs whitespace-nowrap tracking-wide"
        >
          <CheckCircle className="w-3 h-3 text-emerald-600" /> Paid
        </button>

        {/* 2. Promise */}
        <button
          onClick={() => handleSend('Promise 2026-11-05')}
          disabled={loading}
          title="Simulate customer promising payment on 2026-11-05 (Pauses follow-ups until date)"
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-full transition active:scale-95 shadow-2xs whitespace-nowrap tracking-wide"
        >
          <Calendar className="w-3 h-3 text-blue-600" /> Promise 2026-11-05
        </button>

        {/* 3. Dispute */}
        <button
          onClick={() => handleSend('Dispute Damaged shipment in batch')}
          disabled={loading}
          title="Simulate customer disputing the order (Halts outreach & opens sales rep case)"
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-full transition active:scale-95 shadow-2xs whitespace-nowrap tracking-wide"
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" /> Dispute
        </button>

        {/* 4. Stop */}
        <button
          onClick={() => handleSend('Stop')}
          disabled={loading}
          title="Simulate WhatsApp opt-out (Zero subsequent messages + sales rep alert)"
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-full transition active:scale-95 shadow-2xs whitespace-nowrap tracking-wide"
        >
          <Ban className="w-3 h-3 text-rose-600" /> Stop (Opt-Out)
        </button>

        {/* 5. Yes */}
        <button
          onClick={() => handleSend('Yes')}
          disabled={loading}
          title="Simulate approving predictive restock reorder draft"
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-full transition active:scale-95 shadow-2xs whitespace-nowrap tracking-wide"
        >
          <ThumbsUp className="w-3 h-3 text-purple-600" /> Yes (Reorder)
        </button>
      </div>

      {/* Free-form reply input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          placeholder={`Type a mock WhatsApp reply as ${customer.name} (e.g. "Will pay tomorrow", "PAID", "DISPUTE")...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#008069] bg-slate-50 focus:bg-white placeholder:text-slate-400 transition"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="bg-[#008069] hover:bg-[#075E54] active:scale-95 text-white px-4 py-2 rounded-xl transition disabled:opacity-50 shadow-md flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
