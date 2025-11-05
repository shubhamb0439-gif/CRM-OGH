import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import { COUNTRIES, STATES_BY_COUNTRY } from '../lib/constants';

const SOURCES = ['LinkedIn', 'WhatsApp', 'Call', 'Email', 'Referral', 'Existing Client', 'Ex-Client'];

export default function AddLeadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    facility: '',
    country: '',
    state: '',
    source: ''
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedInnovation, setSelectedInnovation] = useState<string>('');
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  const [innovations, setInnovations] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      try {
        await Promise.all([fetchServices(), fetchInnovations()]);
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchServices = async () => {
    try {
      console.log('Fetching services from services table...');
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .eq('category', 'Service')
        .eq('is_visible', true)
        .order('sort_order')
        .order('name');

      if (error) {
        console.error('Error fetching services:', error);
        throw error;
      }
      console.log('Services fetched successfully:', data);
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchInnovations = async () => {
    try {
      console.log('Fetching innovations from services table...');
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .eq('category', 'Innovation')
        .eq('is_visible', true)
        .order('sort_order')
        .order('name');

      if (error) {
        console.error('Error fetching innovations:', error);
        throw error;
      }
      console.log('Innovations fetched successfully:', data);
      setInnovations(data || []);
    } catch (error) {
      console.error('Error fetching innovations:', error);
    }
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedServices.length === 0 && !selectedInnovation) {
      alert('Please select at least one service or innovation product');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      let adminName = '';
      if (user?.email) {
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('name')
          .eq('email', user.email)
          .maybeSingle();

        if (adminData) {
          adminName = adminData.name || user.email;
        }
      }

      const productService = selectedInnovation || selectedServices[0];

      const { error } = await supabase
        .from('leads')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          facility: formData.facility,
          country: formData.country || null,
          state: formData.state || null,
          source: formData.source,
          product_service: productService,
          selected_services: selectedServices,
          status: 'New',
          added_by: adminName || user?.email || 'Admin',
          added_by_email: user?.email || null
        });

      if (error) {
        console.error('Error adding lead:', error);
        throw error;
      }

      console.log('Lead added successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error adding lead:', error);
      alert(`Failed to add lead: ${error.message || 'Please try again.'}`);
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

        <h2 className="text-2xl font-bold text-slate-800 mb-6">Add New Lead</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Facility *</label>
            <input
              type="text"
              value={formData.facility}
              onChange={(e) => setFormData({ ...formData, facility: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '' })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
                disabled={!formData.country}
              >
                <option value="">Select state</option>
                {formData.country && STATES_BY_COUNTRY[formData.country]?.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Source *</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
              required
            >
              <option value="">Select source</option>
              {SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Products/Services *
            </label>
            <div className="space-y-3 bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {dataLoading && (
                <p className="text-slate-500 text-center py-4">Loading services...</p>
              )}
              {!dataLoading && services.length === 0 && (
                <p className="text-amber-600 text-center py-4">No services available. Please contact administrator.</p>
              )}
              {!dataLoading && services.map((service) => (
                <label
                  key={service.id}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-slate-100 p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.name)}
                    onChange={() => handleServiceToggle(service.name)}
                    className="w-5 h-5 text-[#531B93] rounded focus:ring-2 focus:ring-[#531B93]"
                  />
                  <span className="text-slate-700 font-medium">{service.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Products & Innovation
            </label>
            <select
              value={selectedInnovation}
              onChange={(e) => setSelectedInnovation(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93]"
            >
              <option value="">Select an innovation product (optional)</option>
              {innovations.map((product) => (
                <option key={product.id} value={product.name}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#14B8A6] text-white px-4 py-3 rounded-lg hover:bg-[#0f9b8e] transition-all disabled:opacity-50 shadow-md font-semibold"
            >
              {loading ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
