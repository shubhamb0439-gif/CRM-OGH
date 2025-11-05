import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, ConsultancyBooking } from '../lib/supabase';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { usePageVisibility } from '../hooks/usePageVisibility';
import AdminLayout from '../components/AdminLayout';
import { Calendar, Clock, Mail, Phone, Building2, MapPin, Globe, Package, X } from 'lucide-react';

async function fetchBookings(): Promise<ConsultancyBooking[]> {
  const { data, error } = await supabase
    .from('consultancy_bookings_v2')
    .select('*')
    .order('created_at', { ascending: false});
  if (error) throw error;
  return data || [];
}

async function updateBookingStatus(params: { id: string; status: string }): Promise<void> {
  const { error } = await supabase
    .from('consultancy_bookings_v2')
    .update({ status: params.status })
    .eq('id', params.id);
  if (error) throw error;
}

async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase
    .from('consultancy_bookings_v2')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export default function BookingSubmissions() {
  const [selectedBooking, setSelectedBooking] = useState<ConsultancyBooking | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const queryClient = useQueryClient();
  const isVisible = usePageVisibility();

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: fetchBookings,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const updateMutation = useMutation({
    mutationFn: updateBookingStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: () => {
      alert('Failed to update status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setSelectedBooking(null);
    },
    onError: () => {
      alert('Failed to delete booking');
    },
  });

  useRealtimeSubscription(
    'bookings_changes',
    'consultancy_bookings_v2',
    () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  );

  useEffect(() => {
    if (isVisible) {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  }, [isVisible, queryClient]);

  const handleUpdateStatus = (id: string, status: string) => {
    updateMutation.mutate({ id, status });
  };

  const handleDeleteBooking = (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    deleteMutation.mutate(id);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Reviewed': 'bg-blue-100 text-blue-700',
      'Scheduled': 'bg-green-100 text-green-700',
      'Completed': 'bg-slate-100 text-slate-700',
      'Cancelled': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const filteredBookings = filterStatus === 'all'
    ? bookings
    : bookings.filter(b => b.status === filterStatus);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading bookings...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading bookings. Please refresh the page.</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Consultancy Bookings</h1>
            <p className="text-slate-600">Manage consultation requests</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <div className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-medium">
              Total: {filteredBookings.length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{booking.full_name}</h3>
                    <p className="text-sm text-slate-600">{booking.reason}</p>
                    <p className="text-sm text-blue-600 font-medium mt-1">{booking.product_service}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700 truncate">{booking.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{booking.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700 truncate">{booking.facility}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{booking.city}, {booking.state}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">
                      {new Date(booking.preferred_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">{booking.preferred_time}</span>
                  </div>
                </div>

                {booking.ist_time && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-700 font-medium">IST: {booking.ist_time}</span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 mt-4 pt-4 border-t border-slate-200">
                  {['Pending', 'Reviewed', 'Scheduled', 'Completed'].map((status) => (
                    <button
                      key={status}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(booking.id, status);
                      }}
                      disabled={booking.status === status}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        booking.status === status
                          ? 'bg-blue-100 text-[#2563EB] cursor-not-allowed'
                          : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-[#2563EB]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12 text-slate-600">
              {filterStatus === 'all'
                ? 'No consultation bookings yet.'
                : `No bookings with status "${filterStatus}".`}
            </div>
          )}
        </div>
      </div>

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdateStatus={(status) => {
            handleUpdateStatus(selectedBooking.id, status);
            setSelectedBooking({ ...selectedBooking, status });
          }}
          onDelete={() => handleDeleteBooking(selectedBooking.id)}
        />
      )}
    </AdminLayout>
  );
}

function BookingDetailModal({
  booking,
  onClose,
  onUpdateStatus,
  onDelete
}: {
  booking: ConsultancyBooking;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Booking Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                booking.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                booking.status === 'Scheduled' ? 'bg-green-100 text-green-700' :
                booking.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                'bg-red-100 text-red-700'
              }`}>
                {booking.status}
              </span>
            </div>
            <div className="text-sm text-slate-500">
              ID: {booking.id.substring(0, 8)}...
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Full Name</p>
              <p className="text-slate-800 font-medium">{booking.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Email</p>
              <p className="text-slate-800 font-medium break-all">{booking.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Phone</p>
              <p className="text-slate-800 font-medium">{booking.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Facility</p>
              <p className="text-slate-800 font-medium">{booking.facility}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Country</p>
              <p className="text-slate-800 font-medium">{booking.country}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">State</p>
              <p className="text-slate-800 font-medium">{booking.state}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">City</p>
              <p className="text-slate-800 font-medium">{booking.city}</p>
            </div>
          </div>

          {booking.website && (
            <div>
              <p className="text-sm text-slate-600 mb-1">Website</p>
              <a
                href={booking.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                {booking.website}
              </a>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Reason for Consultation</p>
              <p className="text-slate-800 font-medium">{booking.reason}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Product/Service of Interest</p>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" />
                <p className="text-slate-800 font-medium">{booking.product_service}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Appointment Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Preferred Date</p>
                <p className="text-slate-800 font-medium">
                  {new Date(booking.preferred_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Timezone</p>
                <p className="text-slate-800 font-medium">{booking.timezone}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Preferred Time ({booking.timezone})</p>
                <p className="text-slate-800 font-medium">{booking.preferred_time}</p>
              </div>
              {booking.ist_time && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Time in IST</p>
                  <p className="text-blue-700 font-semibold">{booking.ist_time}</p>
                </div>
              )}
            </div>
          </div>

          {booking.ist_time && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 font-medium mb-1">Indian Standard Time (IST)</p>
              <p className="text-blue-900 font-semibold text-lg">{booking.ist_time}</p>
              <p className="text-xs text-blue-600 mt-1">Schedule your call at this time in India</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Submitted On</p>
              <p className="text-slate-800 font-medium">
                {new Date(booking.created_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Last Updated</p>
              <p className="text-slate-800 font-medium">
                {new Date(booking.updated_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-600 mb-3 font-medium">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {['Pending', 'Reviewed', 'Scheduled', 'Completed', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => onUpdateStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    booking.status === status
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-[#2563EB]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Close
            </button>
            <button
              onClick={onDelete}
              className="px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
            >
              Delete Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
