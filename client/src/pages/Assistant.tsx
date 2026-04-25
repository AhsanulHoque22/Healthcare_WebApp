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
import { Reveal } from '../components/landing/AnimatedSection';

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
      if (resp.data.data) {
        setMessages(resp.data.data.map((h: any) => ({
          id: h.id, role: h.role, content: h.content, isEmergency: h.intent === 'EMERGENCY',
          availableDoctors: h.availableDoctors, bookingDetails: h.bookingDetails, intent: h.intent,
          createdAt: h.createdAt, feedbackRating: h.feedbackRating, feedbackFlagged: h.feedbackFlagged,
        })));
      }
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
    <div className="h-screen bg-[#fafbff] relative overflow-hidden font-sans noise-overlay">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-500/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="flex h-full relative z-10">
        
        {/* LOGICAL SIDEBAR */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} 
              className="w-80 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col relative z-20 shadow-2xl shadow-indigo-500/5">
              <div className="p-8 border-b border-slate-50">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-indigo-500/10">
                      <CommandLineIcon className="h-5 w-5 text-indigo-400" />
                   </div>
                   <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Command Center</h2>
                </div>
                <button onClick={startNewChat} className="w-full flex items-center justify-center gap-2.5 py-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:scale-[1.02] active:scale-[0.98]">
                   <PlusCircleIcon className="h-4 w-4" /> Start New Protocol
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                <p className="px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Archives</p>
                {sessions.map((s, i) => (
                  <button key={s.conversationId} onClick={() => selectSession(s.conversationId)} 
                    className={`group w-full text-left p-4 rounded-[22px] transition-all flex items-center justify-between ${currentSessionId === s.conversationId ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <div className="flex-1 min-w-0">
                       <p className={`text-xs font-bold truncate ${currentSessionId === s.conversationId ? 'text-white' : 'text-slate-700'}`}>{s.title || 'Encrypted Dialogue'}</p>
                       <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1">{new Date(s.lastMessageAt).toLocaleDateString()}</p>
                    </div>
                    <TrashIcon onClick={(e) => deleteSession(e, s.conversationId)} className="h-4 w-4 opacity-0 group-hover:opacity-60 hover:text-rose-500 transition-all" />
                  </button>
                ))}
              </div>
              
              <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex items-center gap-3">
                 <ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">E2E Medical Encryption</span>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* CORE INTERFACE */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          
          {/* HEADER DOCK */}
          <header className="flex items-center justify-between p-6 lg:px-10 border-b border-slate-100 bg-white/40 backdrop-blur-xl relative z-20">
            <div className="flex items-center gap-4">
               <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                  <Bars3Icon className="h-5 w-5 text-slate-900" />
               </button>
               <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Livora <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 italic">Core AI.</span></h1>
                  <div className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Synchronized Clinical Matrix</p>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest text-white">
                   <BoltIcon className="h-3.5 w-3.5 text-indigo-400" /> Active
                </div>
            </div>
          </header>

          {/* MESSAGE FLOW */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-12 custom-scrollbar bg-white/30 backdrop-blur-[2px]">
             <div className="max-w-4xl mx-auto space-y-12">
                {messages.length === 0 && !isLoadingHistory && (
                  <Reveal>
                    <div className="py-20 text-center">
                       <div className="relative inline-block mb-10">
                          <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full animate-pulse" />
                          <div className="relative w-24 h-24 rounded-[40px] bg-white border border-slate-100 flex items-center justify-center shadow-2xl">
                             <SparklesIcon className="h-10 w-10 text-indigo-500" />
                          </div>
                       </div>
                       <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-8">
                          Medical Analysis, <br />
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-400 animate-gradient-shift italic">Simplified.</span>
                       </h2>
                       <p className="text-lg font-medium text-slate-500 max-w-xl mx-auto mb-12">I can analyze symptoms, synchronize appointments, and explain pharmaceutical regimens with clinically-trained intelligence.</p>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {QUICK_ACTIONS.map((q, i) => (
                            <button key={i} onClick={() => handleSend(q.q)} className="group relative text-left p-6 bg-white border border-slate-100 rounded-[28px] hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                               <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-1000 bg-gradient-to-tr from-transparent via-indigo-500/[0.03] to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s]" />
                               <div className="flex items-center gap-4">
                                  <span className="w-12 h-12 rounded-[18px] bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors text-2xl">{q.emoji}</span>
                                  <div>
                                     <p className="text-sm font-black text-slate-900 tracking-tight">{q.label}</p>
                                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Quick Analysis Protocol</p>
                                  </div>
                               </div>
                            </button>
                          ))}
                       </div>
                    </div>
                  </Reveal>
                )}

                {messages.map((m, i) => (
                   <motion.div key={i} initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.6 }} 
                    className={`flex gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border ${m.role === 'user' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                         {m.role === 'user' ? <UserIcon className="h-6 w-6 text-indigo-400" /> : <SparklesIcon className="h-6 w-6 text-indigo-600" />}
                      </div>
                      <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                         <div className={`p-8 rounded-[32px] shadow-sm relative overflow-hidden group ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : m.isEmergency ? 'bg-rose-50 text-rose-900 border-rose-100 rounded-tl-none' : 'bg-white border border-slate-100 text-slate-600 rounded-tl-none'}`}>
                            {m.role === 'assistant' && <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-1000 bg-gradient-to-tr from-transparent via-white/[0.6] to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-[2.5s]" />}
                            <p className="text-base font-medium leading-relaxed tracking-wide whitespace-pre-wrap">{m.content}</p>

                            {m.isEmergency && (
                               <div className="mt-8 p-6 bg-rose-500 rounded-[24px] text-white flex items-center gap-5 shadow-xl shadow-rose-500/20 animate-soft-pulse">
                                  <ExclamationTriangleIcon className="h-8 w-8 shrink-0" />
                                  <p className="text-sm font-black uppercase tracking-widest leading-relaxed">Immediate clinical protocol required. Visit Emergency or dial medical services now.</p>
                               </div>
                            )}

                            {m.availableDoctors?.length > 0 && (
                               <div className="mt-10 space-y-4">
                                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4">Recommended Medical Officers</p>
                                  {m.availableDoctors.map((doc: any, di: number) => (
                                     <div key={di} className="bg-slate-50/50 border border-slate-100 p-5 rounded-[24px] flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-white transition-all group/doc">
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                           <div className="w-14 h-14 rounded-[20px] bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover/doc:bg-indigo-50 group-hover/doc:text-indigo-500 transition-colors shadow-sm"><UserIcon className="h-7 w-7" /></div>
                                           <div><p className="text-sm font-black text-slate-900 tracking-tight">Dr. {doc.doctorName || doc.name}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{doc.department} · Secure Access</p></div>
                                        </div>
                                        <button onClick={() => navigate(`/app/appointments?doctorId=${doc.id}&doctorName=${encodeURIComponent(doc.doctorName || doc.name)}`)} className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-indigo-600 transition-all">Consult</button>
                                     </div>
                                  ))}
                               </div>
                            )}
                         </div>

                         <div className="mt-4 flex flex-wrap items-center gap-6 px-2 opacity-60 hover:opacity-100 transition-opacity">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(m.createdAt || '').toLocaleTimeString()}</span>
                            {m.role === 'assistant' && m.id && (
                               <div className="flex items-center gap-2">
                                  <button onClick={() => submitFeedback(i, 'thumbs_up')} className={`p-2 rounded-lg transition-all ${m.feedbackRating === 'thumbs_up' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-white text-slate-400'}`}><HandThumbUpIcon className="h-4 w-4" /></button>
                                  <button onClick={() => submitFeedback(i, 'thumbs_down')} className={`p-2 rounded-lg transition-all ${m.feedbackRating === 'thumbs_down' ? 'bg-rose-50 text-rose-500' : 'hover:bg-white text-slate-400'}`}><HandThumbDownIcon className="h-4 w-4" /></button>
                                  <div className="h-4 w-px bg-slate-200 mx-2" />
                                  {escalatedIds.has(m.id) ? (
                                     <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-lg">Review Commenced</span>
                                  ) : (
                                     <button onClick={() => handleEscalate(m)} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 flex items-center gap-2 transition-all"><UserGroupIcon className="h-4 w-4" /> Professional Review</button>
                                  )}
                               </div>
                            )}
                         </div>
                      </div>
                   </motion.div>
                ))}

                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6">
                     <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center animate-pulse"><SparklesIcon className="h-6 w-6 text-indigo-400" /></div>
                     <div className="bg-white border border-slate-100 p-8 rounded-[32px] rounded-tl-none shadow-sm flex items-center gap-4">
                        <div className="flex gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" /><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-150" /><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-300" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Cognitive Assembly...</span>
                     </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} className="h-20" />
             </div>
          </div>

          {/* INPUT STATION */}
          <div className="p-8 lg:p-12 border-t border-slate-100 bg-white/40 backdrop-blur-xl relative z-20">
             <div className="max-w-4xl mx-auto">
                <div className="relative group">
                   <div className="absolute -inset-[2px] bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/10 rounded-[32px] opacity-0 group-focus-within:opacity-100 transition-opacity blur-xl -z-10" />
                   <div className="relative flex items-center gap-4 p-2 bg-slate-50 border border-slate-100 rounded-[30px] group-focus-within:bg-white group-focus-within:border-indigo-200 transition-all shadow-sm">
                      <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask Livora AI anything..." className="flex-1 bg-transparent px-6 py-4 text-base font-medium outline-none text-slate-900 placeholder:text-slate-400" />
                      <button onClick={() => handleSend()} disabled={!input.trim() || isLoading} className="p-4 bg-slate-900 text-white rounded-[22px] shadow-xl hover:bg-slate-800 disabled:opacity-20 transition-all active:scale-95"><PaperAirplaneIcon className="h-6 w-6" /></button>
                   </div>
                </div>
                <div className="mt-6 flex justify-center gap-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                   <span className="flex items-center gap-2"><ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500" /> HIPAA Secure Session</span>
                   <span className="flex items-center gap-2"><CommandLineIcon className="h-3.5 w-3.5 text-indigo-400" /> Neural Architecture Sync</span>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Assistant;
