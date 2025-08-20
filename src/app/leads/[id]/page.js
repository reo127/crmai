'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function LeadDetailPage() {
  const [lead, setLead] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchLead();
  }, [params.id]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leads/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setLead(data.lead);
        setInteractions(data.interactions);
      } else {
        router.push('/leads');
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
      router.push('/leads');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLead = async (updatedData) => {
    try {
      const response = await fetch(`/api/leads/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        const updatedLead = await response.json();
        setLead(updatedLead);
        setEditing(false);
      } else {
        alert('Failed to update lead');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const handleDeleteLead = async () => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const response = await fetch(`/api/leads/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/leads');
      } else {
        alert('Failed to delete lead');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-purple-100 text-purple-800',
      'Converted': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800',
      'Follow-up': 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!lead) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Lead not found</h2>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
                <p className="text-gray-600">{lead.companyName}</p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/leads')}
                >
                  Back to Leads
                </Button>
                {!editing && (
                  <Button onClick={() => setEditing(true)}>
                    Edit Lead
                  </Button>
                )}
                <Button
                  variant="success"
                  onClick={() => setShowInteractionModal(true)}
                >
                  📞 Add Interaction
                </Button>
                {user?.role === 'admin' && (
                  <Button variant="danger" onClick={handleDeleteLead}>
                    Delete Lead
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lead Information */}
              <div className="lg:col-span-2">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Lead Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editing ? (
                      <EditLeadForm
                        lead={lead}
                        onSave={handleUpdateLead}
                        onCancel={() => setEditing(false)}
                        userRole={user?.role}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                          <div className="space-y-2 text-sm">
                            <div><strong>Phone:</strong> {lead.phone}</div>
                            {lead.email && <div><strong>Email:</strong> {lead.email}</div>}
                            {lead.whatsappNumber && <div><strong>WhatsApp:</strong> {lead.whatsappNumber}</div>}
                            {lead.address && <div><strong>Address:</strong> {lead.address}</div>}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Business Information</h4>
                          <div className="space-y-2 text-sm">
                            <div><strong>Product Interest:</strong> {lead.productInterest?.name}</div>
                            <div><strong>Source:</strong> {lead.source?.name}</div>
                            <div><strong>Lead Value:</strong> ${lead.leadValue?.toLocaleString()}</div>
                            <div><strong>Assigned To:</strong> {lead.assignedTo?.name}</div>
                            <div>
                              <strong>Status:</strong>{' '}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ml-1 ${getStatusColor(lead.status)}`}>
                                {lead.status}
                              </span>
                            </div>
                            <div>
                              <strong>Priority:</strong>{' '}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ml-1 ${getPriorityColor(lead.priority)}`}>
                                {lead.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {lead.notes && (
                          <div className="md:col-span-2">
                            <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
                            <p className="text-sm text-gray-600">{lead.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Communication History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Communication History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {interactions.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No interactions recorded</p>
                      ) : (
                        interactions.map((interaction) => (
                          <div key={interaction._id} className="border-l-4 border-blue-400 pl-4 py-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{interaction.type}</span>
                                  {interaction.outcome && (
                                    <span className="text-sm text-gray-600">- {interaction.outcome}</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{interaction.notes}</p>
                                <div className="text-xs text-gray-500 mt-2">
                                  By {interaction.user?.name} on{' '}
                                  {new Date(interaction.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button
                        variant="success"
                        className="w-full"
                        onClick={() => window.open(`tel:${lead.phone}`)}
                      >
                        📞 Call {lead.phone}
                      </Button>
                      {lead.email && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => window.open(`mailto:${lead.email}`)}
                        >
                          📧 Email
                        </Button>
                      )}
                      {lead.whatsappNumber && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => window.open(`https://wa.me/${lead.whatsappNumber}`)}
                        >
                          📱 WhatsApp
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Add Interaction Modal */}
        <AddInteractionModal
          isOpen={showInteractionModal}
          onClose={() => setShowInteractionModal(false)}
          leadId={params.id}
          onSuccess={() => {
            setShowInteractionModal(false);
            fetchLead();
          }}
        />
      </div>
    </ProtectedRoute>
  );
}

// Edit Lead Form Component
function EditLeadForm({ lead, onSave, onCancel, userRole }) {
  const [formData, setFormData] = useState({
    name: lead.name || '',
    phone: lead.phone || '',
    email: lead.email || '',
    whatsappNumber: lead.whatsappNumber || '',
    address: lead.address || '',
    companyName: lead.companyName || '',
    leadValue: lead.leadValue || '',
    status: lead.status || 'New',
    priority: lead.priority || 'Medium',
    notes: lead.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            name="name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
          <input
            type="text"
            name="whatsappNumber"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.whatsappNumber}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <input
            type="text"
            name="companyName"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.companyName}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lead Value</label>
          <input
            type="number"
            name="leadValue"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.leadValue}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="In Progress">In Progress</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
            <option value="Follow-up">Follow-up</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            name="priority"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          name="address"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          value={formData.address}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          name="notes"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          value={formData.notes}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
}

// Add Interaction Modal Component
function AddInteractionModal({ isOpen, onClose, leadId, onSuccess }) {
  const [formData, setFormData] = useState({
    type: 'Call',
    outcome: '',
    notes: '',
    duration: '',
    followUpDate: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lead: leadId,
          duration: formData.duration ? parseInt(formData.duration) : null,
        }),
      });

      if (response.ok) {
        onSuccess();
        setFormData({
          type: 'Call',
          outcome: '',
          notes: '',
          duration: '',
          followUpDate: '',
        });
      } else {
        alert('Failed to add interaction');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Interaction">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            name="type"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="Call">Call</option>
            <option value="Email">Email</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Meeting">Meeting</option>
            <option value="Note">Note</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
          <select
            name="outcome"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.outcome}
            onChange={handleChange}
          >
            <option value="">Select outcome</option>
            <option value="Interested">Interested</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Call Back Later">Call Back Later</option>
            <option value="No Answer">No Answer</option>
            <option value="Converted">Converted</option>
            <option value="Follow-up Scheduled">Follow-up Scheduled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Describe the interaction..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              name="duration"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.duration}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Follow-up Date
            </label>
            <input
              type="date"
              name="followUpDate"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.followUpDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Interaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}