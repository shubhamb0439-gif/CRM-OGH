import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Lead, ConsultancyBooking } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';
import { ArrowLeft, Mail, Phone, Building2, MapPin, Award, Calendar, MessageSquare, DollarSign, Save, RefreshCw, Clock } from 'lucide-react';
import { formatDateTimeToLocal } from '../lib/dateUtils';

export default function LeadProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [booking, setBooking] = useState<ConsultancyBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [valuePerAnnum, setValuePerAnnum] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [enableEdit, setEnableEdit] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLead();
    }
  }, [id]);

  const fetchLead = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setLead(data);
      setValuePerAnnum(data?.value_per_annum?.toString() || '');
      setNotes(data?.notes || '');

      if (data?.source === 'Consultancy') {
        const { data: bookingData } = await supabase
          .from('consultancy_bookings_v2')
          .select('*')
          .eq('email', data.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (bookingData) {
          setBooking(bookingData);
        }
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!lead) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', lead.id);

      if (error) throw error;
      setLead({ ...lead, status });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const saveValuePerAnnum = async () => {
    if (!lead) return;
    setUpdating(true);

    try {
      const value = valuePerAnnum ? parseFloat(valuePerAnnum) : null;
      const { error } = await supabase
        .from('leads')
        .update({ value_per_annum: value })
        .eq('id', lead.id);

      if (error) throw error;
      setLead({ ...lead, value_per_annum: value || undefined });
      setIsEditingValue(false);
    } catch (error) {
      console.error('Error updating value:', error);
      alert('Failed to update value');
    } finally {
      setUpdating(false);
    }
  };

  const saveNotes = async () => {
    if (!lead) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes })
        .eq('id', lead.id);

      if (error) throw error;
      setLead({ ...lead, notes });
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Failed to update notes');
    } finally {
      setUpdating(false);
    }
  };

  const closeLead = async (reason: string) => {
    if (!lead) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'Closed', closed_reason: reason })
        .eq('id', lead.id);

      if (error) throw error;
      setLead({ ...lead, status: 'Closed', closed_reason: reason });
    } catch (error) {
      console.error('Error closing lead:', error);
      alert('Failed to close lead');
    } finally {
      setUpdating(false);
    }
  };

  const getEfficiencyColor = (level?: string) => {
    if (!level) return '';
    const colors: Record<string, string> = {
      'Good Efficiency': 'bg-green-100 text-green-700 border-green-200',
      'Moderate Efficiency': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Needs Improvement': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[level] || '';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading lead details...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!lead) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-slate-600 mb-4">Lead not found</p>
          <button
            onClick={() => navigate('/admin/leads')}
            className="text-[#2563EB] hover:text-[#1d4ed8]"
          >
            Back to Leads
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <button
            onClick={() => navigate('/admin/leads')}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Leads</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{lead.name}</h1>
              <p className="text-slate-600">Lead Profile Details</p>
            </div>
            <div className="flex space-x-3">
              {lead.status === 'Closed' ? (
                <button
                  onClick={() => {
                    setEnableEdit(!enableEdit);
                    if (!enableEdit) {
                      updateStatus('New');
                    }
                  }}
                  disabled={updating}
                  className="px-4 py-2 bg-[#531B93] text-white rounded-lg hover:bg-[#3d1470] transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reopen Lead</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => closeLead('Not Interested')}
                    disabled={updating}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Close - Not Interested
                  </button>
                  <button
                    onClick={() => closeLead('Confirmed Client')}
                    disabled={updating}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                  >
                    Close - Confirmed Client
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="text-slate-800 font-medium">{lead.email}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-600">Phone</p>
                    <p className="text-slate-800 font-medium">{lead.phone}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-600">Facility</p>
                    <p className="text-slate-800 font-medium">{lead.facility}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-600">State</p>
                    <p className="text-slate-800 font-medium">{lead.state}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Lead Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Source</p>
                  <p className="text-slate-800 font-medium">{lead.source}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Product/Service</p>
                  <p className="text-slate-800 font-medium">{lead.product_service}</p>
                </div>
                {lead.score && (
                  <>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Assessment Score</p>
                      <div className="flex items-center space-x-2">
                        <Award className="w-5 h-5 text-[#2563EB]" />
                        <p className="text-slate-800 font-bold text-lg">{lead.score}/100</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-2">Efficiency Level</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getEfficiencyColor(lead.efficiency_level)}`}>
                        {lead.efficiency_level}
                      </span>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm text-slate-600 mb-1">Date Added</p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <p className="text-slate-800 font-medium">
                      {formatDateTimeToLocal(lead.created_at)}
                    </p>
                  </div>
                </div>
                {lead.added_by && (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Added By</p>
                    <p className="text-slate-800 font-medium">{lead.added_by}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-600 mb-1">Last Updated</p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <p className="text-slate-800 font-medium">
                      {formatDateTimeToLocal(lead.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {booking && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <h2 className="text-lg font-semibold text-blue-900">Consultation Booking Details</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Preferred Date</p>
                    <p className="text-blue-900 font-medium">
                      {new Date(booking.preferred_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Preferred Time ({booking.timezone})</p>
                    <p className="text-blue-900 font-medium">{booking.preferred_time}</p>
                  </div>
                  {booking.ist_time && (
                    <div className="md:col-span-2 bg-white rounded-lg p-4 border-2 border-blue-300">
                      <p className="text-sm text-blue-700 font-semibold mb-1">Indian Standard Time (IST)</p>
                      <p className="text-blue-900 font-bold text-xl">{booking.ist_time}</p>
                      <p className="text-xs text-blue-600 mt-1">Schedule your call at this time in India</p>
                    </div>
                  )}
                  {booking.website && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-blue-700 mb-1">Website</p>
                      <a
                        href={booking.website.startsWith('http') ? booking.website : `https://${booking.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {booking.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-slate-800">Value per Annum</h2>
                </div>
                {!isEditingValue && (
                  <button
                    onClick={() => setIsEditingValue(true)}
                    className="text-[#2563EB] hover:text-[#1d4ed8] text-sm font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>
              {isEditingValue ? (
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600">$</span>
                    <input
                      type="number"
                      value={valuePerAnnum}
                      onChange={(e) => setValuePerAnnum(e.target.value)}
                      placeholder="Enter annual contract value"
                      className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={saveValuePerAnnum}
                      disabled={updating}
                      className="flex items-center space-x-1 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setValuePerAnnum(lead.value_per_annum?.toString() || '');
                        setIsEditingValue(false);
                      }}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {lead.value_per_annum ? `$${lead.value_per_annum.toLocaleString()}` : 'Not set'}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-slate-600" />
                  <h2 className="text-lg font-semibold text-slate-800">Notes</h2>
                </div>
                {!isEditingNotes && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-[#2563EB] hover:text-[#1d4ed8] text-sm font-medium"
                  >
                    {lead.notes ? 'Edit' : 'Add Notes'}
                  </button>
                )}
              </div>
              {isEditingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this lead..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    rows={6}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={saveNotes}
                      disabled={updating}
                      className="flex items-center space-x-1 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setNotes(lead.notes || '');
                        setIsEditingNotes(false);
                      }}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-slate-700 whitespace-pre-wrap">
                  {lead.notes || <span className="text-slate-400 italic">No notes added yet</span>}
                </div>
              )}
            </div>

            {lead.comments && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-slate-600" />
                  <h2 className="text-lg font-semibold text-slate-800">Comments / Challenges</h2>
                </div>
                <p className="text-slate-700 leading-relaxed">{lead.comments}</p>
              </div>
            )}

            {lead.status === 'Closed' && lead.closed_reason && (
              <div className={`rounded-xl border-2 p-6 ${
                lead.closed_reason === 'Confirmed Client'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <h2 className="text-lg font-semibold mb-2">
                  {lead.closed_reason === 'Confirmed Client' ? 'Confirmed Client' : 'Not Interested'}
                </h2>
                <p className={lead.closed_reason === 'Confirmed Client' ? 'text-green-700' : 'text-red-700'}>
                  This lead has been closed as: {lead.closed_reason}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Update Status</h2>
              <div className="space-y-2">
                {['New', 'Contacted', 'Qualified Prospect', 'Contract Sent', 'Confirmed Client'].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    disabled={updating || lead.status === 'Closed'}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all disabled:opacity-50 ${
                      lead.status === status
                        ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] font-semibold'
                        : 'border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {lead.status === 'Closed' && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    This lead is closed and cannot be updated.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-[#531B93] to-[#2563EB] rounded-xl shadow-sm p-6 text-white">
              <h3 className="font-semibold mb-2">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-90">Days since created:</span>
                  <span className="font-semibold">
                    {Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-90">Current status:</span>
                  <span className="font-semibold">{lead.status}</span>
                </div>
                {lead.value_per_annum && (
                  <div className="flex justify-between">
                    <span className="opacity-90">Annual value:</span>
                    <span className="font-semibold">${lead.value_per_annum.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
