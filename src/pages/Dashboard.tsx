import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, Lead } from '../lib/supabase';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { usePageVisibility } from '../hooks/usePageVisibility';
import AdminLayout from '../components/AdminLayout';
import EmailScheduleManager from '../components/EmailScheduleManager';
import { TrendingUp, Users, UserCheck, CheckCircle2, Award, AlertCircle, MapPin } from 'lucide-react';

interface StateCount {
  state: string;
  count: number;
}

interface ChallengeCount {
  challenge: string;
  count: number;
}

interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  closedDeals: number;
  conversionRate: number;
  assessmentLeads: number;
  consultancyLeads: number;
  referralLeads: number;
  goodEfficiency: number;
  moderateEfficiency: number;
  needsImprovement: number;
  leadsByState: StateCount[];
  topChallenges: ChallengeCount[];
}

// Fetch leads from Supabase
async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Calculate dashboard statistics from leads
function calculateStats(leads: Lead[]): DashboardStats {
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(
    (lead) => lead.status === 'Qualified Prospect' || lead.status === 'Contract Sent' || lead.status === 'Confirmed Client'
  ).length;
  const closedDeals = leads.filter((lead) => lead.status === 'Closed' && lead.closed_reason === 'Confirmed Client').length;
  const conversionRate = totalLeads > 0 ? Math.round((closedDeals / totalLeads) * 1000) / 10 : 0;

  const assessmentLeads = leads.filter((lead) => lead.source === 'Assessment').length;
  const consultancyLeads = leads.filter((lead) => lead.source === 'Consultancy').length;
  const referralLeads = leads.filter((lead) => lead.source === 'Referral').length;

  const goodEfficiency = leads.filter((lead) => lead.efficiency_level === 'Good Efficiency').length;
  const moderateEfficiency = leads.filter((lead) => lead.efficiency_level === 'Moderate Efficiency').length;
  const needsImprovement = leads.filter((lead) => lead.efficiency_level === 'Needs Improvement').length;

  // Calculate leads by state
  const stateCounts: Record<string, number> = {};
  leads.forEach((lead) => {
    if (lead.state) {
      stateCounts[lead.state] = (stateCounts[lead.state] || 0) + 1;
    }
  });
  const leadsByState = Object.entries(stateCounts)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate top challenges
  const challengeCounts: Record<string, number> = {};
  leads.forEach((lead) => {
    if (lead.comments) {
      const challenges = lead.comments.split(',').map(c => c.trim()).filter(c => c.length > 0);
      challenges.forEach(challenge => {
        const normalized = challenge.toLowerCase();
        challengeCounts[normalized] = (challengeCounts[normalized] || 0) + 1;
      });
    }
  });
  const topChallenges = Object.entries(challengeCounts)
    .map(([challenge, count]) => ({ challenge, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalLeads,
    qualifiedLeads,
    closedDeals,
    conversionRate,
    assessmentLeads,
    consultancyLeads,
    referralLeads,
    goodEfficiency,
    moderateEfficiency,
    needsImprovement,
    leadsByState,
    topChallenges
  };
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const isVisible = usePageVisibility();

  // Fetch leads with React Query
  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Calculate stats from leads
  const stats = calculateStats(leads);

  // Subscribe to realtime updates
  useRealtimeSubscription(
    'dashboard_leads_changes',
    'leads',
    () => {
      // Invalidate and refetch leads when changes occur
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  );

  // Refetch when tab becomes visible after being hidden
  useEffect(() => {
    if (isVisible) {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  }, [isVisible, queryClient]);

  const statCards = [
    {
      label: 'Total Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      label: 'Qualified Leads',
      value: stats.qualifiedLeads,
      icon: UserCheck,
      color: 'from-[#531B93] to-[#2563EB]',
      bgColor: 'bg-purple-50',
      textColor: 'text-[#531B93]'
    },
    {
      label: 'Closed Deals',
      value: stats.closedDeals,
      icon: CheckCircle2,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      label: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading dashboard data. Please refresh the page.</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Dashboard Overview</h1>
            <p className="text-slate-600 text-sm sm:text-base">Real-time metrics and analytics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">{card.label}</p>
                    <p className="text-3xl font-bold text-slate-800">{card.value}</p>
                  </div>
                  <div className={`${card.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${card.textColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Lead Sources</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Assessment</span>
                <span className="font-semibold text-slate-800">{stats.assessmentLeads}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#531B93] to-[#2563EB] h-2 rounded-full"
                  style={{ width: `${stats.totalLeads > 0 ? (stats.assessmentLeads / stats.totalLeads) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Consultancy</span>
                <span className="font-semibold text-slate-800">{stats.consultancyLeads}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                  style={{ width: `${stats.totalLeads > 0 ? (stats.consultancyLeads / stats.totalLeads) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Referral</span>
                <span className="font-semibold text-slate-800">{stats.referralLeads}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full"
                  style={{ width: `${stats.totalLeads > 0 ? (stats.referralLeads / stats.totalLeads) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Efficiency Levels</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">Good Efficiency</span>
                    <span className="font-semibold text-slate-800">{stats.goodEfficiency}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${stats.totalLeads > 0 ? (stats.goodEfficiency / stats.totalLeads) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">Moderate Efficiency</span>
                    <span className="font-semibold text-slate-800">{stats.moderateEfficiency}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${stats.totalLeads > 0 ? (stats.moderateEfficiency / stats.totalLeads) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">Needs Improvement</span>
                    <span className="font-semibold text-slate-800">{stats.needsImprovement}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${stats.totalLeads > 0 ? (stats.needsImprovement / stats.totalLeads) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Assessment Submissions</h2>
          <div className="text-center py-8">
            <div className="text-4xl font-bold text-[#2563EB] mb-2">{stats.assessmentLeads}</div>
            <p className="text-slate-600">Total assessments completed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <MapPin className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-lg font-semibold text-slate-800">Leads by State</h2>
            </div>
            {stats.leadsByState.length > 0 ? (
              <div className="space-y-3">
                {stats.leadsByState.map((item, idx) => (
                  <div key={item.state} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-xs font-semibold text-slate-400 w-6">{idx + 1}</span>
                      <span className="text-slate-700 font-medium">{item.state}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[#531B93] to-[#2563EB] h-2 rounded-full"
                          style={{ width: `${(item.count / stats.totalLeads) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-800 w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No state data available</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-slate-800">Top Challenges</h2>
            </div>
            {stats.topChallenges.length > 0 ? (
              <div className="space-y-3">
                {stats.topChallenges.map((item, idx) => (
                  <div key={item.challenge} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-xs font-semibold text-slate-400 w-6">{idx + 1}</span>
                      <span className="text-slate-700 font-medium text-sm line-clamp-1">{item.challenge}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full"
                          style={{ width: `${(item.count / stats.topChallenges[0].count) * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-800 w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No challenge data available</p>
            )}
          </div>
        </div>

        <EmailScheduleManager />
      </div>
    </AdminLayout>
  );
}
