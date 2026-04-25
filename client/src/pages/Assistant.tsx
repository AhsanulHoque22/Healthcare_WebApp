import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api/api';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  TrashIcon,
  PlusCircleIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  ChevronRightIcon,
  Bars3Icon,
  ShieldCheckIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  FlagIcon,
  UserGroupIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- Visual Constants ---
const BACKGROUND_NAVY = "#0a0a1a";
const ACCENT_INDIGO = "#6366f1";
const ACCENT_VIOLET = "#a855f7";

interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  isEmergency?: boolean;
  availableDoctors?: any[];
  bookingDetails?: any;
  intent?: string;
  createdAt?: string;
  feedbackRating?: 'thumbs_up' | 'thumbs_down' | null;
  feedbackFlagged?: boolean;
  safetyPipelineTriggered?: boolean;
  userMessage?: string;
}

const FLAG_REASONS = [
  'Inaccurate information',
  'Missing disclaimer',
  'Dangerous advice',
  'Inappropriate content',
  'Other',
];

interface Session {
  conversationId: string;
  title: string;
  lastMessageAt: string;
}

const QUICK_ACTIONS = [
  { q: 'Symptoms for heart issue', label: 'Check Heart Symptoms', emoji: '❤️' },
  { q: 'Find cardiologist', label: 'Find Cardiologists', emoji: '🩺' },
  { q: "What's my next appointment?", label: 'My Appointments', emoji: '📅' },
  { q: 'Search for oncologist', label: 'Find Oncologists', emoji: '🔬' },
];

const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [flagOpenForIndex, setFlagOpenForIndex] = useState<number | null>(null);
  const [escalatedIds, setEscalatedIds] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    fetchSessions();
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
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  const fetchSessions = useCallback(async () => {
    try {
      const resp = await API.get('/chatbot/sessions');
      if (resp.data.success) setSessions(resp.data.data);
    } catch {
      console.error('Failed to load sessions');
    }
  }, []);

  const fetchHistory = async (sessionId: string) => {
    setIsLoadingHistory(true);
    try {
      const resp = await API.get(`/chatbot/history?conversationId=${sessionId}`);
      if (resp.data.data) {
        setMessages(
          resp.data.data.map((h: any) => ({
            id: h.id,
            role: h.role,
            content: h.content,
            isEmergency: h.intent === 'EMERGENCY',
            availableDoctors: h.availableDoctors,
            bookingDetails: h.bookingDetails,
            intent: h.intent,
            createdAt: h.createdAt,
            feedbackRating: h.feedbackRating,
            feedbackFlagged: h.feedbackFlagged,
          }))
        );
      }
    } catch {
      toast.error('Failed to load conversation history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const generateSessionId = () =>
    Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text || isLoading) return;

    let sessionId = currentSessionId;
    let isNewSession = false;

    if (!sessionId) {
      sessionId = generateSessionId();
      setCurrentSessionId(sessionId);
      isNewSession = true;
    }

    const userMessage: Message = {
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await API.post('/chatbot/message', {
        message: text,
        conversationId: sessionId,
        title: isNewSession
          ? text.substring(0, 50) + (text.length > 50 ? '...' : '')
          : undefined,
      });

      const aiResponse = response.data.data;
      setMessages(prev => [
        ...prev,
        {
          id: aiResponse.messageId,
          role: 'assistant',
          content: aiResponse.message,
          intent: aiResponse.intent,
          isEmergency: aiResponse.intent === 'EMERGENCY',
          availableDoctors: aiResponse.availableDoctors,
          bookingDetails: aiResponse.bookingDetails,
          createdAt: new Date().toISOString(),
          safetyPipelineTriggered: aiResponse.safetyPipelineTriggered ?? false,
          userMessage: text,
        },
      ]);
      await fetchSessions();
    } catch {
      toast.error('Assistant failed. Please try again.');
      setMessages(prev => prev.filter(m => m !== userMessage));
      setInput(text);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    localStorage.removeItem('lastChatbotSessionId');
  };

  const selectSession = (sessionId: string) => {
    if (sessionId === currentSessionId) return;
    setCurrentSessionId(sessionId);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await API.delete(`/chatbot/history?conversationId=${sessionId}`);
      setSessions(prev => prev.filter(s => s.conversationId !== sessionId));
      if (currentSessionId === sessionId) startNewChat();
      toast.success('Conversation deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const submitFeedback = async (
    index: number,
    rating?: 'thumbs_up' | 'thumbs_down',
    flagged?: boolean,
    flagReason?: string
  ) => {
    const msg = messages[index];
    if (!msg.id) return;
    try {
      await API.post('/chatbot/feedback', { messageId: msg.id, rating, flagged, flagReason });
      setMessages(prev => prev.map((m, i) =>
        i === index
          ? { ...m, feedbackRating: rating ?? m.feedbackRating, feedbackFlagged: flagged ?? m.feedbackFlagged }
          : m
      ));
      toast.success(flagged ? 'Response flagged — thank you.' : 'Feedback recorded.');
    } catch {
      toast.error('Failed to submit feedback');
    }
  };

  const handleEscalate = async (msg: Message) => {
    if (!msg.id || escalatedIds.has(msg.id)) return;
    try {
      await API.post('/escalations', {
        conversationId: currentSessionId,
        chatHistoryId: msg.id,
        userMessage: msg.userMessage || '(not available)',
        aiResponse: msg.content,
      });
      setEscalatedIds(prev => new Set(prev).add(msg.id!));
      toast.success('A healthcare professional has been notified and will review your query.');
    } catch {
      toast.error('Failed to submit review request. Please try again.');
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-slate-200 relative overflow-hidden noise-overlay">
      {/* --- PREMIUM BACKGROUND ELEMENTS --- */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 dot-grid opacity-20" />
        
        {/* Aurora Blobs */}
        <motion.div 
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full" 
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-violet-600/10 blur-[120px] rounded-full" 
        />
      </div>

      <div className="relative z-10 p-4 lg:p-8 flex flex-col h-screen">
        
        {/* --- TOP NAVIGATION BAR --- */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative group overflow-hidden">
              <SparklesIcon className="h-6 w-6 text-indigo-400 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white heading-display">
                Livora <span className="text-gradient bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 animate-gradient-shift">AI Assistant</span>
              </h1>
              <p className="text-slate-400 text-sm font-medium tracking-wide mt-0.5 opacity-80">Next-gen clinical intelligence engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-[0.1em]">Cloud Sync Active</span>
            </div>
            
            <button
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300"
            >
              <Bars3Icon className="h-6 w-6 text-white" />
            </button>
          </div>
        </motion.header>

        {/* --- MAIN INTERFACE GRID --- */}
        <div className="flex-1 flex gap-6 overflow-hidden">
          
          {/* SIDEBAR: CONVERSATIONS */}
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.aside
                initial={{ x: -40, opacity: 0, width: 0 }}
                animate={{ x: 0, opacity: 1, width: 340 }}
                exit={{ x: -40, opacity: 0, width: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="hidden lg:flex flex-col glass-dark rounded-[32px] overflow-hidden border border-white/5 relative z-20 shadow-2xl"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-400" />
                    <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Threads</span>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startNewChat}
                    className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-300 transition-all shadow-lg"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                  </motion.button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {sessions.length === 0 ? (
                    <div className="text-center py-20 px-6 opacity-40">
                      <SparklesIcon className="h-8 w-8 mx-auto mb-4 text-slate-500" />
                      <p className="text-sm font-medium">Memory is empty.</p>
                      <p className="text-[11px] mt-1">Start a new query to begin sync.</p>
                    </div>
                  ) : (
                    sessions.map((s, idx) => (
                      <motion.div
                        key={s.conversationId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => selectSession(s.conversationId)}
                        className={`
                          group relative p-4 rounded-2xl cursor-pointer transition-all duration-500 border overflow-hidden
                          ${s.conversationId === currentSessionId 
                             ? 'bg-indigo-600/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.05)]' 
                             : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                          }
                        `}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${s.conversationId === currentSessionId ? 'bg-indigo-500' : 'bg-white/5 group-hover:bg-white/10'}`}>
                            <SparklesIcon className={`h-5 w-5 ${s.conversationId === currentSessionId ? 'text-white' : 'text-slate-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm font-bold truncate tracking-tight transition-colors ${s.conversationId === currentSessionId ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                              {s.title || 'Encrypted Chat'}
                            </h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                              {formatDate(s.lastMessageAt)}
                            </p>
                          </div>
                          
                          <button 
                            onClick={(e) => deleteSession(e, s.conversationId)}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                <div className="p-6 border-t border-white/5 bg-white/[0.01]">
                   <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] justify-center">
                     <ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
                     E2E Encrypted Pipeline
                   </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* MAIN CONVERSATION AREA */}
          <motion.main 
            layout
            className="flex-1 flex flex-col glass-dark rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden"
          >
            {/* Chat Status Bar */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01] backdrop-blur-md relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white uppercase tracking-widest">Active Neural Engine</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest">v4.2.0</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium tracking-wide">Processing queries via secure medical LLM</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                <ClockIcon className="h-3.5 w-3.5 text-indigo-400" />
                Low Latency Mode
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 custom-scrollbar relative">
              
              {/* Empty State / Welcome */}
              <AnimatePresence>
                {messages.length === 0 && !isLoadingHistory && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto"
                  >
                    <div className="relative mb-8">
                       <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-glow" />
                       <div className="relative p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl">
                         <SparklesIcon className="h-16 w-16 text-indigo-400" />
                       </div>
                    </div>
                    
                    <h2 className="text-4xl lg:text-5xl font-extrabold text-white heading-display mb-4">
                      How can I <span className="text-gradient bg-gradient-to-r from-indigo-400 to-violet-400">empower</span> you today?
                    </h2>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10 opacity-80">
                      I can help you analyze symptoms, find doctors, manage prescriptions, or explain medical reports with clinical precision.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      {QUICK_ACTIONS.map((action, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(99,102,241,0.3)" }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSend(action.q)}
                          className="flex items-center gap-4 p-5 rounded-[24px] bg-white/[0.02] border border-white/5 text-left transition-all group"
                        >
                          <span className="text-2xl h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">{action.emoji}</span>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white tracking-tight">{action.label}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Quick diagnostic query</p>
                          </div>
                          <ArrowRightIcon className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 transition-all" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Threads */}
              <div className="max-w-4xl mx-auto space-y-10">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-[18px] flex items-center justify-center shadow-2xl relative group overflow-hidden ${
                      m.role === 'user' ? 'bg-indigo-500' : 'bg-white/5 border border-white/10'
                    }`}>
                      {m.role === 'user' ? <UserIcon className="h-6 w-6 text-white" /> : <SparklesIcon className="h-6 w-6 text-indigo-400" />}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Message Bubble Column */}
                    <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`
                        p-6 rounded-[28px] relative overflow-hidden transition-all duration-500 premium-card
                        ${m.role === 'user' 
                           ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white rounded-tr-none shadow-[0_20px_40px_rgba(99,102,241,0.2)]' 
                           : m.isEmergency 
                             ? 'bg-red-500/10 border border-red-500/30 text-white rounded-tl-none' 
                             : 'bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-tl-none backdrop-blur-xl shadow-2xl'
                        }
                      `}>
                        <p className="text-[15px] lg:text-[16px] leading-relaxed font-medium tracking-wide whitespace-pre-wrap">
                          {m.content}
                        </p>

                        {/* Emergency High-Impact UI */}
                        {m.isEmergency && (
                          <div className="mt-6 p-4 rounded-2xl bg-red-500 border border-red-400 flex items-center gap-4 animate-soft-pulse shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                            <div className="p-2 bg-white/20 rounded-xl overflow-hidden">
                              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-white uppercase tracking-widest leading-tight">Emergency Protocol Triggered</p>
                               <p className="text-xs font-bold text-red-50 mt-1">Please seek immediate medical attention at a nearby hospital or dial emergency services (999/911).</p>
                            </div>
                          </div>
                        )}

                        {/* Doctor Referral Cards */}
                        {m.availableDoctors && m.availableDoctors.length > 0 && (
                          <div className="mt-8 space-y-4">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Recommended Specialists</p>
                            {m.availableDoctors.map((doc: any, di: number) => (
                              <motion.div
                                key={di}
                                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                                className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-5 transition-all shadow-xl"
                              >
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                  <UserIcon className="h-7 w-7 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-black text-white tracking-tight">Dr. {doc.doctorName || doc.name}</h4>
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-black text-indigo-400 uppercase tracking-widest">Available</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    {doc.department} • {doc.hospital || 'Medical Center'}
                                  </p>
                                </div>
                                <button
                                  onClick={() => navigate(`/app/appointments?doctorId=${doc.id}&doctorName=${encodeURIComponent(doc.doctorName || doc.name)}`)}
                                  className="px-5 py-2.5 bg-white text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-400 hover:text-white transition-all shadow-lg active:scale-95"
                                >
                                  Consult
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* Booking Success Confirmation */}
                        {m.bookingDetails && (
                           <div className="mt-6 p-5 rounded-[24px] bg-emerald-500/10 border border-emerald-500/30 overflow-hidden relative group">
                              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full" />
                              <div className="relative z-10 flex items-center gap-4">
                                <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                                  <ShieldCheckIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                   <h4 className="text-sm font-black text-white uppercase tracking-widest">Appointment Confirmed</h4>
                                   <p className="text-xs font-medium text-emerald-400/80 mt-1">Confirmed with Dr. {m.bookingDetails.doctorName} for {m.bookingDetails.date}.</p>
                                </div>
                              </div>
                           </div>
                        )}
                      </div>

                      {/* Message Meta / Feedbacks */}
                      <div className="mt-3 flex items-center gap-4 px-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{formatTime(m.createdAt)}</span>
                        
                        {m.role === 'assistant' && m.id && (
                          <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                            <button onClick={() => submitFeedback(i, 'thumbs_up')} className={`p-1.5 rounded-lg transition-all ${m.feedbackRating === 'thumbs_up' ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5 text-slate-500'}`}>
                              <HandThumbUpIcon className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => submitFeedback(i, 'thumbs_down')} className={`p-1.5 rounded-lg transition-all ${m.feedbackRating === 'thumbs_down' ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/5 text-slate-500'}`}>
                              <HandThumbDownIcon className="h-3.5 w-3.5" />
                            </button>
                            
                            <div className="h-3 w-[1px] bg-white/10 mx-1" />
                            
                            {escalatedIds.has(m.id) ? (
                               <div className="flex items-center gap-2 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                                 <UserGroupIcon className="h-3 w-3 text-indigo-400" />
                                 <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Medical Review Requested</span>
                               </div>
                            ) : (
                              <button 
                                onClick={() => handleEscalate(m)}
                                className="flex items-center gap-2 hover:bg-indigo-500/10 px-2.5 py-1 rounded-full transition-all text-slate-500 hover:text-indigo-400"
                              >
                                <UserGroupIcon className="h-3.5 w-3.5" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Request Professional Review</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Thinking / Typing State */}
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-6"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                      <SparklesIcon className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div className="p-6 rounded-[28px] rounded-tl-none bg-white/[0.03] border border-white/[0.08] flex items-center gap-3 backdrop-blur-xl">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs font-black text-indigo-400 uppercase tracking-widest ml-2">Assembling diagnosis...</span>
                    </div>
                  </motion.div>
                )}
              </div>
              
              <div ref={messagesEndRef} className="h-10" />
            </div>

            {/* Input Dock */}
            <div className="p-6 lg:p-10 border-t border-white/5 bg-white/[0.01] backdrop-blur-2xl relative z-20">
               <div className="max-w-4xl mx-auto">
                  <div className="relative flex items-center group">
                    {/* Glow effect for input */}
                    <div className="absolute inset-[-2px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/30 to-violet-600/0 rounded-[30px] opacity-0 group-focus-within:opacity-100 transition-opacity blur-md" />
                    
                    <div className="relative flex-1 bg-white/[0.03] border border-white/10 group-focus-within:border-indigo-500/50 group-focus-within:bg-white/[0.05] rounded-[28px] transition-all duration-500 flex items-center pr-2 shadow-2xl pl-6">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => (e.key === 'Enter' && !isLoading) && handleSend()}
                        placeholder="Talk to Livora AI (e.g., 'Analyze my heart symptoms')..."
                        className="flex-1 bg-transparent py-5 text-white text-base font-medium placeholder:text-slate-500 focus:outline-none"
                      />
                      <motion.button
                        disabled={isLoading || !input.trim()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSend()}
                        className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-20 disabled:scale-100 p-4 rounded-[22px] text-white shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center"
                      >
                        <PaperAirplaneIcon className="h-6 w-6" />
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="mt-5 flex items-center justify-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-2"><ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500" /> HIPAA Secure Session</span>
                    <span className="w-1 h-1 bg-white/10 rounded-full" />
                    <span className="flex items-center gap-2"><PlusCircleIcon className="h-3.5 w-3.5 text-indigo-400" /> Multi-modal engine ready</span>
                  </div>
               </div>
            </div>

          </motion.main>
        </div>
      </div>

      {/* Ambient noise texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
    </div>
  );
};

export default Assistant;
