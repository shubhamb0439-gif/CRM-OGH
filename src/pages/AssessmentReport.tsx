import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, Assessment } from '../lib/supabase';
import { HOME_URL } from '../lib/constants';
import { CheckCircle, Award, TrendingUp, AlertCircle } from 'lucide-react';

const SERVICE_DETAILS: Record<string, { features: string[] }> = {
  'Drug Assist': {
    features: [
      'Effortless: Find savings programs instantly',
      'Wide Coverage: Everyday to specialty medications',
      'Smart Matching: AI-powered assistance options'
    ]
  },
  'Call Operator': {
    features: [
      'Professional call handling',
      'Appointment scheduling support',
      'Message management'
    ]
  },
  'Medical Assistance': {
    features: [
      'Patient flow optimization',
      'Clinical support',
      'Workflow efficiency'
    ]
  },
  'Billing and Coding': {
    features: [
      'Accurate claim submission',
      'Denial reduction',
      'Revenue optimization'
    ]
  },
  'Medical Scribing, Precharting': {
    features: [
      'Real-time documentation',
      'Pre-visit charting',
      'Reduced physician workload'
    ]
  }
};

const CHALLENGE_LABELS: Record<string, string> = {
  'documentation': 'Documentation',
  'claims': 'Claims',
  'patient_flow': 'Patient Flow',
  'staff_overload': 'Staff Overload (Missed calls, unanswered messages and emails, scheduling/rescheduling appointments)',
  'inadequate_assistance': 'Inadequate assistance programs for prescribed medications'
};

export default function AssessmentReport() {
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAssessment();
    }
  }, [id]);

  const fetchAssessment = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setAssessment(data);
    } catch (error) {
      console.error('Error fetching assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 85) return <Award className="w-12 h-12 text-green-600" />;
    if (score >= 70) return <TrendingUp className="w-12 h-12 text-blue-600" />;
    if (score >= 50) return <CheckCircle className="w-12 h-12 text-orange-600" />;
    return <AlertCircle className="w-12 h-12 text-red-600" />;
  };

  const getInterpretationMessage = (efficiencyLevel: string) => {
    const messages: Record<string, string> = {
      '🌟 Excellent Efficiency': 'Highly optimized workflows. Your facility is performing exceptionally well!',
      '👍 Good Efficiency': 'Some optimizations possible. You have a solid foundation with room for improvement.',
      '⚙️ Moderate Efficiency': 'Noticeable inefficiencies. There are several areas where improvements can be made.',
      '⚠️ Needs Improvement': 'High friction in operations. Significant optimization opportunities exist.',
      'Excellent Efficiency': 'Highly optimized workflows. Your facility is performing exceptionally well!',
      'Good Efficiency': 'Some optimizations possible. You have a solid foundation with room for improvement.',
      'Moderate Efficiency': 'Noticeable inefficiencies. There are several areas where improvements can be made.',
      'Needs Improvement': 'High friction in operations. Significant optimization opportunities exist.'
    };
    return messages[efficiencyLevel] || 'Assessment complete.';
  };

  if (loading) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4 overflow-auto">
        <div className="text-slate-600">Loading your report...</div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4 overflow-auto">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <p className="text-slate-600 mb-4">Assessment not found</p>
          <a
            href="/assessment"
            className="text-[#2563EB] hover:text-[#1d4ed8] font-medium"
          >
            Take Assessment
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <img src="/og logo.png" alt="Healthcare CRM" className="h-16 w-auto" />
          </div>

          <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">
            Your Efficiency Report
          </h1>
          <p className="text-center text-slate-600 mb-8">
            Here's your personalized healthcare efficiency assessment
          </p>

          <div className={`rounded-xl border-2 p-8 mb-8 ${getScoreBgColor(assessment.score)}`}>
            <div className="flex items-center justify-center mb-4">
              {getScoreIcon(assessment.score)}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                OG Efficiency Score
              </h2>
              <div className={`text-6xl font-bold mb-4 ${getScoreColor(assessment.score)}`}>
                {assessment.score}<span className="text-3xl">/100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4 mb-4">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    assessment.score >= 85
                      ? 'bg-green-500'
                      : assessment.score >= 70
                      ? 'bg-blue-500'
                      : assessment.score >= 50
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${assessment.score}%` }}
                />
              </div>
              <p className="text-xl font-semibold text-slate-800 mb-2">
                {assessment.efficiency_level}
              </p>
              <p className="text-slate-600">
                {getInterpretationMessage(assessment.efficiency_level)}
              </p>
            </div>
          </div>

          {assessment.recommended_services && assessment.recommended_services.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Recommended Solutions
              </h2>

              <div className="space-y-4">
                {assessment.recommended_services.map((service, idx) => {
                  const challenges = assessment.selected_challenges || [];
                  const challenge = challenges[idx] ? CHALLENGE_LABELS[challenges[idx]] : '';
                  const details = SERVICE_DETAILS[service];

                  return (
                    <div key={idx} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                      {challenge && (
                        <div className="mb-4">
                          <p className="text-sm text-slate-600 mb-1">Challenge</p>
                          <p className="font-semibold text-slate-800">{challenge}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-slate-600 mb-2">Recommended Service</p>
                        <p className="text-xl font-bold text-[#2563EB] mb-3">{service}</p>
                        {details && (
                          <div className="bg-white rounded-lg p-4 border border-[#2563EB]/20">
                            <p className="font-semibold text-slate-800 mb-3">
                              {service} Features:
                            </p>
                            <ul className="space-y-2">
                              {details.features.map((feature, featureIdx) => (
                                <li key={featureIdx} className="flex items-start space-x-2 text-slate-700">
                                  <span className="text-[#2563EB] font-bold mt-0.5">•</span>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-[#2563EB] text-white px-6 py-4 rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors text-center shadow-md"
            >
              Download / Export as PDF
            </button>
            <a
              href={HOME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border-2 border-[#2563EB] text-[#2563EB] px-6 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
            >
              Home
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
          <p className="text-slate-600 text-sm">
            Assessment completed on {new Date(assessment.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
