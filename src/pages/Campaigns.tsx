import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Campaign } from '../lib/supabase';
import { usePageVisibility } from '../hooks/usePageVisibility';
import AdminLayout from '../components/AdminLayout';
import { Plus, Edit2, Archive, Trash2, X } from 'lucide-react';

async function fetchCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export default function Campaigns() {
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const queryClient = useQueryClient();
  const isVisible = usePageVisibility();

  const { data: campaigns = [], isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: () => {
      alert('Failed to delete campaign');
    },
  });

  useEffect(() => {
    if (isVisible) {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    }
  }, [isVisible, queryClient]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Active': 'bg-green-100 text-green-700',
      'Paused': 'bg-yellow-100 text-yellow-700',
      'Completed': 'bg-blue-100 text-blue-700',
      'Archived': 'bg-slate-100 text-slate-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const handleDeleteCampaign = (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading campaigns...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading campaigns. Please refresh the page.</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Campaigns</h1>
            <p className="text-slate-600">Create and manage marketing campaigns</p>
          </div>
          <button
            onClick={() => {
              setEditingCampaign(null);
              setShowModal(true);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#531B93] to-[#2563EB] text-white px-4 py-2 rounded-lg hover:from-[#3d1470] hover:to-[#1d4ed8] transition-all shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Create Campaign</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">{campaign.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingCampaign(campaign);
                      setShowModal(true);
                    }}
                    className="text-slate-400 hover:text-[#2563EB] transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {campaign.description && (
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>
              )}

              <div className="space-y-2 text-sm">
                {campaign.target_audience && (
                  <div>
                    <span className="text-slate-500">Target: </span>
                    <span className="text-slate-700 font-medium">{campaign.target_audience}</span>
                  </div>
                )}
                {campaign.budget && (
                  <div>
                    <span className="text-slate-500">Budget: </span>
                    <span className="text-green-600 font-semibold">${campaign.budget.toLocaleString()}</span>
                  </div>
                )}
                {campaign.start_date && (
                  <div>
                    <span className="text-slate-500">Start: </span>
                    <span className="text-slate-700">{new Date(campaign.start_date).toLocaleDateString()}</span>
                  </div>
                )}
                {campaign.end_date && (
                  <div>
                    <span className="text-slate-500">End: </span>
                    <span className="text-slate-700">{new Date(campaign.end_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">No campaigns created yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-[#2563EB] hover:text-[#1d4ed8] font-medium"
            >
              Create your first campaign
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <CampaignModal
          campaign={editingCampaign}
          onClose={() => {
            setShowModal(false);
            setEditingCampaign(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingCampaign(null);
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
          }}
        />
      )}
    </AdminLayout>
  );
}

function CampaignModal({
  campaign,
  onClose,
  onSuccess
}: {
  campaign: Campaign | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    description: campaign?.description || '',
    target_audience: campaign?.target_audience || '',
    start_date: campaign?.start_date || '',
    end_date: campaign?.end_date || '',
    budget: campaign?.budget?.toString() || '',
    status: campaign?.status || 'Active'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      if (campaign) {
        const { error } = await supabase
          .from('campaigns')
          .update(data)
          .eq('id', campaign.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('campaigns')
          .insert(data);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          {campaign ? 'Edit Campaign' : 'Create New Campaign'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Target Audience
            </label>
            <input
              type="text"
              value={formData.target_audience}
              onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
              placeholder="e.g., Healthcare professionals in California"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Budget
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600">$</span>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
                placeholder="Enter campaign budget"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
              required
            >
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Completed">Completed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#531B93] to-[#2563EB] text-white px-4 py-2 rounded-lg hover:from-[#3d1470] hover:to-[#1d4ed8] transition-all disabled:opacity-50 shadow-md"
            >
              {loading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
