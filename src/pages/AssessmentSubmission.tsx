import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    question: 'How many physicians work at your facility?',
    options: ['1-5', '6-15', '15-25', '30+'],
    points: [15, 10, 5, 5]
  },
  {
    id: 2,
    question: 'How many hours/day does each physician spend documenting notes?',
    options: ['<1 hr', '1-2 hrs', '2-4 hrs', '4+ hrs'],
    points: [20, 15, 10, 5]
  },
  {
    id: 3,
    question: 'What is your average monthly claim denial rate?',
    options: ['<5%', '5-10%', '10-20%', '>20%'],
    points: [20, 15, 10, 5]
  },
  {
    id: 4,
    question: 'How often are appointments delayed due to admin work?',
    options: ['Never', 'Sometimes', 'Often', 'Always'],
    points: [15, 10, 5, 5]
  }
];

const CHALLENGES = [
  { id: 'documentation', label: 'Documentation', service: 'Medical Scribing, Precharting' },
  { id: 'claims', label: 'Claims', service: 'Billing and Coding' },
  { id: 'patient_flow', label: 'Patient Flow', service: 'Medical Assistance' },
  { id: 'staff_overload', label: 'Staff Overload (Missed calls, unanswered messages and emails, scheduling/rescheduling appointments)', service: 'Call Operator' },
  { id: 'inadequate_assistance', label: 'Inadequate assistance programs for prescribed medications', service: 'Drug Assist' }
];

const SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Emergency Medicine',
  'Endocrinology',
  'Gastroenterology',
  'General Surgery',
  'Gynecology',
  'Hematology',
  'Hepatology',
  'Immunology',
  'Infectious Disease',
  'Internal Medicine',
  'Medical Genetics',
  'Multispeciality',
  'Nephrology',
  'Neurology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pathology',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Rheumatology',
  'Toxicology',
  'Urology',
  'Vascular Surgery'
];

const COUNTRIES = [
  { name: 'United States', code: 'US', states: ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'] },
  { name: 'Canada', code: 'CA', states: ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'] },
  { name: 'United Kingdom', code: 'UK', states: ['England', 'Scotland', 'Wales', 'Northern Ireland'] },
  { name: 'Australia', code: 'AU', states: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Northern Territory', 'Australian Capital Territory'] },
  { name: 'India', code: 'IN', states: ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'] }
];

export default function AssessmentSubmission() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentAnswer, setCurrentAnswer] = useState<number | null>(null);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    hospital_name: '',
    country: '',
    state: ''
  });
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (formData.country) {
      const country = COUNTRIES.find(c => c.code === formData.country);
      setAvailableStates(country?.states || []);
      setFormData(prev => ({ ...prev, state: '' }));
    }
  }, [formData.country]);

  const isQuestionsStep = currentStep < ASSESSMENT_QUESTIONS.length;
  const isChallengesStep = currentStep === ASSESSMENT_QUESTIONS.length;
  const isDetailsStep = currentStep === ASSESSMENT_QUESTIONS.length + 1;

  const handleAnswerSelect = (points: number) => {
    setCurrentAnswer(points);
  };

  const handleChallengeToggle = (challengeId: string) => {
    setSelectedChallenges(prev =>
      prev.includes(challengeId)
        ? prev.filter(id => id !== challengeId)
        : [...prev, challengeId]
    );
  };

  const handleNext = () => {
    if (isQuestionsStep && currentAnswer !== null) {
      setAnswers({ ...answers, [ASSESSMENT_QUESTIONS[currentStep].id]: currentAnswer });
      setCurrentAnswer(null);
      setCurrentStep(currentStep + 1);
    } else if (isChallengesStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (currentStep <= ASSESSMENT_QUESTIONS.length) {
        const previousAnswer = answers[ASSESSMENT_QUESTIONS[currentStep - 1]?.id];
        setCurrentAnswer(previousAnswer || null);
      }
    }
  };

  const calculateScore = () => {
    let totalScore = 0;
    Object.values(answers).forEach(points => {
      totalScore += points;
    });

    const challengeCount = selectedChallenges.length;
    let challengePoints = 0;
    if (challengeCount === 0) challengePoints = 30;
    else if (challengeCount === 1) challengePoints = 30;
    else if (challengeCount === 2) challengePoints = 20;
    else if (challengeCount === 3) challengePoints = 15;
    else challengePoints = 10;

    return totalScore + challengePoints;
  };

  const calculateEfficiency = (score: number) => {
    if (score >= 85) return '🌟 Excellent Efficiency';
    if (score >= 70) return '👍 Good Efficiency';
    if (score >= 50) return '⚙️ Moderate Efficiency';
    return '⚠️ Needs Improvement';
  };

  const getRecommendedServices = () => {
    return selectedChallenges
      .map(challengeId => CHALLENGES.find(c => c.id === challengeId)?.service)
      .filter(Boolean) as string[];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSpecialties.length === 0) {
      alert('Please select at least one specialty');
      return;
    }

    setSubmitting(true);

    try {
      const score = calculateScore();
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      const efficiencyLevel = calculateEfficiency(score);
      const recommendedServices = getRecommendedServices();
      const fullName = `${formData.first_name} ${formData.last_name}`;
      const countryName = COUNTRIES.find(c => c.code === formData.country)?.name || formData.country;

      const assessmentPayload = {
        name: fullName,
        email: formData.email,
        phone: formData.phone || null,
        facility: formData.hospital_name,
        country: countryName,
        state: formData.state,
        specialties: selectedSpecialties,
        score,
        time_taken: timeTaken,
        efficiency_level: efficiencyLevel,
        product_service: recommendedServices.join(', ') || 'Not specified',
        selected_challenges: selectedChallenges,
        recommended_services: recommendedServices,
        comments: `Specialties: ${selectedSpecialties.join(', ')}`
      };

      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert(assessmentPayload)
        .select()
        .single();

      if (assessmentError) {
        console.error('Assessment insert error:', assessmentError);
        throw assessmentError;
      }

      const { error: leadError } = await supabase
        .from('leads')
        .insert({
          name: fullName,
          email: formData.email,
          phone: formData.phone || 'N/A',
          facility: formData.hospital_name,
          state: formData.state,
          source: 'Assessment',
          score,
          efficiency_level: efficiencyLevel,
          product_service: recommendedServices.join(', ') || 'Not specified',
          selected_services: recommendedServices,
          comments: `Specialties: ${selectedSpecialties.join(', ')}, Country: ${countryName}`,
          status: 'New'
        });

      if (leadError) {
        console.error('Lead insert error:', leadError);
      }

      navigate(`/assessment-report/${assessment.id}`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert(`Failed to submit assessment. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = ASSESSMENT_QUESTIONS.length + 2;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 overflow-auto">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <img src="/og logo.png" alt="Healthcare CRM" className="h-16 w-auto" />
          </div>

          <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">
            Healthcare Efficiency Assessment
          </h1>
          <p className="text-center text-slate-600 mb-8">
            Help us understand your current healthcare operations
          </p>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">
                {isQuestionsStep
                  ? `Question ${currentStep + 1} of ${ASSESSMENT_QUESTIONS.length}`
                  : isChallengesStep
                  ? 'Select Your Challenges'
                  : 'Your Details'}
              </span>
              <span className="text-sm font-medium text-[#2563EB]">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {isQuestionsStep && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-6 min-h-[300px]">
                <p className="font-semibold text-slate-800 mb-6 text-lg">
                  {ASSESSMENT_QUESTIONS[currentStep].question}
                </p>
                <div className="space-y-3">
                  {ASSESSMENT_QUESTIONS[currentStep].options.map((option, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center space-x-3 p-4 bg-white rounded-lg cursor-pointer transition-all border-2 ${
                        currentAnswer === ASSESSMENT_QUESTIONS[currentStep].points[idx]
                          ? 'border-[#2563EB] bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${ASSESSMENT_QUESTIONS[currentStep].id}`}
                        value={ASSESSMENT_QUESTIONS[currentStep].points[idx]}
                        checked={currentAnswer === ASSESSMENT_QUESTIONS[currentStep].points[idx]}
                        onChange={() => handleAnswerSelect(ASSESSMENT_QUESTIONS[currentStep].points[idx])}
                        className="w-5 h-5 text-[#2563EB]"
                      />
                      <span className="text-slate-700 font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-2 px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentAnswer === null}
                  className="flex items-center space-x-2 bg-[#2563EB] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {isChallengesStep && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-6 min-h-[300px]">
                <p className="font-semibold text-slate-800 mb-6 text-lg">
                  What is your biggest operational challenge? (Select one or more)
                </p>
                <div className="space-y-3">
                  {CHALLENGES.map((challenge) => (
                    <label
                      key={challenge.id}
                      className={`flex items-start space-x-3 p-4 bg-white rounded-lg cursor-pointer transition-all border-2 ${
                        selectedChallenges.includes(challenge.id)
                          ? 'border-[#2563EB] bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedChallenges.includes(challenge.id)}
                        onChange={() => handleChallengeToggle(challenge.id)}
                        className="w-5 h-5 mt-0.5 text-[#2563EB] rounded"
                      />
                      <span className="text-slate-700 font-medium">{challenge.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center space-x-2 px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center space-x-2 bg-[#2563EB] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors shadow-md"
                >
                  <span>Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {isDetailsStep && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-slate-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-slate-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-slate-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number <span className="text-slate-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hospital/Facility *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter hospital or facility name"
                    value={formData.hospital_name}
                    onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-slate-500"
                    required
                  />
                </div>

              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Specialty * <span className="text-slate-500 text-xs">(Select all that apply)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-slate-300 rounded-lg bg-slate-50 max-h-64 overflow-y-auto">
                  {SPECIALTIES.map((specialty) => (
                    <label
                      key={specialty}
                      className="flex items-center space-x-2 cursor-pointer hover:text-[#2563EB] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSpecialties.includes(specialty)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSpecialties([...selectedSpecialties, specialty]);
                          } else {
                            setSelectedSpecialties(selectedSpecialties.filter(s => s !== specialty));
                          }
                        }}
                        className="w-4 h-4 text-[#2563EB] rounded focus:ring-2 focus:ring-[#2563EB]"
                      />
                      <span className="text-sm text-slate-700">{specialty}</span>
                    </label>
                  ))}
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
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={submitting}
                  className="flex items-center space-x-2 px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#2563EB] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Get My Efficiency Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
