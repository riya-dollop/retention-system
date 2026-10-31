'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, Clock, AlertOctagon, TrendingUp } from 'lucide-react';

export default function AgingBucketWidget({ customers, currentDate }) {
  if (!customers || !currentDate) return null;

  // Compute aging buckets from all customer invoices
  let bucket0to3 = { amount: 0, count: 0 };
  let bucket4to7 = { amount: 0, count: 0 };
  let bucket8to14 = { amount: 0, count: 0 };
  let bucket15plus = { amount: 0, count: 0 };

  const currentD = new Date(`${currentDate}T00:00:00Z`);

  customers.forEach((cust) => {
    (cust.invoices || []).forEach((inv) => {
      const balance = Number(inv.amount) - Number(inv.paid_amount);
      if (inv.status !== 'paid' && balance > 0) {
        const dueD = new Date(String(inv.due_date).substring(0, 10) + 'T00:00:00Z');
        const diffDays = Math.floor((currentD.getTime() - dueD.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 3) {
          bucket0to3.amount += balance;
          bucket0to3.count += 1;
        } else if (diffDays <= 7) {
          bucket4to7.amount += balance;
          bucket4to7.count += 1;
        } else if (diffDays <= 14) {
          bucket8to14.amount += balance;
          bucket8to14.count += 1;
        } else {
          bucket15plus.amount += balance;
          bucket15plus.count += 1;
        }
      }
    });
  });

  const totalOverdue = bucket0to3.amount + bucket4to7.amount + bucket8to14.amount + bucket15plus.amount;

  const pct0to3 = totalOverdue > 0 ? (bucket0to3.amount / totalOverdue) * 100 : 0;
  const pct4to7 = totalOverdue > 0 ? (bucket4to7.amount / totalOverdue) * 100 : 0;
  const pct8to14 = totalOverdue > 0 ? (bucket8to14.amount / totalOverdue) * 100 : 0;
  const pct15plus = totalOverdue > 0 ? (bucket15plus.amount / totalOverdue) * 100 : 0;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Accounts Receivable Aging Analysis</span>
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-medium">
              4 Time Buckets
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Stage-based exposure breakdown across all wholesale retail merchant accounts
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block font-medium">Total Overdue Receivables</span>
          <span className="text-lg font-mono font-extrabold text-slate-900">
            ₹{totalOverdue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Visual Stacked Progress Bar */}
      {totalOverdue > 0 && (
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${pct0to3}%` }}
              className="bg-blue-500 hover:opacity-90 transition-all"
              title={`0-3 Days: ${pct0to3.toFixed(1)}%`}
            />
            <div
              style={{ width: `${pct4to7}%` }}
              className="bg-amber-500 hover:opacity-90 transition-all"
              title={`4-7 Days: ${pct4to7.toFixed(1)}%`}
            />
            <div
              style={{ width: `${pct8to14}%` }}
              className="bg-orange-500 hover:opacity-90 transition-all"
              title={`8-14 Days: ${pct8to14.toFixed(1)}%`}
            />
            <div
              style={{ width: `${pct15plus}%` }}
              className="bg-rose-500 hover:opacity-90 transition-all"
              title={`15+ Days: ${pct15plus.toFixed(1)}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
            <span className="text-blue-600 font-semibold">0-3d ({pct0to3.toFixed(0)}%)</span>
            <span className="text-amber-600 font-semibold">4-7d ({pct4to7.toFixed(0)}%)</span>
            <span className="text-orange-600 font-semibold">8-14d ({pct8to14.toFixed(0)}%)</span>
            <span className="text-rose-600 font-semibold">15+d ({pct15plus.toFixed(0)}%)</span>
          </div>
        </div>
      )}

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Bucket 1: 0-3 Days */}
        <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl hover:shadow-xs transition">
          <div className="flex items-center justify-between text-blue-700 text-xs font-bold mb-1.5">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> 0–3 Days
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
              {bucket0to3.count} inv
            </span>
          </div>
          <div className="text-base font-extrabold text-slate-900 font-mono">
            ₹{bucket0to3.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Soft follow-up reminders</p>
        </div>

        {/* Bucket 2: 4-7 Days */}
        <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl hover:shadow-xs transition">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold mb-1.5">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> 4–7 Days
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
              {bucket4to7.count} inv
            </span>
          </div>
          <div className="text-base font-extrabold text-slate-900 font-mono">
            ₹{bucket4to7.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Sales Rep Escalation window</p>
        </div>

        {/* Bucket 3: 8-14 Days */}
        <div className="p-3.5 bg-orange-50/60 border border-orange-200/80 rounded-xl hover:shadow-xs transition">
          <div className="flex items-center justify-between text-orange-700 text-xs font-bold mb-1.5">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-600" /> 8–14 Days
            </span>
            <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold">
              {bucket8to14.count} inv
            </span>
          </div>
          <div className="text-base font-extrabold text-slate-900 font-mono">
            ₹{bucket8to14.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Firm notice & Case opened</p>
        </div>

        {/* Bucket 4: 15+ Days */}
        <div className="p-3.5 bg-rose-50/60 border border-rose-200/80 rounded-xl hover:shadow-xs transition">
          <div className="flex items-center justify-between text-rose-700 text-xs font-bold mb-1.5">
            <span className="flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> 15+ Days
            </span>
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
              {bucket15plus.count} inv
            </span>
          </div>
          <div className="text-base font-extrabold text-slate-900 font-mono text-rose-600">
            ₹{bucket15plus.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Final Warning • GM Escalated</p>
        </div>
      </div>
    </div>
  );
}
