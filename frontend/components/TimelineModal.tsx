'use client';

import React, { useState } from 'react';
import { X, History, PlusCircle, ShieldAlert, CheckCircle2, UserCheck, MessageSquare, Send } from 'lucide-react';

export default function TimelineModal({ selectedCase, isOpen, onClose, onAddNote }) {
  const [newNote, setNewNote] = useState('');

  if (!isOpen || !selectedCase) return null;

  let timeline = selectedCase.timeline || [];
  if (typeof timeline === 'string') {
    try {
      timeline = JSON.parse(timeline);
    } catch {
      timeline = [];
    }
  }

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(selectedCase.id, newNote.trim());
    setNewNote('');
  };

  const getEventBadge = (event) => {
    switch (event) {
      case 'escalated':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
            <ShieldAlert className="w-3 h-3 text-rose-600" /> Escalated to GM
          </span>
        );
      case 'resolved':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Resolved
          </span>
        );
      case 'created':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300">
            <PlusCircle className="w-3 h-3 text-blue-600" /> Case Opened
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300">
            <MessageSquare className="w-3 h-3 text-slate-500" /> Note Added
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                Case #{selectedCase.id} Audit Timeline
              </h3>
              <p className="text-[11px] text-slate-400">
                {selectedCase.customer_name} • Current Owner: <span className="text-white font-semibold">{selectedCase.owner}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Events List */}
        <div className="p-5 max-h-[380px] overflow-y-auto space-y-4">
          {timeline.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-8">No timeline audit events recorded yet.</div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-3.5 space-y-5">
              {timeline.map((item, idx) => (
                <div key={idx} className="relative pl-6">
                  {/* Timeline dot */}
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/90 p-3 rounded-xl text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      {getEventBadge(item.event)}
                      <span className="font-mono text-[10px] text-slate-400 font-semibold">{item.date}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed font-medium">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add note form */}
        <form onSubmit={handleAddNote} className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
          <input
            type="text"
            placeholder="Add internal staff follow-up note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <button
            type="submit"
            disabled={!newNote.trim()}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
        </form>
      </div>
    </div>
  );
}
