'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import AgingBucketWidget from '../../components/AgingBucketWidget';
import CaseTable from '../../components/CaseTable';
import TimelineModal from '../../components/TimelineModal';
import NotificationDrawer from '../../components/NotificationDrawer';
import { Bell, ShieldAlert, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function StaffPanelPage() {
  const [cases, setCases] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentDate, setCurrentDate] = useState('2026-10-20');
  const [selectedCaseForTimeline, setSelectedCaseForTimeline] = useState(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [clockRes, casesRes, notifsRes, custsRes] = await Promise.all([
        api.getClock(),
        api.getCases(),
        api.getNotifications(),
        api.getCustomers(),
      ]);

      setCurrentDate(clockRes.currentDate);
      setCases(casesRes);
      setNotifications(notifsRes);
      setCustomers(custsRes);
    } catch (err) {
      console.error('Failed to load staff data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle case status update or resolution
  const handleUpdateCaseStatus = async (caseId, status, note) => {
    try {
      await api.updateCase(caseId, { status, note });
      await loadData();
    } catch (err) {
      alert(`Error updating case: ${err.message}`);
    }
  };

  // Handle adding timeline note
  const handleAddTimelineNote = async (caseId, note) => {
    try {
      const updated = await api.updateCase(caseId, { note });
      setSelectedCaseForTimeline(updated);
      await loadData();
    } catch (err) {
      alert(`Error adding note: ${err.message}`);
    }
  };

  // Handle marking notification as read
  const handleMarkNotifRead = async (notifId) => {
    try {
      await api.markNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const escalatedCount = cases.filter((c) => c.status === 'escalated').length;
  const openCount = cases.filter((c) => c.status === 'open').length;
  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex-1 bg-slate-100 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header & Summary Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Staff & Escalation Operations Center</span>
              <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-mono font-medium">
                Today: {currentDate}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor stuck receivables, 2-day manager escalations, dispute resolutions, and opt-outs.
            </p>
          </div>

          {/* Notifications Bell Trigger */}
          <button
            onClick={() => setIsNotifDrawerOpen(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 bg-white text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg shadow-sm text-xs font-semibold transition"
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span>Staff Alerts</span>
            {unreadNotifsCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-rose-100 text-rose-700 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-400">Manager Escalations</div>
              <div className="text-2xl font-bold font-mono text-rose-600">{escalatedCount}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-400">Open Staff Cases</div>
              <div className="text-2xl font-bold font-mono text-amber-600">{openCount}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-400">Waiting (Promise-to-Pay)</div>
              <div className="text-2xl font-bold font-mono text-blue-600">
                {cases.filter((c) => c.status === 'waiting').length}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-400">Auto-Resolved Cases</div>
              <div className="text-2xl font-bold font-mono text-emerald-600">
                {cases.filter((c) => c.status === 'resolved').length}
              </div>
            </div>
          </div>
        </div>

        {/* Receivables Aging Buckets Analysis Widget */}
        <AgingBucketWidget customers={customers} currentDate={currentDate} />

        {/* Primary Case Management Table */}
        <CaseTable
          cases={cases}
          onSelectCaseTimeline={(c) => {
            setSelectedCaseForTimeline(c);
            setIsTimelineOpen(true);
          }}
          onUpdateCaseStatus={handleUpdateCaseStatus}
        />
      </div>

      {/* Case Timeline Audit Modal */}
      <TimelineModal
        selectedCase={selectedCaseForTimeline}
        isOpen={isTimelineOpen}
        onClose={() => {
          setIsTimelineOpen(false);
          setSelectedCaseForTimeline(null);
        }}
        onAddNote={handleAddTimelineNote}
      />

      {/* Slide-over Staff Notifications Drawer */}
      <NotificationDrawer
        notifications={notifications}
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        onMarkRead={handleMarkNotifRead}
      />
    </div>
  );
}
