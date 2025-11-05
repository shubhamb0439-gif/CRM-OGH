import { useEffect, useState } from 'react';
import { supabase, Lead } from '../lib/supabase';
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

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    qualifiedLeads: 0,
    closedDeals: 0,
    conversionRate: 0,
    assessmentLeads: 0,
    consultancyLeads: 0,
    referralLeads: 0,
    goodEfficiency: 0,
    moderateEfficiency: 0,
    needsImprovement: 0
  });

  const [leadsByState, setLeadsByState] = useState<StateCount[]>([]);
  const [topChallenges, setTopChallenges] = useState<ChallengeCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchStats();

    const leadsSubscription = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchStats(false);
      })
      .subscribe();

    const assessmentsSubscription = supabase
      .channel('assessments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assessments' }, () => {
        fetchStats(false);
      })
      .subscribe();

    return () => {
      leadsSubscription.unsubscribe();
      assessmentsSubscription.unsubscribe();
    };
  }, []);

  const fetchStats = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*');

      if (error) throw error;

      setAllLeads(leads || []);
      const totalLeads = leads?.length || 0;
      const qualifiedLeads = leads?.filter(
        (lead) => lead.status === 'Qualified Prospect' || lead.status === 'Contract Sent' || lead.status === 'Confirmed Client'
      ).length || 0;
      const closedDeals = leads?.filter((lead) => lead.status === 'Closed' && lead.closed_reason === 'Confirmed Client').length || 0;
      const conversionRate = totalLeads > 0 ? (closedDeals / totalLeads) * 100 : 0;

      const assessmentLeads = leads?.filter((lead) => lead.source === 'Assessment').length || 0;
      const consultancyLeads = leads?.filter((lead) => lead.source === 'Consultancy').length || 0;
      const referralLeads = leads?.filter((lead) => lead.source === 'Referral').length || 0;

      const goodEfficiency = leads?.filter((lead) => lead.efficiency_level === 'Good Efficiency').length || 0;
      const moderateEfficiency = leads?.filter((lead) => lead.efficiency_level === 'Moderate Efficiency').length || 0;
      const needsImprovement = leads?.filter((lead) => lead.efficiency_level === 'Needs Improvement').length || 0;

      const stateCounts: Record<string, number> = {};
      leads?.forEach((lead) => {
        if (lead.state) {
          stateCounts[lead.state] = (stateCounts[lead.state] || 0) + 1;
        }
      });
      const stateArray = Object.entries(stateCounts)
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setLeadsByState(stateArray);

      const challengeCounts: Record<string, number> = {};
      leads?.forEach((lead) => {
        if (lead.comments) {
          const challenges = lead.comments.split(',').map(c => c.trim()).filter(c => c.length > 0);
          challenges.forEach(challenge => {
            const normalized = challenge.toLowerCase();
            challengeCounts[normalized] = (challengeCounts[normalized] || 0) + 1;
          });
        }
      });
      const challengeArray = Object.entries(challengeCounts)
        .map(([challenge, count]) => ({ challenge, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setTopChallenges(challengeArray);

      setStats({
        totalLeads,
        qualifiedLeads,
        closedDeals,
        conversionRate: Math.round(conversionRate * 10) / 10,
        assessmentLeads,
        consultancyLeads,
        referralLeads,
        goodEfficiency,
        moderateEfficiency,
        needsImprovement
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Dashboard Overview</h1>
            <p className="text-slate-600">Real-time metrics and analytics</p>
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
            {leadsByState.length > 0 ? (
              <div className="space-y-3">
                {leadsByState.map((item, idx) => (
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
            {topChallenges.length > 0 ? (
              <div className="space-y-3">
                {topChallenges.map((item, idx) => (
                  <div key={item.challenge} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-xs font-semibold text-slate-400 w-6">{idx + 1}</span>
                      <span className="text-slate-700 font-medium text-sm line-clamp-1">{item.challenge}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full"
                          style={{ width: `${(item.count / topChallenges[0].count) * 100}%` }}
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
