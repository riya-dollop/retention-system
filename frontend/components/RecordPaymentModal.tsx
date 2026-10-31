'use client';

import React, { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle2, Sparkles, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import Dropdown, { DropdownOption } from './Dropdown';

export default function RecordPaymentModal({ customer, isOpen, onClose, onSubmitPayment, loading }) {
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState('');
  const [amount, setAmount] = useState<string | number>('');
  const [message, setMessage] = useState<string | null>(null);
  const [rendered, setRendered] = useState(isOpen);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      const timer = setTimeout(() => setActive(true), 20);
      return () => clearTimeout(timer);
    } else {
      setActive(false);
      const timer = setTimeout(() => setRendered(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!rendered || !customer) return null;

  const unpaidInvoices = (customer.invoices || []).filter((inv) => {
    const balance = Number(inv.amount) - Number(inv.paid_amount);
    return inv.status !== 'paid' && balance > 0;
  });

  const selectedInv = unpaidInvoices.find((i) => i.invoice_no === selectedInvoiceNo);
  const remaining = selectedInv ? Number(selectedInv.amount) - Number(selectedInv.paid_amount) : 0;
  const numAmount = Number(amount) || 0;
  const newBalance = Math.max(0, remaining - numAmount);

  const handleQuickPercent = (pct) => {
    if (!remaining) return;
    const calc = Math.round((remaining * pct) / 100);
    setAmount(calc);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceNo || numAmount <= 0) return;

    try {
      const res = await onSubmitPayment({
        invoice_no: selectedInvoiceNo,
        amount: numAmount,
      });
      toast.success(`Payment recorded! Remaining balance: ₹${res.remainingBalance.toFixed(2)}`);
      setAmount('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit payment');
    }
  };

  const invoiceDropdownOptions: DropdownOption[] = unpaidInvoices.map((inv) => {
    const bal = Number(inv.amount) - Number(inv.paid_amount);
    return {
      value: inv.invoice_no,
      label: inv.invoice_no,
      badge: `₹${bal.toFixed(2)} balance`,
      badgeColor: 'bg-rose-100 text-rose-800',
      sublabel: `Due: ${String(inv.due_date).substring(0, 10)} (Total: ₹${Number(inv.amount).toFixed(2)})`,
    };
  });

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 transition-opacity duration-250 ease-in-out ${
        active ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 flex flex-col relative transform transition-all duration-250 ease-out ${
          active ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'
        }`}
      >
        <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Record Wholesale Payment</h3>
              <p className="text-[11px] text-slate-400">Post full or partial bank/UPI settlement</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Retailer</label>
            <div className="text-xs bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold flex items-center justify-between">
              <span>{customer.name}</span>
              <span className="font-mono text-slate-500 text-[11px]">{customer.phone}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Open Invoice</label>
            {unpaidInvoices.length === 0 ? (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                All invoices for this customer are fully paid!
              </p>
            ) : (
              <Dropdown
                options={invoiceDropdownOptions}
                value={selectedInvoiceNo}
                onChange={(val) => {
                  setSelectedInvoiceNo(val);
                  const inv = unpaidInvoices.find((i) => i.invoice_no === val);
                  if (inv) {
                    setAmount(Number(inv.amount) - Number(inv.paid_amount));
                  }
                }}
                placeholder="-- Choose an overdue or open invoice --"
                searchable={invoiceDropdownOptions.length > 3}
              />
            )}
          </div>

          {selectedInv && (
            <div className="space-y-3">
              {/* Quick Percentage Chips */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Percent className="w-3 h-3" /> Quick Amount Presets:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(100)}
                    className="flex-1 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition"
                  >
                    100% Full
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(50)}
                    className="flex-1 py-1 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 rounded-lg transition"
                  >
                    50% Half
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(40)}
                    className="flex-1 py-1 text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300 rounded-lg transition"
                    title="Scenario 2: Pay 40% on Day +3"
                  >
                    40% (Scen. 2)
                  </button>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={remaining}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full text-sm font-mono font-bold p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                  required
                />
              </div>

              {/* Live Balance Calculation Box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Current Outstanding:</span>
                  <span className="font-mono font-semibold">₹{remaining.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Paying Now:</span>
                  <span className="font-mono font-semibold text-emerald-600">- ₹{numAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5">
                  <span>Remaining After Payment:</span>
                  <span className={`font-mono ${newBalance === 0 ? 'text-emerald-600 font-extrabold' : 'text-rose-600'}`}>
                    ₹{newBalance.toFixed(2)} {newBalance === 0 && ' (FULLY PAID)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedInvoiceNo || numAmount <= 0}
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition disabled:opacity-50"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
