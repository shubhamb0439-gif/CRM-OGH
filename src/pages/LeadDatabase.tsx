import { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Lead } from '../lib/supabase';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { usePageVisibility } from '../hooks/usePageVisibility';
import AdminLayout from '../components/AdminLayout';
import { Plus, Filter, Search, Trash2, Edit3, Eye } from 'lucide-react';
import ManageServicesModal from '../components/ManageServicesModal';
import AddLeadModal from '../components/AddLeadModal';
import { useNavigate } from 'react-router-dom';
import { formatDateToDDMMYY } from '../lib/dateUtils';

// Fetch leads from Supabase
async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Delete a lead
async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export default function LeadDatabase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageServices, setShowManageServices] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isVisible = usePageVisibility();

  // Fetch leads with React Query
  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  // Subscribe to realtime updates
  useRealtimeSubscription(
    'leads_database_changes',
    'leads',
    () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  );

  // Refetch when tab becomes visible
  useEffect(() => {
    if (isVisible) {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  }, [isVisible, queryClient]);

  // Client-side filtering with useMemo for performance
  const filteredLeads = useMemo(() => {
    let filtered = [...leads];

    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    return filtered;
  }, [leads, searchTerm, statusFilter]);

  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    deleteMutation.mutate(id);
  };

  const getStatusColor = (status: string, closedReason?: string) => {
    if (status === 'Closed') {
      if (closedReason === 'Confirmed Client') {
        return 'bg-green-100 text-green-700';
      } else if (closedReason === 'Not Interested') {
        return 'bg-red-100 text-red-700';
      }
      return 'bg-slate-100 text-slate-700';
    }

    const colors: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-700',
      'Contacted': 'bg-yellow-100 text-yellow-700',
      'Qualified Prospect': 'bg-green-100 text-green-700',
      'Contract Sent': 'bg-purple-100 text-purple-700',
      'Confirmed Client': 'bg-emerald-100 text-emerald-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading leads...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading leads. Please refresh the page.</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">{leads.length} leads</h1>
            <p className="text-slate-600 text-sm sm:text-base">View and manage all leads</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowManageServices(true)}
              className="flex items-center justify-center space-x-2 bg-white border-2 border-[#531B93] text-[#531B93] px-4 py-2 rounded-lg hover:bg-[#531B93] hover:text-white transition-all shadow-md"
            >
              <Edit3 className="w-5 h-5" />
              <span>Manage Services</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-[#531B93] to-[#2563EB] text-white px-4 py-2 rounded-lg hover:from-[#3d1470] hover:to-[#1d4ed8] transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Lead</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
              >
                <option value="All">All Status</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified Prospect">Qualified Prospect</option>
                <option value="Contract Sent">Contract Sent</option>
                <option value="Confirmed Client">Confirmed Client</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Phone</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Facility</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">State</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Source</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Added By</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Product/Service</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Score</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Stage</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">$ Value/Year</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Date Contacted</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-600 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, index) => (
                  <tr key={lead.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`}>
                    <td className="py-4 px-4 text-sm text-slate-900 font-semibold whitespace-nowrap">{lead.name}</td>
                    <td className="py-4 px-4 text-sm text-slate-800 whitespace-nowrap">{lead.email}</td>
                    <td className="py-4 px-4 text-sm text-slate-800 whitespace-nowrap">{lead.phone}</td>
                    <td className="py-4 px-4 text-sm text-slate-800 whitespace-nowrap">{lead.facility}</td>
                    <td className="py-4 px-4 text-sm text-slate-800 whitespace-nowrap">{lead.state}</td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        lead.source === 'Assessment' ? 'bg-purple-100 text-purple-700' :
                        lead.source === 'Consultancy' ? 'bg-pink-100 text-pink-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-700 whitespace-nowrap">{lead.added_by || 'System'}</td>
                    <td className="py-4 px-4 text-sm text-slate-600 whitespace-nowrap">{lead.product_service}</td>
                    <td className="py-4 px-4 text-sm text-slate-700 font-semibold whitespace-nowrap">
                      {lead.score ? lead.score : '-'}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(lead.status, lead.closed_reason)}`}>
                        {lead.status}{lead.status === 'Closed' && lead.closed_reason ? ` (${lead.closed_reason})` : ''}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-700 font-medium whitespace-nowrap">
                      {lead.value_per_annum ? (
                        <span className="text-green-600">${lead.value_per_annum.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 whitespace-nowrap">
                      {formatDateToDDMMYY(lead.created_at)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => navigate(`/admin/leads/${lead.id}`)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id, lead.name)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLeads.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                {searchTerm || statusFilter !== 'All' ? 'No leads match your filters' : 'No leads yet'}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['leads'] });
          }}
        />
      )}

      {showManageServices && (
        <ManageServicesModal onClose={() => setShowManageServices(false)} />
      )}
    </AdminLayout>
  );
}
