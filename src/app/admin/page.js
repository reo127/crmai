'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm bg-white';
const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const router = useRouter();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', { credentials: 'include' });
      if (response.ok) setUsers((await response.json()).users);
    } catch {} finally { setLoading(false); }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (response.ok) fetchUsers();
      else alert('Failed to update user status');
    } catch { alert('Network error. Please try again.'); }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', credentials: 'include' });
      if (response.ok) fetchUsers();
      else alert('Failed to delete user');
    } catch { alert('Network error. Please try again.'); }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Loading...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-7">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
              <p className="text-slate-500 text-sm mt-0.5">Manage employees and their access</p>
            </div>
            <Button onClick={() => setShowAddUserModal(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Employee
            </Button>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Users</CardTitle>
                <span className="text-sm text-slate-500 font-medium">{users.length} total</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50/80 border-y border-slate-100">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                              </svg>
                            </div>
                            <p className="text-slate-500 text-sm">No users found</p>
                          </div>
                        </td>
                      </tr>
                    ) : users.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => router.push(`/admin/employee/${user._id}`)}
                          >
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-700 text-sm font-bold uppercase">{user.name?.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-blue-600 group-hover:text-blue-700">{user.name}</p>
                              <p className="text-xs text-slate-500">Click to view profile</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'}`}>
                            {user.role === 'admin' ? 'Admin' : 'Employee'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleUserStatus(user._id, user.isActive); }}
                              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${user.isActive ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            {user.role === 'user' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setShowUploadModal(true); }}
                                className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                Upload Leads
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteUser(user._id, user.name); }}
                              className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Duplicate Lead Manager */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Duplicate Lead Detector</CardTitle>
                  <p className="text-sm text-slate-500 mt-0.5">Find leads sharing the same phone number and resolve them</p>
                </div>
                <button
                  onClick={() => setShowDuplicateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  Scan for Duplicates
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-orange-700">
                  This tool scans all leads for matching phone numbers, groups them together, and lets you decide which to <strong>keep</strong>, which to <strong>delete</strong>, or which to <strong>change status</strong> on.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onSuccess={() => { setShowAddUserModal(false); fetchUsers(); }}
        />
        <CsvUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => { setShowUploadModal(false); setSelectedUser(null); }}
          selectedUser={selectedUser}
        />
        <DuplicateManagerModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
        />
      </div>
    </ProtectedRoute>
  );
}

function AddUserModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password, role: formData.role }),
      });
      const data = await response.json();
      if (response.ok) {
        onSuccess();
        setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'user' });
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch { setError('Network error. Please try again.'); } finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Employee" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
            <input type="text" name="name" required className={inputCls} placeholder="Enter full name" value={formData.name} onChange={handleChange} />
          </div>
          <div>
            <label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
            <input type="email" name="email" required className={inputCls} placeholder="employee@company.com" value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <label className={labelCls}>Password <span className="text-red-500">*</span></label>
            <input type="password" name="password" required className={inputCls} placeholder="Min. 6 characters" value={formData.password} onChange={handleChange} />
          </div>
          <div>
            <label className={labelCls}>Confirm Password <span className="text-red-500">*</span></label>
            <input type="password" name="confirmPassword" required className={inputCls} placeholder="Repeat password" value={formData.confirmPassword} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Role <span className="text-red-500">*</span></label>
          <select name="role" required className={inputCls} value={formData.role} onChange={handleChange}>
            <option value="user">Employee (User)</option>
            <option value="admin">Admin</option>
          </select>
          <p className="mt-1.5 text-xs text-slate-500">Employees manage assigned leads only. Admins have full system access.</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Employee'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function CsvUploadModal({ isOpen, onClose, onSuccess, selectedUser }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState([]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) { setError('Please select a CSV file'); return; }
    setFile(selectedFile);
    setError('');
    try {
      const text = await selectedFile.text();
      setPreview(text.split('\n').slice(0, 4));
    } catch {}
  };

  const handleUpload = async () => {
    if (!file || !selectedUser) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('assignedTo', selectedUser._id);
      const response = await fetch('/api/admin/upload-leads', { method: 'POST', credentials: 'include', body: formData });
      const data = await response.json();
      if (response.ok) {
        alert(`Successfully uploaded ${data.count} leads to ${selectedUser.name}`);
        onSuccess();
        setFile(null);
        setPreview([]);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch { setError('Network error. Please try again.'); } finally { setUploading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Upload Leads for ${selectedUser?.name}`} size="lg">
      <div className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <div>
          <label className={labelCls}>Select CSV File</label>
          <input type="file" accept=".csv" onChange={handleFileChange}
            className="w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white cursor-pointer" />
          <p className="mt-1.5 text-xs text-slate-500">CSV columns: name, phone, email, companyName, productInterest, source, leadValue, priority, notes</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <h4 className="text-sm font-semibold text-slate-800 mb-2">Expected CSV Format</h4>
          <pre className="text-xs text-slate-600 overflow-x-auto font-mono">{`name,phone,email,companyName,productInterest,source,leadValue,priority,notes
John Doe,+1234567890,john@example.com,ABC Corp,Software,Website,5000,High,Interested`}</pre>
        </div>

        {preview.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-2">File Preview</h4>
            <div className="bg-white border border-slate-200 rounded-xl p-3 max-h-32 overflow-y-auto">
              {preview.map((row, i) => (
                <div key={i} className="text-xs text-slate-600 font-mono mb-1">{row}</div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div>
            <p className="font-semibold">Upload Information</p>
            <p className="mt-0.5">All leads assigned to: <strong>{selectedUser?.name}</strong>. Missing product/source will use defaults. Invalid rows will be skipped.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>{uploading ? 'Uploading...' : 'Upload Leads'}</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Duplicate Manager Modal
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['New', 'Contacted', 'In Progress', 'Converted', 'Lost', 'Follow-up'];

const statusBadge = {
  'New':         'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'Contacted':   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'In Progress': 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  'Converted':   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  'Lost':        'bg-red-50 text-red-700 ring-1 ring-red-200',
  'Follow-up':   'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
};

function DuplicateManagerModal({ isOpen, onClose }) {
  const SCREEN = { IDLE: 'idle', SCANNING: 'scanning', RESULTS: 'results', DONE: 'done' };

  const [screen, setScreen]           = useState(SCREEN.IDLE);
  const [groups, setGroups]           = useState([]);        // all dup groups
  const [groupIdx, setGroupIdx]       = useState(0);         // which group we're reviewing
  const [selected, setSelected]       = useState(new Set()); // checked lead IDs in current group
  const [actionMode, setActionMode]   = useState('delete');  // 'delete' | 'status'
  const [newStatus, setNewStatus]     = useState('Lost');
  const [applying, setApplying]       = useState(false);
  const [toast, setToast]             = useState(null);      // { type, msg }
  const [resolved, setResolved]       = useState(0);         // count of resolved groups

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setScreen(SCREEN.IDLE);
      setGroups([]);
      setGroupIdx(0);
      setSelected(new Set());
      setResolved(0);
      setToast(null);
    }
  }, [isOpen]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Scan ────────────────────────────────────────────────────────────────────
  const handleScan = async () => {
    setScreen(SCREEN.SCANNING);
    setToast(null);
    try {
      const res = await fetch('/api/admin/duplicates', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setGroups(data.groups || []);
      setGroupIdx(0);
      setSelected(new Set());
      setResolved(0);
      setScreen(data.groups?.length > 0 ? SCREEN.RESULTS : SCREEN.DONE);
    } catch (err) {
      showToast('error', err.message);
      setScreen(SCREEN.IDLE);
    }
  };

  // ── Apply action on selected leads ─────────────────────────────────────────
  const handleApply = async () => {
    if (selected.size === 0) { showToast('error', 'Please select at least one lead to act on.'); return; }
    const currentGroup = groups[groupIdx];
    // Safety: never delete ALL leads in a group
    if (actionMode === 'delete' && selected.size === currentGroup.leads.length) {
      showToast('error', 'You must keep at least one lead. Deselect at least one before deleting.');
      return;
    }
    setApplying(true);
    try {
      const body = actionMode === 'delete'
        ? { action: 'delete', ids: [...selected] }
        : { action: 'update_status', ids: [...selected], status: newStatus };
      const res = await fetch('/api/admin/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      const msg = actionMode === 'delete'
        ? `${data.deleted} lead${data.deleted !== 1 ? 's' : ''} deleted.`
        : `Status updated to "${newStatus}" for ${data.updated} lead${data.updated !== 1 ? 's' : ''}.`;
      showToast('success', msg);
      setResolved(r => r + 1);

      // Advance to next group
      const nextIdx = groupIdx + 1;
      if (nextIdx >= groups.length) {
        setScreen(SCREEN.DONE);
      } else {
        setGroupIdx(nextIdx);
        setSelected(new Set());
      }
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setApplying(false);
    }
  };

  // ── Skip current group ──────────────────────────────────────────────────────
  const handleSkip = () => {
    const nextIdx = groupIdx + 1;
    if (nextIdx >= groups.length) {
      setScreen(SCREEN.DONE);
    } else {
      setGroupIdx(nextIdx);
      setSelected(new Set());
    }
  };

  // ── Toggle a lead's checkbox ─────────────────────────────────────────────────
  const toggleLead = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  // ── "Select all to delete" helper — selects all except the first (oldest/newest) ──
  const selectAllExcept = (keepId) => {
    const current = groups[groupIdx]?.leads || [];
    const s = new Set(current.map(l => l._id.toString()).filter(id => id !== keepId));
    setSelected(s);
  };

  const currentGroup = groups[groupIdx] || null;
  const totalGroups  = groups.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Duplicate Lead Manager" size="xl">

      {/* Toast */}
      {toast && (
        <div className={`mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {toast.type === 'success'
            ? <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            : <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          }
          {toast.msg}
        </div>
      )}

      {/* ── IDLE ── */}
      {screen === SCREEN.IDLE && (
        <div className="text-center py-10 space-y-5">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Scan for Duplicate Leads</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              This will scan all leads in your CRM for matching phone numbers and group them for review.
            </p>
          </div>
          <button
            onClick={handleScan}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Start Scan
          </button>
        </div>
      )}

      {/* ── SCANNING ── */}
      {screen === SCREEN.SCANNING && (
        <div className="text-center py-12 space-y-4">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Scanning all leads for duplicates…</p>
        </div>
      )}

      {/* ── RESULTS ── */}
      {screen === SCREEN.RESULTS && currentGroup && (
        <div className="space-y-5">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Group {groupIdx + 1} of {totalGroups}
              </span>
              <span className="text-xs text-slate-500">{resolved} resolved</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all"
                style={{ width: `${((groupIdx) / totalGroups) * 100}%` }}
              />
            </div>
          </div>

          {/* Group header */}
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
            <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-orange-900">Phone: {currentGroup.phone}</p>
              <p className="text-xs text-orange-700">{currentGroup.leads.length} leads share this number</p>
            </div>
          </div>

          {/* Lead cards */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {currentGroup.leads.map((lead, i) => {
              const id = lead._id.toString();
              const isChecked = selected.has(id);
              return (
                <label
                  key={id}
                  htmlFor={`dup-lead-${id}`}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    id={`dup-lead-${id}`}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleLead(id)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{lead.name}</span>
                      {i === 0 && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Oldest</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[lead.status] || 'bg-slate-100 text-slate-600'}`}>
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{lead.phone} · {lead.email || 'No email'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {lead.source?.name || 'Unknown source'} · Assigned: {lead.assignedTo?.name || 'Unassigned'} · Added {new Date(lead.createdAt).toLocaleDateString()}
                    </p>
                    {lead.companyName && <p className="text-xs text-slate-400">{lead.companyName}</p>}
                  </div>
                  {isChecked && (
                    <span className="text-xs font-semibold text-red-600 flex-shrink-0 mt-1">
                      {actionMode === 'delete' ? '✕ Delete' : '✎ Update'}
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          {/* Quick-select helpers */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-500 self-center">Quick select:</span>
            <button
              onClick={() => selectAllExcept(currentGroup.leads[0]?._id.toString())}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
            >
              All except oldest
            </button>
            <button
              onClick={() => selectAllExcept(currentGroup.leads[currentGroup.leads.length - 1]?._id.toString())}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
            >
              All except newest
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
            >
              Clear selection
            </button>
          </div>

          {/* Action selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Action for selected leads</p>
            <div className="flex flex-wrap gap-3">
              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                actionMode === 'delete' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
                <input type="radio" name="actionMode" value="delete" checked={actionMode === 'delete'} onChange={() => setActionMode('delete')} className="w-4 h-4 text-red-600" />
                Delete selected
              </label>
              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                actionMode === 'status' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
                <input type="radio" name="actionMode" value="status" checked={actionMode === 'status'} onChange={() => setActionMode('status')} className="w-4 h-4 text-blue-600" />
                Change status
              </label>
            </div>
            {actionMode === 'status' && (
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={handleSkip}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Skip this group →
            </button>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                Close
              </button>
              <button
                onClick={handleApply}
                disabled={applying || selected.size === 0}
                className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionMode === 'delete'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {applying && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {actionMode === 'delete'
                  ? `Delete ${selected.size} lead${selected.size !== 1 ? 's' : ''}`
                  : `Update ${selected.size} lead${selected.size !== 1 ? 's' : ''}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DONE ── */}
      {screen === SCREEN.DONE && (
        <div className="text-center py-10 space-y-5">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {groups.length === 0 ? 'No Duplicates Found!' : 'All Groups Reviewed!'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {groups.length === 0
                ? 'Great news — your CRM has no duplicate phone numbers.'
                : `You reviewed ${totalGroups} duplicate group${totalGroups !== 1 ? 's' : ''} and resolved ${resolved}.`
              }
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleScan}
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Scan Again
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </Modal>
  );
}
