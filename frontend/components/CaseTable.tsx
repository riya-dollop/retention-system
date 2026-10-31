'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  History,
  Search,
  X,
  ArrowUpRight,
  User,
  FileText
} from 'lucide-react';

export default function CaseTable({ cases, onSelectCaseTimeline, onUpdateCaseStatus }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const counts = {
    all: cases.length,
    escalated: cases.filter((c) => c.status === 'escalated').length,
    open: cases.filter((c) => c.status === 'open').length,
    waiting: cases.filter((c) => c.status === 'waiting').length,
    resolved: cases.filter((c) => c.status === 'resolved').length,
  };

  const filtered = cases.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = c.customer_name?.toLowerCase().includes(term);
      const matchOwner = c.owner?.toLowerCase().includes(term);
      const matchInv = c.invoice_no?.toLowerCase().includes(term);
      const matchType = c.case_type?.toLowerCase().includes(term);
      return matchName || matchOwner || matchInv || matchType;
    }

    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'escalated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Escalated (GM)
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Open (Rep)
          </span>
        );
      case 'waiting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Waiting (Promise)
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Resolved
          </span>
        );
      default:
        return <span className="text-xs text-slate-500 font-medium">{status}</span>;
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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header & Filter Tabs */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Cases & Escalation Log</h2>
          <p className="text-xs text-slate-500">
            Automated tracking of firm follow-ups, customer disputes, promises, and the 2-day GM escalation rule.
          </p>
        </div>

        {/* Search & Status Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search case, customer, rep..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-6 py-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white placeholder:text-slate-400 w-44 sm:w-52"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setFilterStatus('escalated')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                filterStatus === 'escalated'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-100'
              }`}
            >
              Escalated ({counts.escalated})
            </button>
            <button
              onClick={() => setFilterStatus('open')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'open'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 hover:bg-amber-100'
              }`}
            >
              Open ({counts.open})
            </button>
            <button
              onClick={() => setFilterStatus('waiting')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'waiting'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-800 hover:bg-blue-100'
              }`}
            >
              Waiting ({counts.waiting})
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Resolved ({counts.resolved})
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 text-slate-600 uppercase font-bold tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Case #</th>
              <th className="py-3 px-4">Retailer</th>
              <th className="py-3 px-4">Invoice / Balance</th>
              <th className="py-3 px-4">Case Trigger</th>
              <th className="py-3 px-4">Current Owner</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Opened Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                  No cases found matching the criteria.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const balance = Number(c.invoice_balance || 0);

                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition group">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      #{c.id}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="font-bold text-xs">{c.customer_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.customer_phone}</div>
                    </td>

                    <td className="py-3 px-4">
                      {c.invoice_no ? (
                        <div>
                          <span className="font-mono text-slate-700 font-semibold">{c.invoice_no}</span>
                          <div className="font-bold text-rose-600 font-mono">
                            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700">
                      <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                        {getCaseTypeLabel(c.case_type)}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      <span className={c.owner?.includes('General Manager') ? 'text-rose-700 font-extrabold flex items-center gap-1' : 'text-slate-800'}>
                        {c.owner?.includes('General Manager') && <ShieldAlert className="w-3.5 h-3.5 text-rose-600 inline" />}
                        {c.owner}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(c.status)}
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {String(c.opened_date).substring(0, 10)}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => onSelectCaseTimeline(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg transition border border-slate-300 shadow-2xs active:scale-95"
                      >
                        <History className="w-3 h-3 text-indigo-600" />
                        <span>Timeline</span>
                      </button>

                      {c.status !== 'resolved' && (
                        <button
                          onClick={() => onUpdateCaseStatus(c.id, 'resolved', 'Resolved manually by staff')}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition border border-emerald-300 shadow-2xs active:scale-95"
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
