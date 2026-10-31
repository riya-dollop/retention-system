'use client';

import React, { useState, useMemo } from 'react';
import { History } from 'lucide-react';
import DataTable, { Column } from './DataTable';

interface CaseRecord {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  invoice_id?: number;
  invoice_no?: string;
  invoice_balance?: number | string;
  case_type: string;
  status: 'open' | 'waiting' | 'resolved' | 'escalated' | string;
  owner: string;
  opened_date: string;
  updated_date?: string;
  timeline?: any[];
}

interface CaseTableProps {
  cases: CaseRecord[];
  loading?: boolean;
  onSelectCaseTimeline: (c: CaseRecord) => void;
  onUpdateCaseStatus: (caseId: number, status: string, note?: string) => void;
}

export default function CaseTable({
  cases,
  loading = false,
  onSelectCaseTimeline,
  onUpdateCaseStatus,
}: CaseTableProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const counts = useMemo(
    () => ({
      all: cases.length,
      escalated: cases.filter((c) => c.status === 'escalated').length,
      open: cases.filter((c) => c.status === 'open').length,
      waiting: cases.filter((c) => c.status === 'waiting').length,
      resolved: cases.filter((c) => c.status === 'resolved').length,
    }),
    [cases]
  );

  const filteredCases = useMemo(() => {
    if (filterStatus === 'all') return cases;
    return cases.filter((c) => c.status === filterStatus);
  }, [cases, filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'escalated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse shadow-2xs">
            Escalated (GM)
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            Open (Rep)
          </span>
        );
      case 'waiting':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Waiting (Promise)
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            Resolved
          </span>
        );
      default:
        return <span className="text-xs text-slate-500 font-medium">{status}</span>;
    }
  };

  const getCaseTypeLabel = (type: string) => {
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

  const columns: Column<CaseRecord>[] = [
    {
      key: 'id',
      header: 'Case #',
      className: 'font-mono font-bold text-slate-800 whitespace-nowrap',
      render: (c) => `#${c.id}`,
    },
    {
      key: 'customer_name',
      header: 'Retailer',
      render: (c) => (
        <div className="min-w-[130px]">
          <div className="font-bold text-xs text-slate-900">{c.customer_name}</div>
          <div className="text-[10px] text-slate-400 font-mono">{c.customer_phone || '—'}</div>
        </div>
      ),
    },
    {
      key: 'invoice_no',
      header: 'Invoice / Balance',
      render: (c) => {
        const balance = Number(c.invoice_balance || 0);
        return c.invoice_no ? (
          <div className="min-w-[110px]">
            <span className="font-mono text-slate-700 font-semibold">{c.invoice_no}</span>
            <div className="font-bold text-rose-600 font-mono">
              ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        );
      },
    },
    {
      key: 'case_type',
      header: 'Case Trigger',
      render: (c) => (
        <span className="text-xs text-slate-700 font-medium whitespace-nowrap">
          {getCaseTypeLabel(c.case_type)}
        </span>
      ),
    },
    {
      key: 'owner',
      header: 'Current Owner',
      render: (c) => (
        <span
          className={
            c.owner?.includes('General Manager')
              ? 'text-rose-700 font-extrabold whitespace-nowrap'
              : 'text-slate-800 font-semibold whitespace-nowrap'
          }
        >
          {c.owner}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => getStatusBadge(c.status),
    },
    {
      key: 'opened_date',
      header: 'Opened Date',
      className: 'font-mono text-slate-500 whitespace-nowrap',
      render: (c) => String(c.opened_date).substring(0, 10),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right whitespace-nowrap',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onSelectCaseTimeline(c)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg transition border border-slate-300 shadow-2xs active:scale-95"
            title="View audit timeline of case events"
          >
            <History className="w-3 h-3 text-indigo-600" />
            <span>Timeline</span>
          </button>

          {c.status !== 'resolved' ? (
            <button
              onClick={() => onUpdateCaseStatus(c.id, 'resolved', 'Resolved manually by staff')}
              className="w-[66px] text-center px-2 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition border border-emerald-300 shadow-2xs active:scale-95"
              title="Mark case as resolved"
            >
              Resolve
            </button>
          ) : (
            <div className="w-[66px]" aria-hidden="true" />
          )}
        </div>
      ),
    },
  ];

  const filterTabs = (
    <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs overflow-x-auto scrollbar-none">
      <button
        onClick={() => setFilterStatus('all')}
        className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
          filterStatus === 'all'
            ? 'bg-white text-slate-900 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        All ({counts.all})
      </button>
      <button
        onClick={() => setFilterStatus('escalated')}
        className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 whitespace-nowrap ${
          filterStatus === 'escalated'
            ? 'bg-rose-600 text-white shadow-xs'
            : 'text-rose-700 hover:bg-rose-100'
        }`}
      >
        Escalated ({counts.escalated})
      </button>
      <button
        onClick={() => setFilterStatus('open')}
        className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
          filterStatus === 'open'
            ? 'bg-amber-600 text-white shadow-xs'
            : 'text-amber-800 hover:bg-amber-100'
        }`}
      >
        Open ({counts.open})
      </button>
      <button
        onClick={() => setFilterStatus('waiting')}
        className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
          filterStatus === 'waiting'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-blue-800 hover:bg-blue-100'
        }`}
      >
        Waiting ({counts.waiting})
      </button>
      <button
        onClick={() => setFilterStatus('resolved')}
        className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
          filterStatus === 'resolved'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-emerald-800 hover:bg-emerald-100'
        }`}
      >
        Resolved ({counts.resolved})
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <DataTable<CaseRecord>
        columns={columns}
        data={filteredCases}
        loading={loading}
        searchPlaceholder="Search case #, retailer, rep, invoice..."
        searchKeys={['id', 'customer_name', 'customer_phone', 'invoice_no', 'case_type', 'owner', 'status']}
        initialPageSize={5}
        fixedHeightClass="h-[300px] sm:h-[340px]"
        emptyTitle="No cases match your filter"
        emptySubtitle="All cases are either resolved or try clearing search filters."
        extraHeaderActions={filterTabs}
        rowKey={(c) => c.id}
      />
    </div>
  );
}
