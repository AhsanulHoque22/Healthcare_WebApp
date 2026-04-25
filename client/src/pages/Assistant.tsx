import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api/api';
import {
  PaperAirplaneIcon, SparklesIcon, TrashIcon, UserIcon,
  ExclamationTriangleIcon, ClockIcon, ChatBubbleLeftRightIcon,
  Bars3Icon, ShieldCheckIcon, HandThumbUpIcon, HandThumbDownIcon,
  UserGroupIcon, ArrowRightIcon, CommandLineIcon, BoltIcon,
  HeartIcon, CalendarIcon, BeakerIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal, MagneticButton } from '../components/landing/AnimatedSection';

interface Message {
  id?: number; role: 'user' | 'assistant'; content: string; isEmergency?: boolean;
  availableDoctors?: any[]; bookingDetails?: any; intent?: string; createdAt?: string;
  feedbackRating?: 'thumbs_up' | 'thumbs_down' | null; feedbackFlagged?: boolean;
  safetyPipelineTriggered?: boolean; userMessage?: string;
}

interface Session { conversationId: string; title: string; lastMessageAt: string; }

const QUICK_ACTIONS = [
  {
    q: 'Check my recent heart symptoms',
    label: 'Cardiac Analysis',
    description: 'Analyze heart symptoms and risk factors',
    Icon: HeartIcon,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
  },
  {
    q: 'Find a cardiologist near me',
    label: 'Doctor Search',
    description: 'Find verified specialists near you',
    Icon: MagnifyingGlassIcon,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
  },
  {
    q: "What's my next appointment?",
    label: 'Schedule Sync',
    description: 'Review your upcoming appointments',
    Icon: CalendarIcon,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    q: 'Analyze oncology trends',
    label: 'Lab Analysis',
    description: 'Interpret lab results and medical data',
    Icon: BeakerIcon,
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
];

const FEATURE_PILLS = [
  { label: 'E2E HIPAA Encrypted', Icon: ShieldCheckIcon, color: 'text-emerald-400' },
  { label: 'Agentic Neural Pipeline', Icon: SparklesIcon, color: 'text-indigo-400' },
  { label: 'Real-time Sync', Icon: BoltIcon, color: 'text-amber-400' },
];

const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [escalatedIds, setEscalatedIds] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => { fetchSessions(); }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setIsSidebarOpen(true); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSessionId = params.get('sessionId');
    if (urlSessionId) {
      setCurrentSessionId(urlSessionId);
      localStorage.setItem('lastChatbotSessionId', urlSessionId);
    }
  }, [location.search]);

  useEffect(() => {
    if (currentSessionId) {
      fetchHistory(currentSessionId);
      localStorage.setItem('lastChatbotSessionId', currentSessionId);
    } else { setMessages([]); }
  }, [currentSessionId]);

  const fetchSessions = useCallback(async () => {
    try {
      const resp = await API.get('/chatbot/sessions');
      if (resp.data.success) setSessions(resp.data.data);
    } catch { /* silent fail */ }
  }, []);

  const fetchHistory = async (sessionId: string) => {
    setIsLoadingHistory(true);
    try {
      const resp = await API.get(`/chatbot/history?conversationId=${sessionId}`);
      const historyItems = resp.data.data || [];
      setMessages(historyItems.map((h: any) => ({
        id: h.id, role: h.role, content: h.content, isEmergency: h.intent === 'EMERGENCY',
        availableDoctors: h.availableDoctors, bookingDetails: h.bookingDetails, intent: h.intent,
        createdAt: h.createdAt, feedbackRating: h.feedbackRating, feedbackFlagged: h.feedbackFlagged,
      })));
    } catch { toast.error('Failed to load conversation history'); } finally { setIsLoadingHistory(false); }
  };

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text || isLoading) return;
    const sessionId = currentSessionId || Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const isNew = !currentSessionId;
    if (isNew) setCurrentSessionId(sessionId);

    const userMsg: Message = { role: 'user', content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await API.post('/chatbot/message', {
        message: text, conversationId: sessionId,
        title: isNew ? text.substring(0, 50) + (text.length > 50 ? '...' : '') : undefined,
      });
      const ai = response.data.data;
      setMessages(prev => [...prev, {
        id: ai.messageId, role: 'assistant', content: ai.message, intent: ai.intent,
        isEmergency: ai.intent === 'EMERGENCY', availableDoctors: ai.availableDoctors,
        bookingDetails: ai.bookingDetails, createdAt: new Date().toISOString(),
        safetyPipelineTriggered: ai.safetyPipelineTriggered ?? false, userMessage: text,
      }]);
      await fetchSessions();
    } catch {
      toast.error('Assistant failed. Please try again.');
      setMessages(prev => prev.filter(m => m !== userMsg));
      setInput(text);
    } finally { setIsLoading(false); }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    localStorage.removeItem('lastChatbotSessionId');
  };

  const selectSession = (id: string) => {
    if (id === currentSessionId) return;
    setCurrentSessionId(id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Archive this conversation?')) return;
    try {
      await API.delete(`/chatbot/history?conversationId=${id}`);
      setSessions(prev => prev.filter(s => s.conversationId !== id));
      if (currentSessionId === id) startNewChat();
    } catch { toast.error('Failed to delete'); }
  };

  const submitFeedback = async (idx: number, rating?: 'thumbs_up' | 'thumbs_down') => {
    const msg = messages[idx];
    if (!msg.id) return;
    try {
      await API.post('/chatbot/feedback', { messageId: msg.id, rating });
      setMessages(prev => prev.map((m, i) => i === idx ? { ...m, feedbackRating: rating } : m));
    } catch { toast.error('Failed to submit feedback'); }
  };

  const handleEscalate = async (msg: Message) => {
    if (!msg.id || escalatedIds.has(msg.id)) return;
    try {
      await API.post('/escalations', {
        conversationId: currentSessionId,
        chatHistoryId: msg.id,
        userMessage: msg.userMessage || '',
        aiResponse: msg.content,
      });
      setEscalatedIds(prev => new Set(prev).add(msg.id!));
      toast.success('Medical officer notified for peer review.');
    } catch { toast.error('Escalation failed.'); }
  };

  const currentSession = sessions.find(s => s.conversationId === currentSessionId);

  return (
    <div className="h-screen bg-[#fafbff] relative overflow-hidden font-sans noise-overlay dot-grid">

      {/* Aurora blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] bg-indigo-500/[0.04] rounded-full blur-[140px] animate-aurora" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-violet-500/[0.04] rounded-full blur-[120px] animate-aurora" style={{ animationDelay: '-10s' }} />
      </div>

      {/* Mobile overlay behind sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex h-full relative z-10">

        {/* ═══ SIDEBAR ═══ */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.aside
              initial={{ x: -288, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -288, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="w-72 flex-shrink-0 flex flex-col fixed inset-y-0 left-0 z-30 lg:relative lg:inset-auto lg:z-auto glass border-r border-white/20 shadow-[20px_0_60px_-20px_rgba(0,0,0,0.06)]"
            >
              {/* Header */}
              <div className="p-5 pb-4 border-b border-slate-100/70">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10 flex-shrink-0">
                    <CommandLineIcon className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-0.5">Conversations</p>
                    <p className="text-sm font-bold text-slate-900 truncate">Clinical Archive</p>
                  </div>
                  {sessions.length > 0 && (
                    <span className="text-[9px] font-black bg-indigo-50 text-indigo-500 border border-indigo-100 px-2 py-0.5 rounded-full tracking-widest flex-shrink-0">
                      {sessions.length}
                    </span>
                  )}
                </div>

                <MagneticButton
                  onClick={startNewChat}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-indigo-500/10 hover:bg-indigo-700 hover:shadow-indigo-500/25 transition-all duration-300"
                >
                  <BoltIcon className="h-3.5 w-3.5" /> New Conversation
                </MagneticButton>
              </div>

              {/* Session list */}
              <div className="flex-1 overflow-y-auto p-3 landing-scroll">
                {sessions.length > 0 ? (
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 px-3 pt-3 pb-2">Recent</p>
                    {sessions.map((s, idx) => (
                      <motion.button
                        key={s.conversationId}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.3 }}
                        onClick={() => selectSession(s.conversationId)}
                        className={`group w-full text-left p-3 rounded-xl transition-all duration-200 flex items-start justify-between border ${
                          currentSessionId === s.conversationId
                            ? 'bg-white border-indigo-100 shadow-md shadow-indigo-500/5'
                            : 'border-transparent hover:bg-white/80 hover:border-slate-100'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${currentSessionId === s.conversationId ? 'bg-indigo-500' : 'bg-slate-200 group-hover:bg-slate-300'}`} />
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold truncate leading-tight mb-0.5 transition-colors ${currentSessionId === s.conversationId ? 'text-indigo-600' : 'text-slate-600 group-hover:text-slate-900'}`}>
                              {s.title || 'Untitled Conversation'}
                            </p>
                            <p className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
                              <ClockIcon className="h-2.5 w-2.5" />
                              {new Date(s.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => deleteSession(e, s.conversationId)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-50 hover:text-rose-500 text-slate-300 transition-all flex-shrink-0 ml-1"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                    <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 opacity-50">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 mb-1">No conversations yet</p>
                    <p className="text-xs text-slate-400">Start a new conversation above</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100/70">
                <div className="px-3 py-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100/60 flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600/80">HIPAA Secure Environment</span>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ═══ MAIN INTERFACE ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* ─── Header ─── */}
          <header className={`px-5 lg:px-8 py-3.5 flex items-center justify-between flex-shrink-0 sticky top-0 z-10 transition-all duration-400 ${
            messages.length > 0 ? 'bg-[#fafbff]/90 backdrop-blur-xl border-b border-slate-100' : 'bg-transparent'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="w-9 h-9 flex items-center justify-center glass border-white/30 rounded-xl hover:bg-white transition-all shadow-sm group flex-shrink-0"
                aria-label="Toggle sidebar"
              >
                <Bars3Icon className="h-4 w-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
              </button>

              <div className="min-w-0">
                {messages.length > 0 && currentSession ? (
                  <>
                    <p className="text-sm font-black text-slate-900 tracking-tight truncate max-w-[180px] sm:max-w-sm md:max-w-lg leading-none mb-0.5">
                      {currentSession.title || 'Active Conversation'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Active Session</span>
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="text-base font-black text-slate-900 tracking-tight leading-none mb-0.5 flex items-center gap-1.5">
                      Livora
                      <span className="text-gradient bg-gradient-to-r from-indigo-500 to-violet-500 italic"> Assistant</span>
                    </h1>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical AI Matrix v2.0</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              {messages.length > 0 && (
                <MagneticButton
                  onClick={startNewChat}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <BoltIcon className="h-3 w-3 text-indigo-500" /> New Chat
                </MagneticButton>
              )}
              <div className="px-3 py-1.5 glass border-white/40 rounded-full flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Live</span>
              </div>
            </div>
          </header>

          {/* ─── Scroll Area ─── */}
          <main className="flex-1 overflow-y-auto landing-scroll">

            {/* ══ WELCOME / EMPTY STATE ══ */}
            {messages.length === 0 && !isLoadingHistory && (
              <div className="max-w-2xl mx-auto px-5 lg:px-6 py-8">

                {/* Hero Card */}
                <Reveal variant="fadeUp">
                  <div className="relative overflow-hidden rounded-[28px] bg-slate-900 p-8 md:p-10 text-white shadow-2xl shadow-slate-900/10 mb-7">
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10" />
                      <div className="absolute top-[-20%] right-[-10%] w-[280px] h-[280px] bg-indigo-400/20 rounded-full blur-[70px]" />
                      <div className="absolute bottom-[-20%] right-[15%] w-[200px] h-[200px] bg-violet-400/15 rounded-full blur-[60px]" />
                    </div>

                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/15 mb-6">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Clinical AI Matrix v2.0
                      </div>

                      <h2 className="text-3xl md:text-[2.75rem] font-black tracking-tight leading-[1.05] mb-4 heading-display">
                        Your Medical<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 animate-gradient-shift italic">
                          Intelligence Layer.
                        </span>
                      </h2>

                      <p className="text-slate-400 font-medium max-w-sm leading-relaxed text-sm md:text-base mb-7">
                        Bridge clinical expertise with agentic AI. Analyze records, find specialists, and optimize your healthcare journey.
                      </p>

                      <div className="flex flex-wrap gap-2.5">
                        {FEATURE_PILLS.map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.07] rounded-full border border-white/10">
                            <f.Icon className={`h-3.5 w-3.5 ${f.color}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{f.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* Quick Actions */}
                <Reveal variant="fadeUp" delay={0.1}>
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Quick Actions</span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {QUICK_ACTIONS.map((q, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.12 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          onClick={() => handleSend(q.q)}
                          className="premium-card group text-left p-4 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-[18px] hover:bg-white hover:shadow-[0_10px_35px_-8px_rgba(79,70,229,0.1)] hover:border-indigo-100 transition-all duration-500"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-xl ${q.bg} border ${q.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                              <q.Icon className={`h-5 w-5 ${q.color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-900 tracking-tight leading-tight">{q.label}</p>
                              <p className="text-xs font-medium text-slate-400 mt-0.5 leading-tight">{q.description}</p>
                            </div>
                            <ArrowRightIcon className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </Reveal>

                <Reveal variant="fadeIn" delay={0.35}>
                  <p className="text-center text-[10px] font-medium text-slate-400 mt-6">
                    Type your question below or select a quick action to begin
                  </p>
                </Reveal>
              </div>
            )}

            {/* ══ MESSAGES ══ */}
            <div className={`max-w-2xl mx-auto px-5 lg:px-6 ${messages.length > 0 ? 'py-6' : ''}`}>
              <div className="space-y-5">

                {/* History skeleton */}
                {isLoadingHistory && (
                  <div className="space-y-4 py-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                        <div className="w-9 h-9 rounded-2xl bg-slate-100 animate-pulse flex-shrink-0" />
                        <div className={`h-14 rounded-2xl bg-slate-100 animate-pulse ${i % 2 === 0 ? 'w-44' : 'w-64'}`} />
                      </div>
                    ))}
                  </div>
                )}

                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-[14px] flex-shrink-0 flex items-center justify-center border shadow-sm self-start mt-0.5 ${
                      m.role === 'user' ? 'bg-slate-900 border-slate-800' : 'glass border-white/30'
                    }`}>
                      {m.role === 'user'
                        ? <UserIcon className="h-4 w-4 text-indigo-400" />
                        : <SparklesIcon className="h-4 w-4 text-indigo-500" />
                      }
                    </div>

                    <div className={`flex flex-col max-w-[84%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      {/* Bubble */}
                      <div className={`relative p-4 md:p-5 transition-all duration-300 ${
                        m.role === 'user'
                          ? 'bg-slate-900 text-white rounded-2xl rounded-tr-sm shadow-lg shadow-slate-900/10'
                          : m.isEmergency
                            ? 'bg-rose-50/90 backdrop-blur-sm text-rose-900 border border-rose-100 rounded-2xl rounded-tl-sm'
                            : 'bg-white/90 backdrop-blur-sm border border-white/80 text-slate-700 rounded-2xl rounded-tl-sm shadow-md shadow-indigo-500/[0.03]'
                      }`}>
                        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{m.content}</p>

                        {/* Emergency Block */}
                        {m.isEmergency && (
                          <motion.div
                            initial={{ scale: 0.97, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mt-5 p-4 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl text-white shadow-xl shadow-rose-500/20"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                              </div>
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Priority Emergency Alert</h3>
                            </div>
                            <p className="text-sm font-semibold leading-relaxed opacity-95">
                              Immediate clinical presence is mandated. Please proceed to the nearest emergency department or contact local emergency services (e.g., 999/911/112) immediately.
                            </p>
                            <button
                              onClick={() => navigate('/app/appointments')}
                              className="mt-4 w-full py-2.5 bg-white text-rose-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 transition-colors"
                            >
                              Locate Immediate Care
                            </button>
                          </motion.div>
                        )}

                        {/* Doctor Cards */}
                        {m.availableDoctors && m.availableDoctors.length > 0 && (
                          <div className="mt-5 space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="h-px w-5 bg-indigo-200" />
                              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em]">Verified Specialists</p>
                              <div className="h-px flex-1 bg-indigo-50" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {m.availableDoctors.map((doc: any, di: number) => (
                                <div key={di} className="bg-white/60 border border-white/90 p-4 rounded-2xl flex flex-col gap-3.5 hover:bg-white group/doc hover:shadow-lg hover:shadow-indigo-500/[0.06] transition-all duration-300">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/doc:bg-indigo-50 group-hover/doc:text-indigo-500 transition-colors flex-shrink-0">
                                      <UserIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-slate-900 tracking-tight">Dr. {doc.doctorName || doc.name}</p>
                                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{doc.department}</p>
                                    </div>
                                  </div>
                                  <MagneticButton
                                    onClick={() => navigate(`/app/appointments?doctorId=${doc.id}&doctorName=${encodeURIComponent(doc.doctorName || doc.name)}`)}
                                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.18em] shadow-sm hover:bg-indigo-700 hover:shadow-indigo-500/20 transition-all"
                                  >
                                    Book Consultation
                                  </MagneticButton>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Message meta */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2.5 px-1">
                        <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {new Date(m.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {m.role === 'assistant' && m.id && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center p-0.5 bg-white border border-slate-100 rounded-lg">
                              <button
                                onClick={() => submitFeedback(i, 'thumbs_up')}
                                className={`p-1.5 rounded-md transition-all ${m.feedbackRating === 'thumbs_up' ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-slate-50 text-slate-400'}`}
                              >
                                <HandThumbUpIcon className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => submitFeedback(i, 'thumbs_down')}
                                className={`p-1.5 rounded-md transition-all ${m.feedbackRating === 'thumbs_down' ? 'bg-rose-50 text-rose-500' : 'hover:bg-slate-50 text-slate-400'}`}
                              >
                                <HandThumbDownIcon className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="h-3 w-px bg-slate-200" />
                            {escalatedIds.has(m.id) ? (
                              <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 flex items-center gap-1.5">
                                <ShieldCheckIcon className="h-2.5 w-2.5" /> Under Review
                              </span>
                            ) : (
                              <button
                                onClick={() => handleEscalate(m)}
                                className="text-[9px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1.5 transition-all p-1 hover:bg-white hover:shadow-sm rounded-lg border border-transparent hover:border-slate-100"
                              >
                                <UserGroupIcon className="h-3 w-3" /> Peer Review
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-9 h-9 rounded-[14px] glass border-white/30 flex items-center justify-center animate-pulse self-start">
                      <SparklesIcon className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm border border-white/80 px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-md flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600">Processing query...</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>
          </main>

          {/* ─── Input Area ─── */}
          <div className="px-5 lg:px-6 py-4 border-t border-slate-100 bg-[#fafbff]/90 backdrop-blur-xl flex-shrink-0 z-10">
            <div className="max-w-2xl mx-auto">

              <div className="relative group">
                {/* Focus glow behind input */}
                <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500/25 via-violet-500/20 to-cyan-500/25 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-lg -z-10" />

                <div className="relative flex items-center gap-2.5 px-3 py-2 bg-white border border-slate-200 rounded-2xl group-focus-within:border-indigo-200 transition-all duration-300 shadow-sm group-focus-within:shadow-[0_6px_25px_-5px_rgba(79,70,229,0.12)]">
                  <div className="pl-1.5 text-slate-300 flex-shrink-0">
                    <CommandLineIcon className="h-5 w-5" />
                  </div>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Ask about symptoms, find doctors, review records..."
                    className="flex-1 bg-transparent py-2.5 text-sm font-medium outline-none text-slate-900 placeholder:text-slate-400 min-w-0"
                  />
                  <div className="hidden md:flex items-center flex-shrink-0 pr-1">
                    <span className="text-[9px] font-medium text-slate-300 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg tracking-wider">⏎ Send</span>
                  </div>
                  <MagneticButton
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className={`p-2.5 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
                      !input.trim() || isLoading
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                        : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-500/10 hover:shadow-indigo-500/25'
                    }`}
                  >
                    <PaperAirplaneIcon className="h-5 w-5 rotate-[-45deg] translate-x-0.5 -translate-y-0.5" />
                  </MagneticButton>
                </div>
              </div>

              {/* Footer badges */}
              <div className="mt-3 flex flex-wrap justify-center gap-x-7 gap-y-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">
                <span className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors cursor-default">
                  <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500" /> HIPAA Encrypted
                </span>
                <span className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-default">
                  <SparklesIcon className="h-3.5 w-3.5 text-indigo-400" /> Agentic AI
                </span>
                <span className="flex items-center gap-1.5 hover:text-amber-500 transition-colors cursor-default">
                  <BoltIcon className="h-3.5 w-3.5 text-amber-400" /> Real-time
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Assistant;
