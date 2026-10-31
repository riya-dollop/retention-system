'use client';

import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, Check, X, Ban, CreditCard, MessageSquare } from 'lucide-react';

export default function NotificationDrawer({ notifications, isOpen, onClose, onMarkRead }) {
  const [filterRole, setFilterRole] = useState('all');
  const [rendered, setRendered] = useState(isOpen);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      const timer = setTimeout(() => setActive(true), 20);
      return () => clearTimeout(timer);
    } else {
      setActive(false);
      const timer = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!rendered) return null;

  const filtered = notifications.filter((n) => {
    if (filterRole === 'all') return true;
    return n.recipient_role === filterRole;
  });

  const getNotifIcon = (type) => {
    if (type?.includes('manager') || type?.includes('escalation'))
      return <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />;
    if (type?.includes('stop') || type?.includes('opt_out'))
      return <Ban className="w-4 h-4 text-red-600 flex-shrink-0" />;
    if (type?.includes('payment'))
      return <CreditCard className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
    return <MessageSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />;
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
        active ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 transform transition-transform duration-300 ease-in-out ${
          active ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Staff Alerts & Notifications</h3>
              <p className="text-[11px] text-slate-400">{unreadCount} unread notification(s)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-1">
          <div className="flex gap-1 text-xs">
            {['all', 'manager', 'salesperson'].map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                  filterRole === role
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {role === 'manager' ? 'Manager Escalations' : role === 'salesperson' ? 'Sales Reps' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-16 flex flex-col items-center justify-center space-y-2">
              <Bell className="w-6 h-6 text-slate-300" />
              <p>No notifications found in this filter.</p>
            </div>
          ) : (
            filtered.map((n) => {
              const isManager = n.recipient_role === 'manager';

              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border text-xs transition space-y-2 ${
                    n.is_read
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : isManager
                      ? 'bg-rose-50/90 border-rose-300 shadow-xs'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      {getNotifIcon(n.type)}
                      <span className={isManager ? 'text-rose-900 font-extrabold' : 'text-slate-900'}>
                        {isManager ? 'MANAGER ESCALATION' : 'SALES REP ALERT'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-semibold">
                      {String(n.simulated_date).substring(0, 10)}
                    </span>
                  </div>

                  <p className="text-slate-700 leading-relaxed font-medium">{n.message}</p>

                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100">
                    <span className="text-slate-400 font-medium">To: {n.recipient_name || n.recipient_role}</span>
                    {!n.is_read && (
                      <button
                        onClick={() => onMarkRead(n.id)}
                        className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline"
                      >
                        <Check className="w-3 h-3" /> Mark read
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
