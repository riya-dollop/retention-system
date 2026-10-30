'use client';

import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2 } from 'lucide-react';

export default function RecordPaymentModal({ customer, isOpen, onClose, onSubmitPayment, loading }) {
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState(null);

  if (!isOpen || !customer) return null;

  const unpaidInvoices = (customer.invoices || []).filter((inv) => inv.status !== 'paid');

  const selectedInv = unpaidInvoices.find((i) => i.invoice_no === selectedInvoiceNo);
  const remaining = selectedInv ? Number(selectedInv.amount) - Number(selectedInv.paid_amount) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceNo || !amount || Number(amount) <= 0) return;

    try {
      const res = await onSubmitPayment({
        invoice_no: selectedInvoiceNo,
        amount: Number(amount),
      });
      setMessage(`Payment recorded! Remaining balance: ₹${res.remainingBalance.toFixed(2)}`);
      setAmount('');
      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-sm">Record Wholesale Payment</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
            <div className="text-xs bg-slate-100 p-2.5 rounded border border-slate-200 text-slate-800 font-medium">
              {customer.name} ({customer.phone})
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Open Invoice</label>
            {unpaidInvoices.length === 0 ? (
              <p className="text-xs text-emerald-600 bg-emerald-50 p-2.5 rounded border border-emerald-200">
                All invoices for this customer are fully paid!
              </p>
            ) : (
              <select
                value={selectedInvoiceNo}
                onChange={(e) => {
                  setSelectedInvoiceNo(e.target.value);
                  const inv = unpaidInvoices.find((i) => i.invoice_no === e.target.value);
                  if (inv) {
                    setAmount(Number(inv.amount) - Number(inv.paid_amount));
                  }
                }}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                required
              >
                <option value="">-- Choose an invoice --</option>
                {unpaidInvoices.map((inv) => (
                  <option key={inv.id} value={inv.invoice_no}>
                    {inv.invoice_no} — ₹{(Number(inv.amount) - Number(inv.paid_amount)).toFixed(2)} balance (Due: {String(inv.due_date).substring(0, 10)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedInv && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Original Amount:</span>
                <span className="font-mono">₹{Number(selectedInv.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Paid So Far:</span>
                <span className="font-mono">₹{Number(selectedInv.paid_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                <span>Outstanding Balance:</span>
                <span className="font-mono text-rose-600">₹{remaining.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (INR)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              max={remaining || 999999}
              placeholder="Enter amount..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
              required
            />
            {selectedInv && remaining > 0 && (
              <div className="flex gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setAmount(remaining)}
                  className="text-[10px] text-emerald-700 hover:underline font-semibold"
                >
                  Pay 100% Full (₹{remaining.toFixed(2)})
                </button>
                <span className="text-[10px] text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setAmount((remaining * 0.4).toFixed(2))}
                  className="text-[10px] text-blue-700 hover:underline font-semibold"
                >
                  Pay 40% Partial (₹{(remaining * 0.4).toFixed(2)})
                </button>
              </div>
            )}
          </div>

          {message && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedInvoiceNo || !amount}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50 shadow-sm"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
