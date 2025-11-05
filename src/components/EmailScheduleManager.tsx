import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Clock, Send, CheckCircle, XCircle } from 'lucide-react';

interface EmailSchedule {
  id: string;
  report_type: 'weekly' | 'monthly';
  recipient_emails: string[];
  is_active: boolean;
  last_sent_at: string | null;
}

export default function EmailScheduleManager() {
  const [schedules, setSchedules] = useState<EmailSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_schedules')
        .select('*')
        .order('report_type');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('email_schedules')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;
      await fetchSchedules();
    } catch (error) {
      console.error('Error toggling schedule:', error);
      alert('Failed to update schedule');
    }
  };

  const updateEmails = async (id: string, emails: string[]) => {
    try {
      const { error } = await supabase
        .from('email_schedules')
        .update({ recipient_emails: emails })
        .eq('id', id);

      if (error) throw error;
      await fetchSchedules();
      setEditingId(null);
      setEmailInput('');
    } catch (error) {
      console.error('Error updating emails:', error);
      alert('Failed to update emails');
    }
  };

  const sendTestEmail = async (reportType: 'weekly' | 'monthly') => {
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        alert('No email found for current user');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-report-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            reportType,
            toEmail: user.email,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(`Test ${reportType} email sent successfully to ${user.email}!`);
      } else {
        alert(`Failed to send email: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const startEditing = (schedule: EmailSchedule) => {
    setEditingId(schedule.id);
    setEmailInput(schedule.recipient_emails.join(', '));
  };

  const saveEmails = (id: string) => {
    const emails = emailInput
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.includes('@'));

    if (emails.length === 0) {
      alert('Please enter at least one valid email address');
      return;
    }

    updateEmails(id, emails);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="text-slate-600">Loading email schedules...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Mail className="w-6 h-6 text-[#531B93]" />
          <h2 className="text-xl font-bold text-slate-800">Automated Email Reports</h2>
        </div>
      </div>

      <div className="space-y-4">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="border border-slate-200 rounded-lg p-5 hover:border-[#531B93] transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-800 capitalize">
                    {schedule.report_type} Report
                  </h3>
                  <button
                    onClick={() => toggleActive(schedule.id, schedule.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      schedule.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {schedule.is_active ? (
                      <span className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1">
                        <XCircle className="w-3 h-3" />
                        <span>Inactive</span>
                      </span>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  {editingId === schedule.id ? (
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">
                        Email Recipients (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="admin@example.com, manager@example.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93] text-sm"
                      />
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => saveEmails(schedule.id)}
                          className="px-4 py-2 bg-[#531B93] text-white rounded-lg hover:bg-[#6d24b8] transition-colors text-sm font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEmailInput('');
                          }}
                          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Recipients:</p>
                      {schedule.recipient_emails.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {schedule.recipient_emails.map((email, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs"
                            >
                              {email}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-amber-600">No recipients configured</p>
                      )}
                      <button
                        onClick={() => startEditing(schedule)}
                        className="mt-2 text-sm text-[#531B93] hover:text-[#6d24b8] font-medium"
                      >
                        Edit Recipients
                      </button>
                    </div>
                  )}

                  {schedule.last_sent_at && (
                    <div className="flex items-center space-x-2 text-xs text-slate-500 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>
                        Last sent: {new Date(schedule.last_sent_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => sendTestEmail(schedule.report_type)}
                disabled={sending}
                className="ml-4 px-4 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0f9b8e] transition-colors disabled:opacity-50 text-sm font-medium flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Test</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-slate-700">
          <strong>How it works:</strong>
        </p>
        <ul className="text-sm text-slate-600 mt-2 space-y-1 list-disc list-inside">
          <li>Configure recipient email addresses for each report type</li>
          <li>Toggle schedules active/inactive as needed</li>
          <li>Weekly reports: Sent every 7 days automatically</li>
          <li>Monthly reports: Sent at the start of each new month</li>
          <li>Use "Send Test" to preview the email format</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>Important:</strong> Ensure Mailgun credentials (MAILGUN_API_KEY, MAILGUN_DOMAIN) are configured in your project environment variables for automated emails to work.
        </p>
      </div>
    </div>
  );
}
