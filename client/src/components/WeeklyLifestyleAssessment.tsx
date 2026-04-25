import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import API from '../api/api';
import toast from 'react-hot-toast';

interface AssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  onComplete: () => void;
}

const QUESTIONS = [
  // Diet & Nutrition
  { id: 'diet_meals', category: 'diet', type: 'choice', title: 'How many balanced meals did you eat today, on average, this week?', options: ['1-2', '3', '4+'], subtitle: 'Include typical breakfast, lunch, and dinner.' },
  { id: 'diet_water', category: 'diet', type: 'numeric', title: 'How many glasses of water did you drink daily?', subtitle: '1 glass ≈ 250ml' },
  { id: 'diet_junk', category: 'diet', type: 'choice', title: 'How often did you consume junk or heavily processed food?', options: ['Never', 'Rarely (1-2 times)', 'Occasionally (3-4 times)', 'Frequently (5+ times)'] },
  { id: 'diet_sugar', category: 'diet', type: 'slider', title: 'Rate your refined sugar intake this week.', min: 1, max: 10, minLabel: 'Very Low', maxLabel: 'Very High' },

  // Sleep
  { id: 'sleep_duration', category: 'sleep', type: 'numeric', title: 'Average sleep duration per night? (in hours)', subtitle: 'Be as accurate as possible' },
  { id: 'sleep_quality', category: 'sleep', type: 'choice', title: 'How would you rate your sleep quality?', options: ['Excellent', 'Good', 'Fair', 'Poor', 'Terrible'] },
  { id: 'sleep_screen', category: 'sleep', type: 'toggle', title: 'Did you use screens (phone, TV, laptop) within 1 hour before sleeping mostly?', options: ['Yes', 'No'] },

  // Physical Activity
  { id: 'activity_frequency', category: 'activity', type: 'choice', title: 'How many days did you exercise for at least 30 mins?', options: ['0 days', '1-2 days', '3-4 days', '5+ days'] },
  { id: 'activity_type', category: 'activity', type: 'choice', title: 'What type of exercise did you mostly do?', options: ['None', 'Cardio (Running, Cycling)', 'Strength (Weights)', 'Flexibility (Yoga)', 'Mix'] },
  { id: 'activity_sedentary', category: 'activity', type: 'numeric', title: 'Approximate sedentary (sitting) hours per day?' },

  // Habits & Addictions
  { id: 'habits_smoking', category: 'habits', type: 'choice', title: 'Smoking / Vaping frequency this week?', options: ['None', 'Reduced from usual', 'Same as usual', 'Increased'] },
  { id: 'habits_alcohol', category: 'habits', type: 'choice', title: 'Alcohol consumption this week?', options: ['None', 'Light (1-2 drinks)', 'Moderate (3-5 drinks)', 'Heavy (6+ drinks)'] },
  { id: 'habits_caffeine', category: 'habits', type: 'numeric', title: 'Number of caffeinated drinks per day on average?' },

  // Mental Health
  { id: 'mental_stress', category: 'mental_health', type: 'slider', title: 'How would you rate your overall stress level?', min: 1, max: 10, minLabel: 'Completely Relaxed', maxLabel: 'Extremely Stressed' },
  { id: 'mental_mood', category: 'mental_health', type: 'choice', title: 'How was your general mood?', options: ['Very Positive', 'Positive', 'Neutral', 'Negative', 'Very Negative'] },

  // Medication Adherence
  { id: 'medication_missed', category: 'medication', type: 'choice', title: 'Did you miss any prescribed medication doses?', options: ['No, took all', 'Missed 1-2 times', 'Missed several times', 'Not applicable'] },
  { id: 'medication_sideeffects', category: 'medication', type: 'toggle', title: 'Did you experience any unusual side effects from your medications?', options: ['Yes', 'No'] },

  // General Health
  { id: 'general_energy', category: 'general_health', type: 'slider', title: 'Rate your overall energy levels.', min: 1, max: 10, minLabel: 'Exhausted', maxLabel: 'Energetic' },
  { id: 'general_pain', category: 'general_health', type: 'toggle', title: 'Experienced any abnormal pain or discomfort?', options: ['Yes', 'No'] },
  { id: 'general_notes', category: 'general_health', type: 'text', title: 'Any additional notes or symptoms you want to report?', subtitle: 'Optional' },
];

export default function WeeklyLifestyleAssessment({ isOpen, onClose, patientId, onComplete }: AssessmentProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [skipped, setSkipped] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animationClass, setAnimationClass] = useState('translate-x-0 opacity-100');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentIdx(0);
      setAnswers({});
      setSkipped([]);
      setAnimationClass('translate-x-0 opacity-100');
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentQ = QUESTIONS[currentIdx];
  const progress = ((currentIdx) / QUESTIONS.length) * 100;

  const navigateTo = (direction: 'next' | 'prev') => {
    setAnimationClass(direction === 'next' ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0');
    
    setTimeout(() => {
      setCurrentIdx(prev => direction === 'next' ? prev + 1 : prev - 1);
      setAnimationClass(direction === 'next' ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0');
      
      // small delay to allow react to render the new location before sliding in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationClass('translate-x-0 opacity-100');
        });
      });
    }, 300);
  };

  const handleAnswer = (value: any) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
    // Automatically go next on choice/toggle, but not for numeric/slider/text
    if (currentQ.type === 'choice' || currentQ.type === 'toggle') {
      setTimeout(() => {
        if (currentIdx < QUESTIONS.length - 1) {
          navigateTo('next');
        }
      }, 400); // give time to see selection
    }
  };

  const handleSkip = () => {
    if (!skipped.includes(currentQ.id)) {
      setSkipped([...skipped, currentQ.id]);
    }
    if (currentIdx < QUESTIONS.length - 1) {
      navigateTo('next');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Structure responses
      const structured: Record<string, any> = {
        diet: {}, sleep: {}, activity: {}, habits: {}, mental_health: {}, medication: {}, general_health: {}
      };

      for (const [key, val] of Object.entries(answers)) {
        const cat = QUESTIONS.find(q => q.id === key)?.category;
        if (cat && structured[cat]) {
          structured[cat][key] = val;
        }
      }

      await API.post(`/patients/${patientId}/lifestyle-assessment`, {
        responses: structured,
        skippedQuestions: skipped,
        completionScore: Math.round(((QUESTIONS.length - skipped.length) / QUESTIONS.length) * 100),
        status: 'completed'
      });
      
      toast.success('Awesome! Your weekly check-in is complete.');
      onComplete();
    } catch (err: any) {
      toast.error('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50/95 backdrop-blur-md">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-white border-b shadow-sm sticky top-0 z-10">
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <div className="flex-1 max-w-xl mx-8">
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center text-xs text-gray-400 font-bold uppercase mt-2 tracking-widest">
            Question {currentIdx + 1} of {QUESTIONS.length}
          </p>
        </div>
        <button 
          onClick={handleSkip}
          className="text-sm font-bold text-gray-400 hover:text-gray-600 px-3 py-1 bg-gray-100 rounded-full"
        >
          Skip
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center p-6">
        
        {currentIdx < QUESTIONS.length ? (
          <div className={`w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 transition-all duration-300 transform ${animationClass}`}>
            
            <div className="mb-8">
              <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                {currentQ.category.replace('_', ' ')}
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                {currentQ.title}
              </h2>
              {currentQ.subtitle && (
                <p className="text-gray-500 mt-2">{currentQ.subtitle}</p>
              )}
            </div>

            <div className="min-h-[200px] flex flex-col justify-center">
              {currentQ.type === 'choice' || currentQ.type === 'toggle' ? (
                <div className="flex flex-col gap-3">
                  {currentQ.options?.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      className={`text-left px-6 py-4 rounded-2xl border-2 transition-all duration-200 font-medium text-lg
                        ${answers[currentQ.id] === opt 
                          ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-md ring-4 ring-teal-500/10' 
                          : 'border-gray-100 hover:border-teal-200 hover:bg-slate-50 text-gray-700'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : currentQ.type === 'numeric' ? (
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="w-32 text-center text-4xl font-black bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 focus:ring-0 focus:border-teal-400 outline-none"
                    placeholder="0"
                  />
                  <div className="flex-1">
                    <button 
                      disabled={!answers[currentQ.id]}
                      onClick={() => navigateTo('next')}
                      className="px-8 py-4 bg-teal-500 disabled:opacity-50 text-white rounded-2xl font-bold text-lg hover:bg-teal-600 transition-colors w-full"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : currentQ.type === 'slider' ? (
                <div className="space-y-8">
                  <div className="relative">
                    <input 
                      type="range" 
                      min={currentQ.min} 
                      max={currentQ.max} 
                      value={answers[currentQ.id] || (currentQ.max! / 2)}
                      onChange={(e) => handleAnswer(Number(e.target.value))}
                      className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className="flex justify-between text-sm font-bold text-gray-400 mt-4">
                      <span>{currentQ.minLabel}</span>
                      <span className="text-teal-600 text-xl">{answers[currentQ.id] || (currentQ.max! / 2)}</span>
                      <span>{currentQ.maxLabel}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (!answers[currentQ.id]) handleAnswer(currentQ.max! / 2);
                      navigateTo('next');
                    }}
                    className="w-full py-4 bg-teal-500 text-white rounded-2xl font-bold text-lg hover:bg-teal-600 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              ) : currentQ.type === 'text' ? (
                <div className="flex flex-col gap-4">
                  <textarea 
                    rows={4}
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="w-full p-4 text-lg bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-teal-400 outline-none resize-none"
                    placeholder="Type here..."
                  />
                  <button 
                    onClick={() => navigateTo('next')}
                    className="px-8 py-4 bg-teal-500 text-white rounded-2xl font-bold text-lg hover:bg-teal-600 transition-colors w-full"
                  >
                    Continue
                  </button>
                </div>
              ) : null}
            </div>
            
            {/* Navigation constraints */}
            <div className="mt-8 flex justify-between items-center relative">
              <button
                onClick={() => navigateTo('prev')}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-900 transition-colors disabled:opacity-30"
              >
                <ChevronLeftIcon className="h-5 w-5" /> Back
              </button>
            </div>
          </div>
        ) : (
          <div className={`w-full max-w-lg bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-100 transition-all duration-300 transform ${animationClass}`}>
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-teal-200">
              <CheckCircleIcon className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">You're All Set!</h2>
            <p className="text-gray-500 mb-8 text-lg">
              Thank you for completing your weekly check-in. This helps Livora provide hyper-personalized clinical insights.
            </p>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>Submit Assessment <SparklesIcon className="h-5 w-5" /></>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
