'use client';

import React, { useState } from 'react';
import { X, History, PlusCircle, ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';

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

  const getEventIcon = (event) => {
    if (event === 'escalated') return <ShieldAlert className="w-4 h-4 text-rose-600" />;
    if (event === 'resolved') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (event === 'created') return <PlusCircle className="w-4 h-4 text-blue-600" />;
    return <UserCheck className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-semibold text-sm">
                Case #{selectedCase.id} Timeline Audit
              </h3>
              <p className="text-[11px] text-slate-400">
                {selectedCase.customer_name} • {selectedCase.owner}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Events List */}
        <div className="p-5 max-h-[350px] overflow-y-auto space-y-4">
          {timeline.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-6">No timeline events recorded yet.</div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-4">
              {timeline.map((item, idx) => (
                <div key={idx} className="relative pl-6">
                  {/* Timeline dot */}
                  <div className="absolute -left-2.5 top-0.5 bg-white p-0.5 rounded-full border border-slate-300">
                    {getEventIcon(item.event)}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 mb-1">
                      <span className="font-bold uppercase text-slate-700">{item.event}</span>
                      <span>{item.date}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{item.note}</p>
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
            placeholder="Add internal staff note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <button
            type="submit"
            disabled={!newNote.trim()}
            className="px-3 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50"
          >
            Add Note
          </button>
        </form>
      </div>
    </div>
  );
}
