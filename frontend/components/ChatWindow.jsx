'use client';

import React, { useEffect, useRef } from 'react';
import { Check, CheckCheck, CreditCard, ShieldAlert, Sparkles, Tag, ShoppingBag, Clock } from 'lucide-react';

export default function ChatWindow({ customer, messages, onOpenPaymentModal }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!customer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-slate-400">
        <div className="w-16 h-16 rounded-full bg-slate-200/70 flex items-center justify-center mb-3 text-slate-400">
          💬
        </div>
        <p className="text-sm font-medium">Select a retail customer from the list to view chat and trigger workflows</p>
      </div>
    );
  }

  const getStageBadge = (stageName) => {
    if (!stageName) return null;

    if (stageName.includes('firm')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-semibold mb-1 w-fit">
          <ShieldAlert className="w-3 h-3 text-amber-600" /> Firm Follow-up (+7d)
        </span>
      );
    }
    if (stageName.includes('final')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-semibold mb-1 w-fit">
          <ShieldAlert className="w-3 h-3 text-rose-600" /> Final Notice (+15d)
        </span>
      );
    }
    if (stageName.includes('soft')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-semibold mb-1 w-fit">
          <Clock className="w-3 h-3 text-blue-600" /> Soft Follow-up (+3d)
        </span>
      );
    }
    if (stageName.includes('due_day')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded font-semibold mb-1 w-fit">
          <Clock className="w-3 h-3 text-orange-600" /> Due Today (0d)
        </span>
      );
    }
    if (stageName.includes('pre_due')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-semibold mb-1 w-fit">
          <Clock className="w-3 h-3 text-purple-600" /> Pre-Due Reminder (-2d)
        </span>
      );
    }
    if (stageName.includes('offer')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold mb-1 w-fit">
          <Sparkles className="w-3 h-3 text-emerald-600" /> Retention Offer
        </span>
      );
    }
    if (stageName.includes('reorder')) {
      return (
        <span className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-semibold mb-1 w-fit">
          <ShoppingBag className="w-3 h-3 text-indigo-600" /> Reorder Restock Reminder
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium mb-1 w-fit">
        <Tag className="w-3 h-3 text-slate-500" /> {stageName}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#EFEAE2] relative overflow-hidden">
      {/* WhatsApp Header Bar */}
      <div className="bg-[#008069] text-white px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm text-emerald-100 border border-emerald-500">
            {customer.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm leading-tight text-white">{customer.name}</h2>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">
                {customer.credit_terms}D Credit
              </span>
            </div>
            <p className="text-[11px] text-emerald-100 flex items-center gap-2">
              <span>{customer.phone}</span>
              <span>•</span>
              <span>Salesperson: {customer.salesperson}</span>
              {customer.promise_date && (
                <>
                  <span>•</span>
                  <span className="text-amber-200 font-medium">Promised: {customer.promise_date}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Button: Record Payment */}
        <button
          onClick={onOpenPaymentModal}
          className="flex items-center gap-1.5 bg-white text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Message Chat Feed */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-center my-12">
            <div className="inline-block bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm text-xs text-slate-500 border border-slate-200">
              No WhatsApp messages yet. Advance the simulated clock or send a message below.
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOutbound = msg.direction === 'outbound';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs relative ${
                    isOutbound
                      ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-none border border-emerald-200/50'
                      : 'bg-white text-slate-900 rounded-tl-none border border-slate-200'
                  }`}
                >
                  {/* Stage category badge for outbound messages */}
                  {isOutbound && getStageBadge(msg.stage_name)}

                  {/* Message body */}
                  <p className="whitespace-pre-line leading-relaxed text-[12.5px]">{msg.content}</p>

                  {/* Message timestamp and delivery ticks */}
                  <div className="mt-1 flex items-center justify-end space-x-1 text-[10px] text-slate-400">
                    <span>{msg.sent_date}</span>
                    {isOutbound && (
                      <span className="ml-1">
                        {msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-500 inline" />
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
    </div>
  );
}

