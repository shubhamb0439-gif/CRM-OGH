import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, X, Clock } from 'lucide-react';
import { TIMEZONES, TIME_SLOTS_24H, convertTimeToIST, formatTimeRange, getNextHour, convertToUTC, getAvailableSlots } from '../lib/timezoneUtils';

const CONSULTATION_REASONS = [
  'Job Inquiry',
  'Sales Inquiry'
];

const COUNTRIES = [
  { name: 'United States', code: 'US', phonePrefix: '+1', phoneLength: 10 },
  { name: 'Canada', code: 'CA', phonePrefix: '+1', phoneLength: 10 },
  { name: 'United Kingdom', code: 'UK', phonePrefix: '+44', phoneLength: 10 },
  { name: 'Australia', code: 'AU', phonePrefix: '+61', phoneLength: 9 },
  { name: 'India', code: 'IN', phonePrefix: '+91', phoneLength: 10 },
  { name: 'Germany', code: 'DE', phonePrefix: '+49', phoneLength: 10 },
  { name: 'France', code: 'FR', phonePrefix: '+33', phoneLength: 9 },
  { name: 'Japan', code: 'JP', phonePrefix: '+81', phoneLength: 10 },
  { name: 'China', code: 'CN', phonePrefix: '+86', phoneLength: 11 },
  { name: 'Brazil', code: 'BR', phonePrefix: '+55', phoneLength: 11 },
  { name: 'Mexico', code: 'MX', phonePrefix: '+52', phoneLength: 10 },
  { name: 'South Africa', code: 'ZA', phonePrefix: '+27', phoneLength: 9 },
  { name: 'Singapore', code: 'SG', phonePrefix: '+65', phoneLength: 8 },
  { name: 'United Arab Emirates', code: 'AE', phonePrefix: '+971', phoneLength: 9 },
  { name: 'Saudi Arabia', code: 'SA', phonePrefix: '+966', phoneLength: 9 },
  { name: 'Netherlands', code: 'NL', phonePrefix: '+31', phoneLength: 9 },
  { name: 'Spain', code: 'ES', phonePrefix: '+34', phoneLength: 9 },
  { name: 'Italy', code: 'IT', phonePrefix: '+39', phoneLength: 10 },
  { name: 'South Korea', code: 'KR', phonePrefix: '+82', phoneLength: 10 },
  { name: 'New Zealand', code: 'NZ', phonePrefix: '+64', phoneLength: 9 }
];

const STATES_BY_COUNTRY: Record<string, string[]> = {
  'US': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
  'CA': ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'],
  'UK': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  'AU': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Northern Territory', 'Australian Capital Territory'],
  'IN': ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'],
  'DE': ['Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'],
  'FR': ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie', 'Hauts-de-France', 'Brittany', 'Normandy', 'Grand Est', 'Pays de la Loire', 'Burgundy-Franche-Comté', 'Centre-Val de Loire', 'Corsica'],
  'AE': ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']
};

const toSentenceCase = (str: string): string => {
  return str.trim().toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
};

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  facility: string;
  website: string;
  product_service: string;
  reason: string;
  preferred_date: string;
  timezone: string;
  preferred_time: string;
}

export default function ConsultancyBooking() {
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    facility: '',
    website: '',
    product_service: '',
    reason: '',
    preferred_date: '',
    timezone: '',
    preferred_time: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [istTime, setIstTime] = useState<string>('');
  const [productServices, setProductServices] = useState<string[]>([]);

  useEffect(() => {
    fetchProductServices();
  }, []);

  const fetchProductServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('name')
      .eq('is_visible', true)
      .order('sort_order')
      .order('name');
    if (data) {
      setProductServices(data.map(item => item.name));
    }
  };

  useEffect(() => {
    if (formData.country) {
      setAvailableStates(STATES_BY_COUNTRY[formData.country] || []);
      setFormData(prev => ({ ...prev, state: '', city: '' }));
    }
  }, [formData.country]);

  useEffect(() => {
    if (formData.preferred_date && formData.timezone) {
      fetchAvailableSlots(formData.preferred_date, formData.timezone);
    }
  }, [formData.preferred_date, formData.timezone]);

  useEffect(() => {
    if (formData.preferred_time && formData.timezone && formData.preferred_date) {
      const converted = convertTimeToIST(formData.preferred_date, formData.preferred_time, formData.timezone);
      setIstTime(converted);
    } else {
      setIstTime('');
    }
  }, [formData.preferred_time, formData.timezone, formData.preferred_date]);

  const fetchAvailableSlots = async (date: string, timezone: string) => {
    try {
      const { data, error } = await supabase
        .from('booking_slots')
        .select('time_slot_utc')
        .eq('is_booked', true);

      if (error) throw error;

      const bookedUTC = data?.map(slot => ({ time_slot_utc: slot.time_slot_utc })) || [];
      const available = getAvailableSlots(bookedUTC, date, timezone);
      setAvailableTimeSlots(available);

      if (!available.includes(formData.preferred_time)) {
        setFormData(prev => ({ ...prev, preferred_time: '' }));
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableTimeSlots(TIME_SLOTS_24H);
    }
  };

  const handleReasonChange = (reason: string) => {
    setFormData({ ...formData, reason });
    if (reason === 'Job Inquiry') {
      setShowJobModal(true);
    }
  };

  const validatePhone = (phone: string, countryCode: string): boolean => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (!country) return false;

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== country.phoneLength) {
      setPhoneError(`Phone number must be ${country.phoneLength} digits`);
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleTextChange = (field: keyof FormData, value: string) => {
    const formattedValue = toSentenceCase(value);
    setFormData({ ...formData, [field]: formattedValue });
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: value });
    if (formData.country && value) {
      validatePhone(value, formData.country);
    }
  };

  const getPhonePrefix = (): string => {
    const country = COUNTRIES.find(c => c.code === formData.country);
    return country?.phonePrefix || '';
  };

  const getCountryName = (code: string): string => {
    const country = COUNTRIES.find(c => c.code === code);
    return country?.name || code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.reason === 'Job Inquiry') {
      setShowJobModal(true);
      return;
    }

    if (formData.phone && !validatePhone(formData.phone, formData.country)) {
      alert('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const fullName = `${formData.first_name} ${formData.last_name}`;
      const phonePrefix = getPhonePrefix();
      const fullPhone = formData.phone ? `${phonePrefix} ${formData.phone}` : null;
      const selectedTimezone = TIMEZONES.find(tz => tz.value === formData.timezone);
      const countryName = getCountryName(formData.country);

      const utcDateTime = convertToUTC(formData.preferred_date, formData.preferred_time, formData.timezone);
      const formattedTime = formatTimeRange(formData.preferred_time, getNextHour(formData.preferred_time));
      const formattedISTTime = istTime ? formatTimeRange(istTime, getNextHour(istTime)) : null;

      const bookingData = {
        full_name: fullName,
        email: formData.email.toLowerCase(),
        phone: fullPhone,
        country: countryName,
        state: formData.state,
        city: formData.city,
        facility: formData.facility,
        website: formData.website || null,
        product_service: formData.product_service,
        reason: formData.reason,
        preferred_date: formData.preferred_date,
        preferred_time: formattedTime,
        timezone: selectedTimezone?.name || formData.timezone,
        timezone_value: formData.timezone,
        ist_time: formattedISTTime,
        status: 'Pending'
      };

      const { data: insertedBooking, error: bookingError } = await supabase
        .from('consultancy_bookings_v2')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) {
        console.error('Booking error:', bookingError);
        throw new Error('Failed to submit booking');
      }

      const { error: slotError } = await supabase
        .from('booking_slots')
        .insert({
          booking_date: formData.preferred_date,
          time_slot: formData.preferred_time,
          time_slot_utc: utcDateTime.toISOString(),
          timezone: formData.timezone,
          is_booked: true,
          booking_id: insertedBooking.id
        });

      if (slotError) {
        console.error('Slot booking error:', slotError);
      }

      const { error: leadError } = await supabase
        .from('leads')
        .insert({
          name: fullName,
          email: formData.email.toLowerCase(),
          phone: fullPhone || 'N/A',
          facility: formData.facility,
          state: formData.state,
          source: 'Consultancy',
          product_service: formData.product_service,
          comments: `Consultation Booking - Reason: ${formData.reason} | Product: ${formData.product_service} | Country: ${countryName} | City: ${formData.city} | Website: ${formData.website || 'N/A'} | Preferred: ${formattedTime} ${selectedTimezone?.name} | IST: ${formattedISTTime || 'N/A'} | Date: ${formData.preferred_date}`,
          status: 'New'
        });

      if (leadError) {
        console.error('Lead creation error:', leadError);
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4 overflow-auto">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Booking Confirmed!
          </h2>
          <p className="text-slate-600 mb-6">
            Thank you for booking a consultation. Our team will reach out to you shortly to confirm the appointment details.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#2563EB] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors shadow-md"
          >
            Book Another Consultation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 overflow-auto">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <img src="/og logo.png" alt="Healthcare CRM" className="h-16 w-auto" />
          </div>

          <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">
            Book a Free Consultation
          </h1>
          <p className="text-center text-slate-600 mb-8">
            Schedule your personalized healthcare efficiency consultation
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type of Inquiry *
              </label>
              <select
                value={formData.reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                style={{ color: formData.reason ? '#0f172a' : '#64748b' }}
                required
              >
                <option value="">Select inquiry type</option>
                {CONSULTATION_REASONS.map((reason) => (
                  <option key={reason} value={reason} style={{ color: '#0f172a' }}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {formData.reason === 'Sales Inquiry' && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleTextChange('first_name', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-slate-500"
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleTextChange('last_name', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-slate-500"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Country *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      style={{ color: formData.country ? '#0f172a' : '#64748b' }}
                      required
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code} style={{ color: '#0f172a' }}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number <span className="text-slate-400 text-xs">(Optional)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={getPhonePrefix()}
                        disabled
                        className="w-20 px-4 py-3 border border-slate-300 rounded-lg bg-slate-100 text-slate-600 font-semibold"
                      />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-slate-500"
                        placeholder="1234567890"
                        disabled={!formData.country}
                      />
                    </div>
                    {phoneError && (
                      <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      State *
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      style={{ color: formData.state ? '#0f172a' : '#64748b' }}
                      disabled={!formData.country}
                      required
                    >
                      <option value="">Select State</option>
                      {availableStates.map((state) => (
                        <option key={state} value={state} style={{ color: '#0f172a' }}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleTextChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-slate-500"
                      placeholder="Enter city name"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-slate-500"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Website *
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-slate-500"
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hospital/Facility Name *
                  </label>
                  <input
                    type="text"
                    value={formData.facility}
                    onChange={(e) => handleTextChange('facility', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-slate-500"
                    placeholder="Enter facility name"
                    required
                  />
                </div>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        value={formData.preferred_date}
                        onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value, preferred_time: '' })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Time Zone *
                      </label>
                      <select
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value, preferred_time: '' })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        style={{ color: formData.timezone ? '#0f172a' : '#64748b' }}
                        required
                      >
                        <option value="">Select your timezone</option>
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value} style={{ color: '#0f172a' }}>
                            {tz.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Preferred Time Slot *
                    </label>
                    <select
                      value={formData.preferred_time}
                      onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      style={{ color: formData.preferred_time ? '#0f172a' : '#64748b' }}
                      disabled={!formData.preferred_date || !formData.timezone}
                      required
                    >
                      <option value="">Select a time slot</option>
                      {availableTimeSlots.map((slot) => (
                        <option key={slot} value={slot} style={{ color: '#0f172a' }}>
                          {formatTimeRange(slot, getNextHour(slot))}
                        </option>
                      ))}
                    </select>
                    {!formData.preferred_date && (
                      <p className="text-sm text-slate-500 mt-2">Please select a date first</p>
                    )}
                    {!formData.timezone && formData.preferred_date && (
                      <p className="text-sm text-slate-500 mt-2">Please select your timezone</p>
                    )}
                    {availableTimeSlots.length === 0 && formData.preferred_date && formData.timezone && (
                      <p className="text-sm text-amber-600 mt-2">No available time slots for this date. Please select another date.</p>
                    )}
                  </div>

                  {istTime && formData.timezone && formData.preferred_time && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-blue-800">
                        <Clock className="w-5 h-5" />
                        <div>
                          <p className="font-semibold">Time in India (IST)</p>
                          <p className="text-sm">
                            Your selected time will be <strong>{formatTimeRange(istTime, getNextHour(istTime))}</strong> in Indian Standard Time
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] text-white py-4 rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Confirming Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>

      {showJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowJobModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">
                  Redirecting to Careers
                </h2>
                <p className="text-slate-600 mb-6">
                  For job enquiries, please visit our careers page to view available positions and submit your application.
                </p>
                <a
                  href="https://careers.oghealthcare.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#2563EB] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors shadow-md text-center"
                >
                  Go to Careers Page
                </a>
                <button
                  onClick={() => {
                    setShowJobModal(false);
                    setFormData({ ...formData, reason: '' });
                  }}
                  className="w-full mt-3 px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
