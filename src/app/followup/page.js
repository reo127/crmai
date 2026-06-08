'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['New', 'Contacted', 'In Progress', 'Converted', 'Lost', 'Follow-up'];
const INTERACTION_TYPES = ['Call', 'WhatsApp', 'Email', 'Meeting', 'Note'];
const OUTCOMES = ['Interested', 'Not Interested', 'Call Back Later', 'No Answer', 'Converted', 'Follow-up Scheduled'];

const statusBadge = {
  'In Progress': 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  'Follow-up':   'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  'New':         'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'Contacted':   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'Converted':   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  'Lost':        'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const priorityDot = {
  High:   'bg-red-500',
  Medium: 'bg-amber-400',
  Low:    'bg-emerald-400',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function groupLeads(leads) {
  const overdue = [];
  const today = [];
  const upcoming = [];
  const noDate = [];
  leads.forEach((l) => {
    if (!l.followUpDate) noDate.push(l);
    else if (isOverdue(l.followUpDate)) overdue.push(l);
    else if (isToday(l.followUpDate)) today.push(l);
    else upcoming.push(l);
  });
  return { overdue, today, upcoming, noDate };
}

// ─── Log Call Modal ───────────────────────────────────────────────────────────

function LogCallModal({ lead, onClose, onSuccess }) {
  const [type, setType] = useState('Call');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [duration, setDuration] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) { setError('Notes are required'); return; }
    setSaving(true);
    setError('');
    try {
      const body = {
        lead: lead._id,
        type,
        outcome: outcome || undefined,
        notes,
        duration: duration ? parseInt(duration) : undefined,
        followUpDate: followUpDate || undefined,
        newStatus: newStatus || undefined,
      };
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to log interaction');
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
    >
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900">Log Interaction</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-52">{lead.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type *</label>
            <div className="flex flex-wrap gap-2">
              {INTERACTION_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    type === t
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Outcome</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="">Select outcome</option>
              {OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Override status */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Update Lead Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="">Keep current ({lead.status})</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes *</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What was discussed…"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Duration + Follow-up Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Duration (min)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 5"
                min="0"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {saving ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reschedule Popover ────────────────────────────────────────────────────────

function ReschedulePopover({ lead, onClose, onSuccess }) {
  const [date, setDate] = useState(toDateInputValue(lead.followUpDate));
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ followUpDate: date || null }),
      });
      if (res.ok) onSuccess(date);
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-60">
      <p className="text-xs font-semibold text-slate-600 mb-2">Set Follow-up Date</p>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-2"
      />
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 text-xs py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-slate-600">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 text-xs py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-semibold disabled:opacity-60">
          {saving ? '…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ─── Status Dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({ lead, onClose, onSuccess }) {
  const [saving, setSaving] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleStatus = async (status) => {
    setSaving(status);
    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (res.ok) onSuccess(status);
    } catch {}
    finally { setSaving(null); }
  };

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-44">
      <p className="text-xs text-slate-400 px-3 py-1.5 font-semibold uppercase tracking-wide">Change Status</p>
      {STATUS_OPTIONS.map((s) => (
        <button
          key={s}
          onClick={() => handleStatus(s)}
          disabled={saving === s || lead.status === s}
          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 ${lead.status === s ? 'font-semibold text-blue-600' : 'text-slate-700'}`}
        >
          {saving === s && <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
          {lead.status === s && !saving && <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          {s}
        </button>
      ))}
    </div>
  );
}

// ─── Lead Card (Mobile) ───────────────────────────────────────────────────────

function LeadCard({ lead, onLog, onStatusChange, onReschedule, router }) {
  const [showStatus, setShowStatus] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [localLead, setLocalLead] = useState(lead);
  const overdue = isOverdue(localLead.followUpDate);
  const todayDue = isToday(localLead.followUpDate);

  const handleStatusSuccess = (status) => {
    setLocalLead((l) => ({ ...l, status }));
    setShowStatus(false);
    onStatusChange(lead._id, status);
  };

  const handleRescheduleSuccess = (date) => {
    setLocalLead((l) => ({ ...l, followUpDate: date }));
    setShowReschedule(false);
    onReschedule(lead._id, date);
  };

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-visible ${overdue ? 'border-red-200' : todayDue ? 'border-blue-200' : 'border-slate-200'}`}>
      {/* Top bar */}
      {overdue && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-1.5 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
          <span className="text-xs font-semibold text-red-600">Overdue — {formatDate(localLead.followUpDate)}</span>
        </div>
      )}
      {todayDue && !overdue && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-1.5 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-semibold text-blue-600">Due Today</span>
        </div>
      )}

      <div className="p-4">
        {/* Lead name + badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <button
              onClick={() => router.push(`/leads/${lead._id}`)}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 text-left truncate block max-w-full cursor-pointer"
            >
              {localLead.name}
            </button>
            {localLead.companyName && <p className="text-xs text-slate-500 mt-0.5 truncate">{localLead.companyName}</p>}
            <p className="text-xs text-slate-400 mt-0.5">{localLead.productInterest} · {localLead.source}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge[localLead.status] || 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'}`}>
              {localLead.status}
            </span>
            {localLead.priority && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[localLead.priority] || 'bg-slate-300'}`} />
                {localLead.priority}
              </span>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className="flex items-center gap-3 mb-3 text-sm text-slate-700">
          <span className="font-medium">{localLead.phone}</span>
          {localLead.email && <span className="text-slate-400 text-xs truncate">{localLead.email}</span>}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4">
          {localLead.followUpDate && !overdue && !todayDue && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {formatDate(localLead.followUpDate)}
            </span>
          )}
          {localLead.assignedTo && (
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                {localLead.assignedTo.charAt(0).toUpperCase()}
              </span>
              {localLead.assignedTo}
            </span>
          )}
          {localLead.leadValue > 0 && (
            <span className="font-semibold text-slate-700">₹{localLead.leadValue.toLocaleString()}</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Call */}
          <a
            href={`tel:${localLead.phone}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            Call
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/${(localLead.whatsappNumber || localLead.phone).replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.863L.054 23.467a.5.5 0 00.608.63l5.788-1.517A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.68-.528-5.19-1.443l-.373-.222-3.436.9.916-3.344-.243-.386A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            WhatsApp
          </a>

          {/* Log interaction */}
          <button
            onClick={() => onLog(localLead)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Log
          </button>

          {/* Reschedule */}
          <div className="relative">
            <button
              onClick={() => { setShowReschedule((v) => !v); setShowStatus(false); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Reschedule
            </button>
            {showReschedule && (
              <ReschedulePopover
                lead={localLead}
                onClose={() => setShowReschedule(false)}
                onSuccess={handleRescheduleSuccess}
              />
            )}
          </div>

          {/* Status change */}
          <div className="relative ml-auto">
            <button
              onClick={() => { setShowStatus((v) => !v); setShowReschedule(false); }}
              className="flex items-center gap-1 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Status
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {showStatus && (
              <StatusDropdown
                lead={localLead}
                onClose={() => setShowStatus(false)}
                onSuccess={handleStatusSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ label, count, color }) {
  return (
    <div className={`flex items-center gap-2 mb-3 mt-6 first:mt-0`}>
      <span className={`text-xs font-bold uppercase tracking-widest ${color}`}>{label}</span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color} bg-opacity-10 border`}>{count}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FollowUpPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [logTarget, setLogTarget] = useState(null); // lead being logged
  const router = useRouter();

  useEffect(() => { fetchLeads(); }, [dateFrom, dateTo]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await fetch(`/api/dashboard/followup-leads?${params}`, { credentials: 'include' });
      if (res.ok) setLeads((await res.json()).leads);
    } catch {}
    finally { setLoading(false); }
  };

  // Update a lead in local state without re-fetching
  const patchLead = (id, patch) => {
    setLeads((prev) => prev.map((l) => l._id === id ? { ...l, ...patch } : l));
  };

  const handleLogSuccess = () => {
    setLogTarget(null);
    fetchLeads(); // refresh to reflect possible status change
  };

  const clearFilters = () => {
    setDateFrom(''); setDateTo(''); setSearch('');
    setStatusFilter('all'); setPriorityFilter('all');
  };

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.name.toLowerCase().includes(q) || l.phone.includes(q) || (l.companyName || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || l.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const { overdue, today, upcoming, noDate } = groupLeads(filtered);
  const hasFilters = dateFrom || dateTo || search || statusFilter !== 'all' || priorityFilter !== 'all';

  const renderGroup = (leads, label, color) => {
    if (leads.length === 0) return null;
    return (
      <div>
        <SectionHeader label={label} count={leads.length} color={color} />
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadCard
              key={lead._id}
              lead={lead}
              onLog={setLogTarget}
              onStatusChange={(id, status) => patchLead(id, { status })}
              onReschedule={(id, date) => patchLead(id, { followUpDate: date })}
              router={router}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <div className="max-w-2xl mx-auto py-6 px-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Follow-ups</h1>
              <p className="text-slate-500 text-xs mt-0.5">In Progress &amp; Follow-up leads</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {!loading && (
                <>
                  {overdue.length > 0 && <span className="px-2 py-1 bg-red-50 text-red-600 font-semibold rounded-lg">{overdue.length} overdue</span>}
                  {today.length > 0 && <span className="px-2 py-1 bg-blue-50 text-blue-600 font-semibold rounded-lg">{today.length} today</span>}
                </>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 mb-5 space-y-2.5">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search name, phone, company…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Row 2 */}
            <div className="flex gap-2 flex-wrap">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 min-w-28 text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white cursor-pointer">
                <option value="all">All Status</option>
                <option value="In Progress">In Progress</option>
                <option value="Follow-up">Follow-up</option>
              </select>

              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
                className="flex-1 min-w-28 text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white cursor-pointer">
                <option value="all">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {hasFilters && (
                <button onClick={clearFilters} className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer font-medium">
                  Clear
                </button>
              )}
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              <span className="text-slate-400 text-xs flex-shrink-0">to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
                  <div className="flex items-center justify-between mb-3">
                    <div className="space-y-1.5"><div className="h-4 w-32 bg-slate-100 rounded" /><div className="h-3 w-24 bg-slate-100 rounded" /></div>
                    <div className="h-6 w-20 bg-slate-100 rounded-full" />
                  </div>
                  <div className="flex gap-2 mt-4">
                    {[...Array(4)].map((_, j) => <div key={j} className="h-8 w-16 bg-slate-100 rounded-lg" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm font-medium">No follow-up leads found</p>
              <p className="text-slate-400 text-xs mt-1">{hasFilters ? 'Try adjusting the filters' : 'All clear!'}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {renderGroup(overdue, '⚠ Overdue', 'text-red-600')}
              {renderGroup(today, '● Due Today', 'text-blue-600')}
              {renderGroup(upcoming, '↑ Upcoming', 'text-slate-600')}
              {renderGroup(noDate, '— No Date Set', 'text-slate-400')}

              <p className="text-center text-xs text-slate-400 pt-4">
                {filtered.length} lead{filtered.length !== 1 ? 's' : ''} total
              </p>
            </div>
          )}
        </div>

        {/* Log Call Modal */}
        {logTarget && (
          <LogCallModal
            lead={logTarget}
            onClose={() => setLogTarget(null)}
            onSuccess={handleLogSuccess}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
