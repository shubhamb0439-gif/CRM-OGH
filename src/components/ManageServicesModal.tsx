import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Eye, EyeOff, Trash2, Save } from 'lucide-react';

type Service = {
  id: string;
  name: string;
  description?: string;
  category: 'Service' | 'Innovation';
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
};

export default function ManageServicesModal({ onClose }: { onClose: () => void }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    category: 'Service' as 'Service' | 'Innovation'
  });
  const [activeTab, setActiveTab] = useState<'Service' | 'Innovation'>('Service');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category')
        .order('sort_order')
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      alert('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const addService = async () => {
    if (!newService.name.trim()) {
      alert('Please enter a service name');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('services')
        .insert({
          name: newService.name.trim(),
          description: newService.description.trim() || null,
          category: newService.category,
          is_visible: true,
          sort_order: 0,
          created_by: user?.email || null
        });

      if (error) {
        if (error.code === '23505') {
          alert('A service with this name already exists');
        } else {
          throw error;
        }
        return;
      }

      await fetchServices();
      setNewService({ name: '', description: '', category: 'Service' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Failed to add service');
    }
  };

  const toggleVisibility = async (serviceId: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_visible: !currentVisibility, updated_at: new Date().toISOString() })
        .eq('id', serviceId);

      if (error) throw error;
      await fetchServices();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to update visibility');
    }
  };

  const deleteService = async (serviceId: string, serviceName: string) => {
    if (!confirm(`Are you sure you want to delete "${serviceName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      await fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    }
  };

  const filteredServices = services.filter(s => s.category === activeTab);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Manage Services</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('Service')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'Service'
                  ? 'bg-[#531B93] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Services ({services.filter(s => s.category === 'Service').length})
            </button>
            <button
              onClick={() => setActiveTab('Innovation')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'Innovation'
                  ? 'bg-[#531B93] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Innovations ({services.filter(s => s.category === 'Innovation').length})
            </button>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#531B93] to-[#2563EB] text-white px-4 py-2 rounded-lg hover:from-[#3d1470] hover:to-[#1d4ed8] transition-all shadow-md mb-6"
          >
            <Plus className="w-5 h-5" />
            <span>Add New {activeTab}</span>
          </button>

          {showAddForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-slate-800 mb-4">Add New {activeTab}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
                    placeholder="Enter service name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
                    rows={3}
                    placeholder="Enter description (optional)"
                  />
                </div>
                <input type="hidden" value={activeTab} onChange={(e) => setNewService({ ...newService, category: e.target.value as 'Service' | 'Innovation' })} />
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setNewService({ ...newService, category: activeTab });
                      addService();
                    }}
                    className="flex items-center space-x-2 bg-[#531B93] text-white px-6 py-2 rounded-lg hover:bg-[#3d1470] transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewService({ name: '', description: '', category: 'Service' });
                    }}
                    className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-600">Loading...</div>
          ) : (
            <div className="space-y-3">
              {filteredServices.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  No {activeTab.toLowerCase()}s found. Click "Add New {activeTab}" to create one.
                </div>
              ) : (
                filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      service.is_visible
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50 border-slate-300 opacity-60'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-slate-800">{service.name}</h3>
                        {service.is_visible ? (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Visible on Frontend
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 bg-slate-200 text-slate-600 text-xs font-medium rounded">
                            Hidden from Frontend
                          </span>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleVisibility(service.id, service.is_visible)}
                        className={`p-2 rounded-lg transition-colors ${
                          service.is_visible
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title={service.is_visible ? 'Hide from frontend' : 'Show on frontend'}
                      >
                        {service.is_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => deleteService(service.id, service.name)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete service"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
