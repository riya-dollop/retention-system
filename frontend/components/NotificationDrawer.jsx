'use client';

import React, { useState } from 'react';
import { Bell, ShieldAlert, Check, X, Ban, CreditCard, MessageSquare } from 'lucide-react';

export default function NotificationDrawer({ notifications, isOpen, onClose, onMarkRead }) {
  const [filterRole, setFilterRole] = useState('all');

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (filterRole === 'all') return true;
    return n.recipient_role === filterRole;
  });

  const getNotifIcon = (type) => {
    if (type?.includes('manager')) return <ShieldAlert className="w-4 h-4 text-rose-600" />;
    if (type?.includes('stop')) return <Ban className="w-4 h-4 text-red-600" />;
    if (type?.includes('payment')) return <CreditCard className="w-4 h-4 text-emerald-600" />;
    return <MessageSquare className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slideIn">
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-sm">Staff Notifications</h3>
            <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-full font-bold">
              {notifications.filter((n) => !n.is_read).length} unread
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex gap-1">
          {['all', 'manager', 'salesperson'].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition ${
                filterRole === role
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {role === 'manager' ? 'Manager Escalations' : role}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-12">
              No notifications for this filter.
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-lg border text-xs transition ${
                  n.is_read
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : n.recipient_role === 'manager'
                    ? 'bg-rose-50/80 border-rose-300'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    {getNotifIcon(n.type)}
                    <span className={n.recipient_role === 'manager' ? 'text-rose-800' : 'text-slate-900'}>
                      {n.recipient_role === 'manager' ? 'MANAGEMENT ESCALATION' : 'SALES REP ALERT'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {String(n.simulated_date).substring(0, 10)}
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed mb-2">{n.message}</p>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-slate-400">Recipient: {n.recipient_name || n.recipient_role}</span>
                  {!n.is_read && (
                    <button
                      onClick={() => onMarkRead(n.id)}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
