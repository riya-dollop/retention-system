'use client';

import React, { useState } from 'react';
import { Search, AlertCircle, Ban, CheckCircle2, ChevronRight, X, Filter } from 'lucide-react';

export default function CustomerSelector({ customers, selectedCustomer, onSelectCustomer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'overdue' | 'cases' | 'paid' | 'optout'

  const filtered = customers.filter((c) => {
    // Search match
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.salesperson.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const outstanding = Number(c.total_outstanding || 0);

    if (filterTab === 'overdue') return outstanding > 0 && !c.opt_out;
    if (filterTab === 'cases') return (c.active_cases_count || 0) > 0;
    if (filterTab === 'paid') return outstanding <= 0 && !c.opt_out;
    if (filterTab === 'optout') return c.opt_out;

    return true;
  });

 

  const overdueCount = customers.filter((c) => Number(c.total_outstanding || 0) > 0 && !c.opt_out).length;
  const casesCount = customers.filter((c) => (c.active_cases_count || 0) > 0).length;

  return (
    <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm flex-shrink-0">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search retailer, phone, or rep..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white placeholder:text-slate-400 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] scrollbar-none">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setFilterTab('overdue')}
            className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition ${
              filterTab === 'overdue'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Overdue ({overdueCount})
          </button>
          <button
            onClick={() => setFilterTab('cases')}
            className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition ${
              filterTab === 'cases'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Cases ({casesCount})
          </button>
          <button
            onClick={() => setFilterTab('paid')}
            className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition ${
              filterTab === 'paid'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Paid
          </button>
        </div>
      </div>

      {/* Retailers List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-1">
            <Filter className="w-5 h-5 text-slate-300" />
            <p>No retailers match this filter</p>
          </div>
        ) : (
          filtered.map((customer) => {
            const isSelected = selectedCustomer?.id === customer.id;
            const outstanding = Number(customer.total_outstanding || 0);
            const hasOverdue = outstanding > 0;

            return (
              <div
                key={customer.id}
                onClick={() => onSelectCustomer(customer)}
                className={`p-3 cursor-pointer transition flex items-center justify-between hover:bg-slate-50 relative ${
                  isSelected ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600 shadow-sm' : ''
                }`}
              >
                <div className="flex items-start space-x-2.5 flex-1 min-w-0 pr-2">
                  {/* Initials Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {customer.name.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {customer.name}
                      </span>
                      {customer.opt_out && (
                        <span
                          className="flex items-center gap-0.5 px-1 py-0.2 text-[9px] bg-red-100 text-red-700 rounded font-bold"
                          title="Opted out via STOP"
                        >
                          <Ban className="w-2.5 h-2.5" /> STOP
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                      <span>{customer.phone}</span>
                      <span>•</span>
                      <span className="text-slate-400">Rep: {customer.salesperson}</span>
                    </div>

                    {/* Balance & status */}
                    <div className="mt-1 flex items-center gap-2">
                      {hasOverdue ? (
                        <span className="text-[11px] font-bold text-rose-600">
                          ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })} due
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-600 flex items-center gap-0.5 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> All Paid
                        </span>
                      )}

                      {customer.active_cases_count > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                          <AlertCircle className="w-2.5 h-2.5" /> {customer.active_cases_count} Case
                        </span>
                      )}

                      {customer.promise_date && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-medium">
                          Promised {String(customer.promise_date).substring(0, 10)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 text-slate-300 transition ${isSelected ? 'text-emerald-600 transform translate-x-0.5' : ''}`} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
