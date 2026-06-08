'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const statusConfig = {
  'New':         'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'Contacted':   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'In Progress': 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  'Converted':   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  'Lost':        'bg-red-50 text-red-700 ring-1 ring-red-200',
  'Follow-up':   'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
};

const StatCard = ({ label, value, icon, color }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const LoadingSkeleton = () => (
  <ProtectedRoute>
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-slate-100 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                  <div className="h-6 w-10 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </ProtectedRoute>
);

const LeadListBox = ({ title, leads, loading, dateFrom, dateTo, onDateFromChange, onDateToChange, accentColor, emptyMsg, router }) => (
  <Card>
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <CardTitle className={accentColor}>{title}</CardTitle>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
          <span className="text-slate-400 text-xs">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      {loading ? (
        <div className="px-6 py-8 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-2.5 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="px-6 py-10 text-center text-slate-400 text-sm">{emptyMsg}</div>
      ) : (
        <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {leads.map((lead) => (
            <li
              key={lead._id}
              onClick={() => router.push(`/leads/${lead._id}`)}
              className="flex items-center justify-between px-6 py-3 hover:bg-blue-50/50 cursor-pointer transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-600 truncate">{lead.name}</p>
                <p className="text-xs text-slate-500 truncate">{lead.phone} · {lead.source}</p>
              </div>
              <span className={`ml-3 flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig[lead.status] || 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'}`}>
                {lead.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalLeads: 0, convertedLeads: 0, pendingLeads: 0, followUpsToday: 0, conversionRate: 0, totalCalls: 0 });
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [leadsSortOrder, setLeadsSortOrder] = useState('desc'); // 'desc' = newest first

  const [followupLeads, setFollowupLeads] = useState([]);
  const [followupLoading, setFollowupLoading] = useState(true);
  const [followupDateFrom, setFollowupDateFrom] = useState('');
  const [followupDateTo, setFollowupDateTo] = useState('');

  const [myLeads, setMyLeads] = useState([]);
  const [myLeadsLoading, setMyLeadsLoading] = useState(true);
  const [myLeadsDateFrom, setMyLeadsDateFrom] = useState('');
  const [myLeadsDateTo, setMyLeadsDateTo] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetchUserData();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchFollowupLeads();
  }, [followupDateFrom, followupDateTo]);

  useEffect(() => {
    fetchMyLeads();
  }, [myLeadsDateFrom, myLeadsDateTo]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch {}
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, leadsRes] = await Promise.all([
        fetch('/api/dashboard/stats', { credentials: 'include' }),
        fetch('/api/dashboard/leads', { credentials: 'include' }),
      ]);
      if (statsRes.ok) setStats((await statsRes.json()).stats);
      if (leadsRes.ok) setLeads((await leadsRes.json()).leads);
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchFollowupLeads = async () => {
    try {
      setFollowupLoading(true);
      const params = new URLSearchParams();
      if (followupDateFrom) params.set('dateFrom', followupDateFrom);
      if (followupDateTo) params.set('dateTo', followupDateTo);
      const res = await fetch(`/api/dashboard/followup-leads?${params}`, { credentials: 'include' });
      if (res.ok) setFollowupLeads((await res.json()).leads);
    } catch {} finally {
      setFollowupLoading(false);
    }
  };

  const fetchMyLeads = async () => {
    try {
      setMyLeadsLoading(true);
      const params = new URLSearchParams();
      if (myLeadsDateFrom) params.set('dateFrom', myLeadsDateFrom);
      if (myLeadsDateTo) params.set('dateTo', myLeadsDateTo);
      const res = await fetch(`/api/dashboard/leads?${params}`, { credentials: 'include' });
      if (res.ok) {
        let data = (await res.json()).leads;
        if (myLeadsDateFrom) data = data.filter(l => new Date(l.createdAt) >= new Date(myLeadsDateFrom));
        if (myLeadsDateTo) {
          const end = new Date(myLeadsDateTo);
          end.setHours(23, 59, 59, 999);
          data = data.filter(l => new Date(l.createdAt) <= end);
        }
        setMyLeads(data);
      }
    } catch {} finally {
      setMyLeadsLoading(false);
    }
  };

  const filteredLeads = (() => {
    let list = statusFilter === 'all'
      ? leads
      : leads.filter(lead => lead.status.toLowerCase().replace(/[\s-]/g, '') === statusFilter);
    // Sort by createdAt
    list = [...list].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return leadsSortOrder === 'desc' ? bTime - aTime : aTime - bTime;
    });
    return list;
  })();

  if (loading) return <LoadingSkeleton />;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

          <div className="flex justify-between items-center mb-7">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {user?.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">Track your leads and performance at a glance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-7">
            <StatCard label="Total Leads" value={stats.totalLeads} color="bg-blue-50 text-blue-600"
              icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            <StatCard label="Total Calls" value={stats.totalCalls} color="bg-violet-50 text-violet-600"
              icon="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            <StatCard label="Converted" value={stats.convertedLeads} color="bg-emerald-50 text-emerald-600"
              icon="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <StatCard label="Pending" value={stats.pendingLeads} color="bg-amber-50 text-amber-600"
              icon="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            <StatCard label="Follow-ups Today" value={stats.followUpsToday} color="bg-orange-50 text-orange-600"
              icon="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </div>

          <Card className="mb-7">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Conversion Rate</p>
                  <p className="text-xs text-slate-500 mt-0.5">Leads converted to customers</p>
                </div>
                <span className="text-2xl font-bold text-emerald-600">{stats.conversionRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.conversionRate, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-7">
            <LeadListBox
              title="In Progress & Follow-ups"
              leads={followupLeads}
              loading={followupLoading}
              dateFrom={followupDateFrom}
              dateTo={followupDateTo}
              onDateFromChange={setFollowupDateFrom}
              onDateToChange={setFollowupDateTo}
              accentColor="text-violet-700"
              emptyMsg="No in-progress or follow-up leads for this period"
              router={router}
            />

            <LeadListBox
              title="Leads Assigned to Me"
              leads={myLeads}
              loading={myLeadsLoading}
              dateFrom={myLeadsDateFrom}
              dateTo={myLeadsDateTo}
              onDateFromChange={setMyLeadsDateFrom}
              onDateToChange={setMyLeadsDateTo}
              accentColor="text-blue-700"
              emptyMsg="No leads assigned for this period"
              router={router}
            />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Leads Overview</CardTitle>
              <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white cursor-pointer"
                  >
                    <option value="all">All Leads</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="inprogress">In Progress</option>
                    <option value="followup">Follow-up</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                  <button
                    onClick={() => setLeadsSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
                    title={leadsSortOrder === 'desc' ? 'Newest first — click for oldest first' : 'Oldest first — click for newest first'}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      {leadsSortOrder === 'desc'
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25 5.25L17.25 21m0 0L21 17.25M17.25 21V9" />
                      }
                    </svg>
                    {leadsSortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                  </button>
                  <Button variant="outline" size="sm" onClick={() => router.push('/leads')}>
                    Manage Leads
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="mx-6 mt-4 mb-4 flex items-center gap-2.5 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                Click any lead name to view details, log calls, and manage interactions.
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50/80 border-y border-slate-100">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Lead</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <p className="text-slate-500 text-sm">
                              {statusFilter === 'all' ? 'No leads assigned to you yet' : `No ${statusFilter} leads found`}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredLeads.map((lead) => (
                      <tr
                        key={lead._id}
                        onClick={() => router.push(`/leads/${lead._id}`)}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-blue-600 hover:text-blue-700">{lead.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{lead.companyName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{lead.productInterest} · {lead.source}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-900">{lead.phone}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{lead.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig[lead.status] || 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'}`}>
                            {lead.status}
                          </span>
                          {lead.priority && (
                            <p className={`text-xs mt-1.5 font-medium ${lead.priority === 'High' ? 'text-red-600' : lead.priority === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {lead.priority} Priority
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-900 tabular-nums">₹{lead.leadValue?.toLocaleString() || 0}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">{new Date(lead.updatedAt).toLocaleDateString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
