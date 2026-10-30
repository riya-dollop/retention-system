'use client';

import React, { useState } from 'react';
import { Send, CheckCircle, Calendar, AlertTriangle, Ban, ThumbsUp } from 'lucide-react';

export default function QuickReplyBar({ customer, onSendReply, loading }) {
  const [inputText, setInputText] = useState('');

  if (!customer) return null;

  const handleSend = (textToSend) => {
    const text = textToSend || inputText;
    if (!text || !text.trim()) return;
    onSendReply(text.trim());
    setInputText('');
  };

  const getNextWeekDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white border-t border-slate-200 p-3 space-y-2 z-10">
      {/* Simulation Quick Reply Action Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-slate-400 font-medium mr-1">Simulate Reply:</span>

        <button
          onClick={() => handleSend('PAID')}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-full transition"
        >
          <CheckCircle className="w-3 h-3 text-emerald-600" /> PAID
        </button>

        <button
          onClick={() => handleSend(`PROMISE 2026-11-05`)}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-full transition"
        >
          <Calendar className="w-3 h-3 text-blue-600" /> PROMISE 2026-11-05
        </button>

        <button
          onClick={() => handleSend('DISPUTE Damaged shipment in batch')}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-full transition"
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" /> DISPUTE
        </button>

        <button
          onClick={() => handleSend('STOP')}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-full transition"
        >
          <Ban className="w-3 h-3 text-rose-600" /> STOP
        </button>

        <button
          onClick={() => handleSend('YES')}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-full transition"
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
          placeholder={`Type a mock WhatsApp reply as ${customer.name}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="bg-[#008069] hover:bg-[#075E54] text-white p-2 rounded-lg transition disabled:opacity-50 shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
