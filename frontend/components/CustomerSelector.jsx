'use client';

import React, { useState } from 'react';
import { Search, AlertCircle, Ban, CheckCircle2, ChevronRight, User } from 'lucide-react';

export default function CustomerSelector({ customers, selectedCustomer, onSelectCustomer }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.salesperson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'gold':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'silver':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      case 'bronze':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-200 bg-slate-50">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search retailer, phone, or rep..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
      </div>

      {/* Retailers List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">No retailers found</div>
        ) : (
          filtered.map((customer) => {
            const isSelected = selectedCustomer?.id === customer.id;
            const outstanding = Number(customer.total_outstanding || 0);
            const hasOverdue = outstanding > 0;

            return (
              <div
                key={customer.id}
                onClick={() => onSelectCustomer(customer)}
                className={`p-3 cursor-pointer transition flex items-center justify-between hover:bg-slate-50 ${
                  isSelected ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600' : ''
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-semibold text-xs text-slate-900 truncate">
                      {customer.name}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded border font-medium uppercase ${getTierColor(customer.tier)}`}>
                      {customer.tier}
                    </span>
                    {customer.opt_out && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] bg-red-100 text-red-700 rounded font-semibold" title="Opted out via STOP">
                        <Ban className="w-2.5 h-2.5" /> STOP
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>{customer.phone}</span>
                    <span>•</span>
                    <span className="text-slate-400">Rep: {customer.salesperson}</span>
                  </div>

                  {/* Overdue and case badges */}
                  <div className="mt-1 flex items-center gap-2">
                    {hasOverdue ? (
                      <span className="text-[11px] font-semibold text-rose-600">
                        ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })} due
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-0.5 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> All Paid
                      </span>
                    )}

                    {customer.active_cases_count > 0 && (
                      <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                        <AlertCircle className="w-2.5 h-2.5" /> {customer.active_cases_count} Case
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 text-slate-300 ${isSelected ? 'text-emerald-600' : ''}`} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
