import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api/api';
import {
  PaperAirplaneIcon, SparklesIcon, TrashIcon, PlusCircleIcon, UserIcon,
  ExclamationTriangleIcon, ClockIcon, ChatBubbleLeftRightIcon, XMarkIcon,
  Bars3Icon, ShieldCheckIcon, HandThumbUpIcon, HandThumbDownIcon,
  UserGroupIcon, ArrowRightIcon, CommandLineIcon, BoltIcon
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
  { q: 'Check my recent heart symptoms', label: 'Cardiac Analysis', emoji: '❤️', color: 'text-rose-500' },
  { q: 'Find a cardiologist near me', label: 'Doctor Search', emoji: '🩺', color: 'text-indigo-500' },
  { q: "What's my next appointment?", label: 'Schedule Sync', emoji: '📅', color: 'text-amber-500' },
  { q: 'Analyze oncology trends', label: 'Oncology Check', emoji: '🔬', color: 'text-violet-500' },
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
    } catch { console.error('Failed to load sessions'); }
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
    let sessionId = currentSessionId || Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
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

  const startNewChat = () => { setCurrentSessionId(null); setMessages([]); localStorage.removeItem('lastChatbotSessionId'); };
  const selectSession = (id: string) => { if (id === currentSessionId) return; setCurrentSessionId(id); if (window.innerWidth < 1024) setIsSidebarOpen(false); };
  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); if (!window.confirm('Archive this conversation?')) return;
    try { await API.delete(`/chatbot/history?conversationId=${id}`); setSessions(prev => prev.filter(s => s.conversationId !== id)); if (currentSessionId === id) startNewChat(); }
    catch { toast.error('Failed to delete'); }
  };

  const submitFeedback = async (idx: number, rating?: 'thumbs_up' | 'thumbs_down') => {
    const msg = messages[idx]; if (!msg.id) return;
    try {
      await API.post('/chatbot/feedback', { messageId: msg.id, rating });
      setMessages(prev => prev.map((m, i) => i === idx ? { ...m, feedbackRating: rating } : m));
    } catch { toast.error('Failed to submit feedback'); }
  };

  const handleEscalate = async (msg: Message) => {
    if (!msg.id || escalatedIds.has(msg.id)) return;
    try {
      await API.post('/escalations', { conversationId: currentSessionId, chatHistoryId: msg.id, userMessage: msg.userMessage || '', aiResponse: msg.content });
      setEscalatedIds(prev => new Set(prev).add(msg.id!));
      toast.success('Medical officer notified for peer review.');
    } catch { toast.error('Escalation failed.'); }
  };

  return (
    <div className="h-screen bg-[#fafbff] relative overflow-hidden font-sans noise-overlay dot-grid">
      {/* Aurora Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] bg-indigo-500/[0.04] rounded-full blur-[140px] animate-aurora" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[700px] h-[700px] bg-violet-500/[0.04] rounded-full blur-[120px] animate-aurora" style={{ animationDelay: '-10s' }} />
      </div>

      <div className="flex h-full relative z-10">
        
        {/* PREMIUM SIDEBAR */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.aside 
              initial={{ x: -280, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -280, opacity: 0 }} 
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-80 flex-shrink-0 glass border-r border-white/20 flex flex-col relative z-20 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.05)]"
            >
              <div className="p-8 pb-4">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-12 h-12 rounded-[20px] bg-slate-900 flex items-center justify-center shadow-xl shadow-slate-900/10">
                      <CommandLineIcon className="h-6 w-6 text-indigo-400" />
                   </div>
                   <div>
                      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-1">Intelligence</h2>
                      <p className="text-sm font-bold text-slate-900">Archive Manager</p>
                   </div>
                </div>
                
                <MagneticButton 
                  onClick={startNewChat} 
                  className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all"
                >
                   <PlusCircleIcon className="h-4 w-4" /> Initialize New Protocol
                </MagneticButton>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 landing-scroll">
                <div className="px-4 py-6 flex items-center gap-3">
                   <div className="h-px flex-1 bg-slate-100" />
                   <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Diagnostic History</span>
                   <div className="h-px flex-1 bg-slate-100" />
                </div>
                
                <div className="space-y-1.5">
                  {sessions.map((s) => (
                    <button 
                      key={s.conversationId} 
                      onClick={() => selectSession(s.conversationId)} 
                      className={`group w-full text-left p-4 rounded-3xl transition-all duration-500 flex items-center justify-between border ${
                        currentSessionId === s.conversationId 
                          ? 'bg-white border-indigo-100 shadow-xl shadow-indigo-500/5 ring-1 ring-indigo-500/5' 
                          : 'border-transparent hover:bg-white/50 hover:border-slate-100 text-slate-500'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                         <p className={`text-xs font-bold truncate transition-colors ${currentSessionId === s.conversationId ? 'text-indigo-600' : 'text-slate-600 group-hover:text-slate-900'}`}>{s.title || 'Encrypted Dialogue'}</p>
                         <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1">{new Date(s.lastMessageAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center">
                        <TrashIcon 
                          onClick={(e) => deleteSession(e, s.conversationId)} 
                          className="h-4 w-4 opacity-0 group-hover:opacity-40 hover:text-rose-500 hover:opacity-100 transition-all pointer-events-auto" 
                        />
                      </div>
                    </button>
                  ))}
                  {sessions.length === 0 && (
                     <div className="py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4 grayscale opacity-40">
                           <ChatBubbleLeftRightIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No active protocols</p>
                     </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 mt-auto">
                 <div className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/50 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500/70">Secure Clinical Environment</span>
                 </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* CORE INTERFACE */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          
          {/* HEADER (Floating Nav Pill Style) */}
          <header className={`p-6 lg:p-8 flex justify-center sticky top-0 z-30 transition-all duration-500 ${messages.length > 0 ? 'bg-[#fafbff]/80 backdrop-blur-xl border-b border-slate-100' : ''}`}>
             <div className="max-w-7xl w-full flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    className="w-12 h-12 flex items-center justify-center glass border-white/20 rounded-2xl hover:bg-white transition-all shadow-sm group"
                   >
                      <Bars3Icon className="h-5 w-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
                   </button>
                   <div>
                      <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1 flex items-center gap-2">
                        Livora <span className="text-gradient bg-gradient-to-r from-indigo-500 to-violet-500 italic">Assistant</span>
                      </h1>
                      <div className="flex items-center gap-2">
                         <span className="w-1 h-1 rounded-full bg-emerald-500" />
                         <p className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400">Clinical AI Matrix v2.0</p>
                      </div>
                   </div>
                </div>
                
                <div className="hidden sm:flex items-center gap-3">
                   <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 overflow-hidden">
                           <UserIcon className="h-4 w-4" />
                        </div>
                      ))}
                   </div>
                   <div className="h-4 w-px bg-slate-200 mx-2" />
                   <div className="px-4 py-2 glass border-white/40 rounded-full flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Diagnostics</span>
                   </div>
                </div>
             </div>
          </header>

          {/* MESSAGE FLOW */}
          <main className="flex-1 overflow-y-auto px-6 py-6 lg:p-12 landing-scroll">
             <div className="max-w-4xl mx-auto">
                {messages.length === 0 && !isLoadingHistory && (
                  <div className="min-h-[70vh] flex flex-col justify-center py-12">
                     <Reveal variant="fadeUp">
                        <div className="text-center mb-16">
                           <div className="mx-auto w-24 h-24 rounded-[32px] glass border-white/20 flex items-center justify-center shadow-2xl mb-12 relative group transition-transform duration-700 hover:scale-110">
                              <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                              <SparklesIcon className="h-10 w-10 text-indigo-500 relative z-10" />
                           </div>
                           
                           <h2 className="text-5xl md:text-8xl font-extrabold text-slate-900 tracking-tighter leading-[0.9] mb-8 heading-display">
                              Elite Medical <br />
                              <span className="text-gradient bg-gradient-to-r from-indigo-600 via-violet-500 to-cyan-500 animate-gradient-shift">Support Intelligence.</span>
                           </h2>
                           
                           <p className="text-lg md:text-xl font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed mb-16 px-4">
                              Seamlessly bridge clinical expertise with agentic AI intelligence. Analyze records, search specialists, and optimize your healthcare journey.
                           </p>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-4">
                              {QUICK_ACTIONS.map((q, i) => (
                                <Reveal key={i} variant="scaleIn" delay={i * 0.1}>
                                   <button 
                                    onClick={() => handleSend(q.q)} 
                                    className="premium-card group text-left p-8 bg-white/70 backdrop-blur-sm border border-white/50 rounded-[32px] hover:bg-white hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.1)] transition-all duration-700"
                                   >
                                      <div className="flex items-center gap-6">
                                         <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl group-hover:bg-indigo-50 group-hover:scale-110 transition-all duration-500">
                                            {q.emoji}
                                         </div>
                                         <div>
                                            <p className="text-base font-bold text-slate-900 tracking-tight mb-1">{q.label}</p>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-400 transition-colors">Launch Diagnostic Protocol</p>
                                         </div>
                                         <ArrowRightIcon className="h-5 w-5 ml-auto text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all" />
                                      </div>
                                   </button>
                                </Reveal>
                              ))}
                           </div>
                        </div>
                     </Reveal>
                  </div>
                )}

                <div className="space-y-12">
                   {messages.map((m, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} 
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} 
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
                        className={`flex gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                         <div className={`w-12 h-12 rounded-[20px] flex-shrink-0 flex items-center justify-center border shadow-sm transition-transform duration-500 hover:scale-110 ${
                           m.role === 'user' 
                             ? 'bg-slate-900 border-slate-800' 
                             : 'glass border-white/30'
                         }`}>
                            {m.role === 'user' ? <UserIcon className="h-6 w-6 text-indigo-400" /> : <SparklesIcon className="h-6 w-6 text-indigo-500" />}
                         </div>
                         
                         <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`relative p-8 rounded-[32px] transition-all duration-500 ${
                              m.role === 'user' 
                                ? 'bg-slate-900 text-white rounded-tr-none shadow-2xl shadow-slate-900/10' 
                                : m.isEmergency 
                                  ? 'bg-rose-50/80 backdrop-blur-md text-rose-900 border border-rose-100 rounded-tl-none' 
                                  : 'bg-white/80 backdrop-blur-md border border-white/60 text-slate-600 rounded-tl-none shadow-xl shadow-indigo-500/[0.02]'
                            }`}>
                               <p className="text-base font-medium leading-relaxed tracking-wide whitespace-pre-wrap">{m.content}</p>

                               {m.isEmergency && (
                                  <motion.div 
                                    initial={{ scale: 0.95, opacity: 0 }} 
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="mt-8 p-8 bg-gradient-to-br from-rose-500 to-rose-600 rounded-[28px] text-white shadow-2xl shadow-rose-500/30"
                                  >
                                     <div className="flex items-center gap-5 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                           <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em]">Priority Emergency Alert</h3>
                                     </div>
                                     <p className="text-base font-bold leading-relaxed">Immediate clinical presence is mandated. Please proceed to the nearest emergency department or contact local emergency services (e.g., 999/911/112) immediately.</p>
                                     <button 
                                      onClick={() => navigate('/app/appointments')}
                                      className="mt-6 w-full py-4 bg-white text-rose-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 transition-colors"
                                     >
                                        Locate Immediate Care
                                     </button>
                                  </motion.div>
                               )}

                               {m.availableDoctors && m.availableDoctors.length > 0 && (
                                  <div className="mt-12 space-y-4">
                                     <div className="flex items-center gap-3 mb-6">
                                        <div className="h-px w-8 bg-indigo-200" />
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Verified Medical Specialists</p>
                                        <div className="h-px flex-1 bg-indigo-50" />
                                     </div>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                       {m.availableDoctors.map((doc: any, di: number) => (
                                          <div key={di} className="bg-white/50 border border-white/80 p-6 rounded-[28px] flex flex-col gap-6 hover:bg-white group/doc hover:shadow-xl hover:shadow-indigo-500/[0.05] transition-all duration-500">
                                             <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/doc:bg-indigo-50 group-hover/doc:text-indigo-500 transition-colors shadow-sm">
                                                   <UserIcon className="h-7 w-7" />
                                                </div>
                                                <div>
                                                   <p className="text-sm font-black text-slate-900 tracking-tight">Dr. {doc.doctorName || doc.name}</p>
                                                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{doc.department}</p>
                                                </div>
                                             </div>
                                             <MagneticButton 
                                               onClick={() => navigate(`/app/appointments?doctorId=${doc.id}&doctorName=${encodeURIComponent(doc.doctorName || doc.name)}`)} 
                                               className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-indigo-500/20 transition-all"
                                             >
                                                Book Consultation
                                             </MagneticButton>
                                          </div>
                                       ))}
                                     </div>
                                  </div>
                               )}
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-6 px-4 opacity-0 animate-fade-in delay-500 [animation-fill-mode:forwards]">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                  <ClockIcon className="h-3 w-3" /> {new Date(m.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                               {m.role === 'assistant' && m.id && (
                                  <div className="flex items-center gap-2">
                                     <div className="flex items-center p-1 bg-white border border-slate-100 rounded-xl">
                                        <button onClick={() => submitFeedback(i, 'thumbs_up')} className={`p-2 rounded-lg transition-all ${m.feedbackRating === 'thumbs_up' ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-slate-50 text-slate-400'}`}><HandThumbUpIcon className="h-3.5 w-3.5" /></button>
                                        <button onClick={() => submitFeedback(i, 'thumbs_down')} className={`p-2 rounded-lg transition-all ${m.feedbackRating === 'thumbs_down' ? 'bg-rose-50 text-rose-500' : 'hover:bg-slate-50 text-slate-400'}`}><HandThumbDownIcon className="h-3.5 w-3.5" /></button>
                                     </div>
                                     <div className="h-4 w-px bg-slate-200 mx-2" />
                                     {escalatedIds.has(m.id) ? (
                                        <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 flex items-center gap-2">
                                           <ShieldCheckIcon className="h-3 w-3" /> Under Professional Review
                                        </span>
                                     ) : (
                                        <button onClick={() => handleEscalate(m)} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 flex items-center gap-2 transition-all p-1.5 hover:bg-white hover:shadow-sm rounded-lg border border-transparent hover:border-slate-100">
                                           <UserGroupIcon className="h-3.5 w-3.5" /> Peer Review
                                        </button>
                                     )}
                                  </div>
                               )}
                            </div>
                         </div>
                      </motion.div>
                   ))}

                   {isLoading && (
                     <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-[20px] glass border-white/30 flex items-center justify-center animate-pulse">
                           <SparklesIcon className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div className="bg-white/60 backdrop-blur-md border border-white/80 p-8 rounded-[32px] rounded-tl-none shadow-sm flex flex-col gap-4 min-w-[240px]">
                           <div className="flex gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-600 animate-pulse">Processing Medical Query...</span>
                        </div>
                     </div>
                   )}
                   <div ref={messagesEndRef} className="h-20" />
                </div>
             </div>
          </main>

          {/* INPUT STATION (Floating Pill Style) */}
          <div className="px-6 py-10 lg:px-12 lg:pb-12 border-t border-slate-100 bg-[#fafbff]/80 backdrop-blur-xl relative z-20">
             <div className="max-w-4xl mx-auto">
                <div className="relative group perspective">
                   {/* Glowing background behind input */}
                   <div className="absolute -inset-[2px] bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-cyan-500/20 rounded-[32px] opacity-0 group-focus-within:opacity-100 transition-all blur-2xl -z-10 group-focus-within:scale-[1.02]" />
                   
                   <div className="relative flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-[30px] group-focus-within:border-indigo-200 transition-all duration-500 shadow-[0_10px_40px_-5px_rgba(0,0,0,0.03)] group-focus-within:shadow-[0_15px_50px_-10px_rgba(79,70,229,0.12)]">
                      <div className="hidden sm:flex pl-4 pr-1 text-slate-300">
                         <CommandLineIcon className="h-6 w-6" />
                      </div>
                      <input 
                        ref={inputRef} 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                        placeholder="Inquire clinical data or symptom analysis..." 
                        className="flex-1 bg-transparent px-2 py-4 text-base font-medium outline-none text-slate-900 placeholder:text-slate-400" 
                      />
                      <MagneticButton 
                        onClick={() => handleSend()} 
                        className={`p-4 rounded-[22px] shadow-xl transition-all active:scale-95 flex items-center justify-center min-w-[56px] min-h-[56px] ${
                          !input.trim() || isLoading 
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
                            : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-500/10'
                        }`}
                      >
                         <PaperAirplaneIcon className="h-6 w-6 rotate-[-45deg] translate-x-0.5 -translate-y-0.5" />
                      </MagneticButton>
                   </div>
                </div>
                
                <div className="mt-8 flex flex-wrap justify-center gap-x-12 gap-y-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                   <span className="flex items-center gap-2.5 hover:text-emerald-600 transition-colors cursor-default">
                      <ShieldCheckIcon className="h-4 w-4 text-emerald-500" /> E2E HIPAA Encryption
                   </span>
                   <span className="flex items-center gap-2.5 hover:text-indigo-600 transition-colors cursor-default">
                      <SparklesIcon className="h-4 w-4 text-indigo-400" /> Agentic Neural Pipeline
                   </span>
                   <span className="flex items-center gap-2.5 hover:text-slate-600 transition-colors cursor-default">
                      <ClockIcon className="h-4 w-4 text-slate-300" /> Real-time Sync
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
