'use client';

import React, { useState } from 'react';
import { Send, CheckCircle, Calendar, AlertTriangle, Ban, ThumbsUp, Sparkles } from 'lucide-react';

export default function QuickReplyBar({ customer, onSendReply, loading }) {
  const [inputText, setInputText] = useState('');

  if (!customer) return null;

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text || !text.trim()) return;
    onSendReply(text.trim());
    setInputText('');
  };

  return (
    <div className="bg-white border-t border-slate-200/90 p-3 space-y-2 z-10 shadow-sm">
      {/* Simulation Quick Reply Action Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Quick Simulation Chips:
        </span>

        {/* 1. PAID */}
        <button
          onClick={() => handleSend('PAID')}
          disabled={loading}
          title="Simulate customer stating payment has been transferred"
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-full transition active:scale-95 shadow-2xs"
        >
          <CheckCircle className="w-3 h-3 text-emerald-600" /> PAID
        </button>

        {/* 2. PROMISE */}
        <button
          onClick={() => handleSend('PROMISE 2026-11-05')}
          disabled={loading}
          title="Simulate customer promising payment on 2026-11-05 (Pauses follow-ups until date)"
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 rounded-full transition active:scale-95 shadow-2xs"
        >
          <Calendar className="w-3 h-3 text-blue-600" /> PROMISE 2026-11-05
        </button>

        {/* 3. DISPUTE */}
        <button
          onClick={() => handleSend('DISPUTE Damaged shipment in batch')}
          disabled={loading}
          title="Simulate customer disputing the order (Halts outreach & opens sales rep case)"
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 rounded-full transition active:scale-95 shadow-2xs"
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" /> DISPUTE
        </button>

        {/* 4. STOP */}
        <button
          onClick={() => handleSend('STOP')}
          disabled={loading}
          title="Simulate WhatsApp opt-out (Zero subsequent messages + sales rep alert)"
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-full transition active:scale-95 shadow-2xs"
        >
          <Ban className="w-3 h-3 text-rose-600" /> STOP (Opt-Out)
        </button>

        {/* 5. YES */}
        <button
          onClick={() => handleSend('YES')}
          disabled={loading}
          title="Simulate approving predictive restock reorder draft"
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-300 rounded-full transition active:scale-95 shadow-2xs"
        >
          <ThumbsUp className="w-3 h-3 text-purple-600" /> YES (Reorder)
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
