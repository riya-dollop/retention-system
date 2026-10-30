'use client';

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Clock, CheckCircle2, History, ChevronRight } from 'lucide-react';

export default function CaseTable({ cases, onSelectCaseTimeline, onUpdateCaseStatus }) {
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = cases.filter((c) => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'escalated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            <ShieldAlert className="w-3 h-3 text-rose-600" /> Escalated (Manager)
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Open
          </span>
        );
      case 'waiting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" /> Waiting (Promise)
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Resolved
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  const getCaseTypeLabel = (type) => {
    switch (type) {
      case 'firm_followup':
        return 'Firm Follow-up (+7d)';
      case 'dispute':
        return 'Customer Dispute';
      case 'promise_to_pay':
        return 'Promise to Pay';
      case 'reorder_dropoff':
        return 'Reorder Churn Drop-off';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Filter Tabs */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Cases & Escalation Log</h2>
          <p className="text-xs text-slate-500">
            Automated tracking of firm follow-ups, disputes, promise-to-pay pauses, and manager escalations.
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg text-xs">
          {['all', 'open', 'escalated', 'waiting', 'resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-md font-semibold capitalize transition ${
                filterStatus === s
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-600 uppercase font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Case #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Invoice / Balance</th>
              <th className="py-3 px-4">Case Trigger</th>
              <th className="py-3 px-4">Owner</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Opened Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-slate-400">
                  No cases found for filter &quot;{filterStatus}&quot;.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const balance = Number(c.invoice_balance || 0);

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      #{c.id}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>{c.customer_name}</div>
                      <div className="text-[10px] text-slate-400">{c.customer_phone}</div>
                    </td>

                    <td className="py-3 px-4">
                      {c.invoice_no ? (
                        <div>
                          <span className="font-mono text-slate-700">{c.invoice_no}</span>
                          <div className="font-bold text-rose-600 font-mono">
                            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700">
                      {getCaseTypeLabel(c.case_type)}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {c.owner}
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(c.status)}
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {String(c.opened_date).substring(0, 10)}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => onSelectCaseTimeline(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition border border-slate-200"
                      >
                        <History className="w-3 h-3" /> Timeline
                      </button>

                      {c.status !== 'resolved' && (
                        <button
                          onClick={() => onUpdateCaseStatus(c.id, 'resolved', 'Resolved manually by staff')}
                          className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition border border-emerald-200"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

