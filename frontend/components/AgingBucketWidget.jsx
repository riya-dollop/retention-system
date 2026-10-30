'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

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

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Receivables Aging Analysis (Bonus Feature)
        </h3>
        <span className="text-xs font-mono font-bold text-slate-900">
          Total Overdue: ₹{totalOverdue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Bucket 1: 0-3 Days */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 0–3 Days
            </span>
            <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded font-bold">
              {bucket0to3.count} inv
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 font-mono">
            ₹{bucket0to3.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Soft Follow-up Stage</p>
        </div>

        {/* Bucket 2: 4-7 Days */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold mb-1">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> 4–7 Days
            </span>
            <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded font-bold">
              {bucket4to7.count} inv
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 font-mono">
            ₹{bucket4to7.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Rep Escalation Window</p>
        </div>

        {/* Bucket 3: 8-14 Days */}
        <div className="p-3 bg-orange-50/70 border border-orange-200/80 rounded-lg">
          <div className="flex items-center justify-between text-orange-700 text-xs font-semibold mb-1">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> 8–14 Days
            </span>
            <span className="text-[10px] bg-orange-200 text-orange-800 px-1.5 py-0.2 rounded font-bold">
              {bucket8to14.count} inv
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 font-mono">
            ₹{bucket8to14.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Firm Follow-up Cases</p>
        </div>

        {/* Bucket 4: 15+ Days */}
        <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-lg">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold mb-1">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> 15+ Days
            </span>
            <span className="text-[10px] bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded font-bold">
              {bucket15plus.count} inv
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 font-mono">
            ₹{bucket15plus.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-rose-600 font-medium mt-1">Manager Escalation / Suspend</p>
        </div>
      </div>
    </div>
  );
}
