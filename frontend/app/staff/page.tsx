'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import AgingBucketWidget from '../../components/AgingBucketWidget';
import CaseTable from '../../components/CaseTable';
import TimelineModal from '../../components/TimelineModal';
import NotificationDrawer from '../../components/NotificationDrawer';
import { Bell, ShieldAlert, AlertTriangle, CheckCircle2, Clock, RotateCcw, TrendingUp } from 'lucide-react';

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
  const waitingCount = cases.filter((c) => c.status === 'waiting').length;
  const resolvedCount = cases.filter((c) => c.status === 'resolved').length;
  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex-1 bg-slate-100/70 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header & Summary Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Staff & Escalation Operations Center</span>
              <span className="text-xs bg-slate-200 text-slate-800 px-3 py-1 rounded-full font-mono font-bold border border-slate-300">
                Simulated Date: {currentDate}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Monitor stuck receivables, 2-day General Manager escalations, dispute resolutions, and customer churn.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition active:scale-95"
              title="Refresh Data"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Notifications Bell Trigger */}
            <button
              onClick={() => setIsNotifDrawerOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 bg-white text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl shadow-2xs text-xs font-bold transition hover:bg-slate-50 active:scale-95"
            >
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Staff Alerts</span>
              {unreadNotifsCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Manager Escalations */}
          <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs flex items-center justify-between relative overflow-hidden group">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Manager Escalations</div>
                <div className="text-2xl font-extrabold font-mono text-rose-600">{escalatedCount}</div>
              </div>
            </div>
            <div className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
              2-Day Rule
            </div>
          </div>

          {/* Card 2: Open Cases */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between relative overflow-hidden group">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Open Rep Cases</div>
                <div className="text-2xl font-extrabold font-mono text-amber-600">{openCount}</div>
              </div>
            </div>
            <div className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              Day +7 Stage
            </div>
          </div>

          {/* Card 3: Waiting (Promise-to-Pay) */}
          <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-xs flex items-center justify-between relative overflow-hidden group">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Waiting (Promise)</div>
                <div className="text-2xl font-extrabold font-mono text-blue-600">{waitingCount}</div>
              </div>
            </div>
            <div className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              Paused
            </div>
          </div>

          {/* Card 4: Auto-Resolved Cases */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between relative overflow-hidden group">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Auto-Resolved</div>
                <div className="text-2xl font-extrabold font-mono text-emerald-600">{resolvedCount}</div>
              </div>
            </div>
            <div className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Paid Up
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
