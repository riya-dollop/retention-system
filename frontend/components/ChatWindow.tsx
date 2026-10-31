'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCheck,
  CreditCard,
  ShieldAlert,
  Sparkles,
  Tag,
  ShoppingBag,
  Clock,
  Info,
  X,
  FileText,
  User,
  Copy,
  CheckCircle2,
  Phone,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export default function ChatWindow({ customer, messages, onOpenPaymentModal, onQuickAction, onBackToList }: {
  customer: any;
  messages: any[];
  onOpenPaymentModal: () => void;
  onQuickAction?: (actionText: string) => void;
  onBackToList?: () => void;
}) {
  const scrollRef = useRef(null);
  const [showDossier, setShowDossier] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!customer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-slate-400">
        <div className="w-16 h-16 rounded-full bg-slate-200/70 flex items-center justify-center mb-3 text-slate-400 text-2xl">
          💬
        </div>
        <p className="text-sm font-semibold text-slate-600">Select a retail merchant from the directory</p>
        <p className="text-xs text-slate-400 mt-1">Simulate conversations, automatic follow-ups, and customer responses</p>
      </div>
    );
  }

  const getStageBadge = (stageName) => {
    if (!stageName) return null;

    if (stageName.includes('firm')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold mb-1.5 w-fit">
          <ShieldAlert className="w-3 h-3 text-amber-600" /> Firm Follow-up (+7d) • Case Opened
        </span>
      );
    }
    if (stageName.includes('final')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-rose-50 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full font-bold mb-1.5 w-fit">
          <ShieldAlert className="w-3 h-3 text-rose-600" /> Final Notice (+15d) • Escalated to GM
        </span>
      );
    }
    if (stageName.includes('soft')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-800 border border-blue-300 px-2 py-0.5 rounded-full font-bold mb-1.5 w-fit">
          <Clock className="w-3 h-3 text-blue-600" /> Soft Follow-up (+3d)
        </span>
      );
    }
    if (stageName.includes('due_day')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-orange-50 text-orange-800 border border-orange-300 px-2 py-0.5 rounded-full font-bold mb-1.5 w-fit">
          <Clock className="w-3 h-3 text-orange-600" /> Due Today (Day 0)
        </span>
      );
    }
    if (stageName.includes('pre_due')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-full font-bold mb-1.5 w-fit">
          <Clock className="w-3 h-3 text-purple-600" /> Pre-Due Reminder (-2d)
        </span>
      );
    }
    if (stageName.includes('offer')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold mb-1.5 w-fit">
          <Sparkles className="w-3 h-3 text-emerald-600" /> Promotional Retention Offer
        </span>
      );
    }
    if (stageName.includes('reorder')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-300 px-2 py-0.5 rounded-full font-bold mb-1.5 w-fit">
          <ShoppingBag className="w-3 h-3 text-indigo-600" /> Predictive Reorder Cadence
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold mb-1.5 w-fit">
        <Tag className="w-3 h-3 text-slate-500" /> {stageName}
      </span>
    );
  };

  // Helper to detect special promotional codes or reorder offers in message content
  const renderMessageContent = (content) => {
    const isCoupon = content.includes('WINBACK10') || content.includes('EARLYPAY2');
    const isReorderPrompt = content.includes('Reply YES') || content.includes('restock');

    return (
      <div className="space-y-2">
        <p className="whitespace-pre-line leading-relaxed text-[12.5px] text-slate-800">{content}</p>

        {/* Visual Coupon card */}
        {isCoupon && (
          <div className="mt-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-400 p-2.5 rounded-xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Exclusive Voucher</span>
                <span className="text-xs font-mono font-extrabold text-emerald-950">
                  {content.includes('WINBACK10') ? 'WINBACK10 (10% OFF)' : 'EARLYPAY2 (2% OFF)'}
                </span>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(content.includes('WINBACK10') ? 'WINBACK10' : 'EARLYPAY2')}
              className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold border border-emerald-300 transition flex items-center gap-1 shadow-xs"
            >
              {copiedCode ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-emerald-700" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}

        {/* Visual Reorder Card with 1-click YES button */}
        {isReorderPrompt && onQuickAction && (
          <div className="mt-2 bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-900">Approve this Restock Draft Order?</span>
            </div>
            <button
              onClick={() => onQuickAction('YES')}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              <span>Reply YES</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#EFEAE2] whatsapp-chat-bg relative overflow-hidden">
      {/* WhatsApp Header Bar */}
      <div className="bg-[#008069] text-white px-3 md:px-4 py-2.5 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Mobile Back Button */}
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="md:hidden p-1.5 -ml-1 text-white hover:bg-emerald-700/60 rounded-full transition active:scale-95"
              title="Back to retailers directory"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="relative">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-xs md:text-sm text-emerald-100 border-2 border-emerald-400 shadow-xs">
              {customer.name.substring(0, 2).toUpperCase()}
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 border-2 border-[#008069] absolute bottom-0 right-0"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <h2 className="font-bold text-xs md:text-sm leading-tight text-white line-clamp-1">{customer.name}</h2>
              <span className="text-[9px] md:text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono text-emerald-100 font-medium">
                {customer.credit_terms}D
              </span>
            </div>
            <p className="text-[10px] md:text-[11px] text-emerald-100/90 flex items-center gap-1.5 mt-0.5">
              <span>{customer.phone}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Rep: {customer.salesperson}</span>
              {customer.promise_date && (
                <>
                  <span>•</span>
                  <span className="text-amber-200 font-semibold bg-amber-900/50 px-1.5 py-0.2 rounded text-[10px]">
                    Promised: {String(customer.promise_date).substring(0, 10)}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Customer Dossier Toggle */}
          <button
            onClick={() => setShowDossier(!showDossier)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
              showDossier ? 'bg-white text-emerald-800' : 'bg-emerald-800/80 text-white hover:bg-emerald-700'
            }`}
            title="Toggle customer details & invoice history"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Details</span>
          </button>

          {/* Record Payment Button */}
          <button
            onClick={onOpenPaymentModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden xs:inline">Record Payment</span>
            <span className="xs:hidden">Pay</span>
          </button>
        </div>
      </div>

      {/* Main Chat Workspace + Dossier Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Message Chat Feed */}
        <div ref={scrollRef} className="flex-1 p-3 md:p-4 overflow-y-auto space-y-3.5">
          {messages.length === 0 ? (
            <div className="text-center my-10 md:my-14 max-w-md mx-auto px-4">
              <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-sm text-xs text-slate-600 border border-slate-200/90 text-left">
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-bold text-sm">
                  <span className="text-base">💬</span>
                  <span>Wholesale WhatsApp Simulation Active</span>
                </div>
                <p className="text-slate-500 leading-relaxed mb-3">
                  Invoices are evaluated against configured stages (Day -2 pre-due, 0 due, +3 soft, +7 firm, +15 final notice). Use the top clock bar to fast-forward days, or test customer replies instantly:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={() => onQuickAction && onQuickAction('Paid')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition active:scale-95"
                  >
                    Simulate: Paid
                  </button>
                  <button
                    onClick={() => onQuickAction && onQuickAction('Promise 2026-11-05')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-100 transition active:scale-95"
                  >
                    Simulate: Promise
                  </button>
                  <button
                    onClick={() => onQuickAction && onQuickAction('Dispute')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100 transition active:scale-95"
                  >
                    Simulate: Dispute
                  </button>
                  <button
                    onClick={() => onQuickAction && onQuickAction('Stop')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300 rounded-lg hover:bg-rose-100 transition active:scale-95"
                  >
                    Simulate: Stop
                  </button>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isOutbound = msg.direction === 'outbound';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm text-xs relative ${
                      isOutbound
                        ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-none border border-emerald-200/70'
                        : 'bg-white text-slate-900 rounded-tl-none border border-slate-200/80'
                    }`}
                  >
                    {/* Stage category badge for outbound messages */}
                    {isOutbound && getStageBadge(msg.stage_name)}

                    {/* Message content */}
                    {renderMessageContent(msg.content)}

                    {/* Message timestamp and delivery ticks */}
                    <div className="mt-1.5 flex items-center justify-end space-x-1 text-[10px] text-slate-400 font-mono">
                      <span>{msg.sent_date}</span>
                      {isOutbound && (
                        <span className="ml-1">
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] inline" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-slate-400 inline" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-slate-400 inline" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Slide-out Customer Dossier Drawer with click-outside dismiss */}
        {showDossier && (
          <div
            onClick={() => setShowDossier(false)}
            className="absolute inset-0 z-20 bg-black/25 backdrop-blur-2xs flex justify-end animate-fadeIn"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-80 max-w-[90vw] bg-white border-l border-slate-200 shadow-xl flex flex-col h-full animate-slideIn"
            >
              <div className="p-3.5 bg-slate-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-xs">Customer Dossier</h3>
                </div>
                <button onClick={() => setShowDossier(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Account summary */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-sm text-slate-900">{customer.name}</div>
                <div className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                  <Phone className="w-3 h-3" /> {customer.phone}
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-600">
                  <span>Sales Rep:</span>
                  <span className="font-semibold text-slate-800">{customer.salesperson}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Credit Terms:</span>
                  <span className="font-semibold text-slate-800">{customer.credit_terms} Days</span>
                </div>
              </div>

              {/* Invoices List */}
              <div>
                <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" /> Invoices ({customer.invoices?.length || 0})
                </h4>
                <div className="space-y-2">
                  {(customer.invoices || []).map((inv) => {
                    const balance = Number(inv.amount) - Number(inv.paid_amount);
                    const isPaid = inv.status === 'paid' || balance <= 0;

                    return (
                      <div
                        key={inv.id}
                        className={`p-2.5 rounded-lg border text-[11px] ${
                          isPaid ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div className="flex justify-between font-bold">
                          <span className="font-mono text-slate-900">{inv.invoice_no}</span>
                          <span className={isPaid ? 'text-emerald-700' : 'text-rose-700 font-mono'}>
                            {isPaid ? 'PAID' : `₹${balance.toFixed(2)} due`}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500 mt-1">
                          <span>Due: {String(inv.due_date).substring(0, 10)}</span>
                          <span>Orig: ₹{Number(inv.amount).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
