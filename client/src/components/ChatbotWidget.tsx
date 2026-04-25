import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  MicrophoneIcon,
  StopIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  UserIcon,
  TrashIcon,
  PlusCircleIcon,
  ArrowTopRightOnSquareIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  FlagIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';

import API from '../api/api';
import toast from 'react-hot-toast';

interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  isEmergency?: boolean;
  availableDoctors?: any[];
  bookingDetails?: any;
  isStreaming?: boolean;
  toolStatus?: string;
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

const ChatbotWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Protocol initiated. I am Livora AI, your clinical intelligence interface. How may I assist you with your health data or appointments today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [flagOpenForIndex, setFlagOpenForIndex] = useState<number | null>(null);
  const [escalatedIds, setEscalatedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Load history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        let activeId = localStorage.getItem('lastChatbotSessionId');
        if (!activeId) {
          const sessionsResp = await API.get('/chatbot/sessions');
          if (sessionsResp.data.data && sessionsResp.data.data.length > 0) {
            activeId = sessionsResp.data.data[0].conversationId;
          }
        }

        if (activeId) {
          setConversationId(activeId);
          localStorage.setItem('lastChatbotSessionId', activeId);
          const response = await API.get(`/chatbot/history?conversationId=${activeId}`);
          if (response.data.data.length > 0) {
            const formattedHistory = response.data.data.map((h: any) => ({
              id: h.id,
              role: h.role,
              content: h.content,
              intent: h.intent,
              isEmergency: h.intent === 'EMERGENCY',
              availableDoctors: h.availableDoctors,
              bookingDetails: h.bookingDetails,
              feedbackRating: h.feedbackRating,
              feedbackFlagged: h.feedbackFlagged,
            }));
            setMessages(formattedHistory);
            setTimeout(() => {
              scrollRef.current?.scrollIntoView({ behavior: 'auto' });
            }, 100);
          }
        }
      } catch (error) {
        console.error("Failed to load history");
      }
    };
    if (isOpen) fetchHistory();
  }, [isOpen]);

  // Voice Socket Setup
  useEffect(() => {
    const socketUrl = (process.env as any).REACT_APP_API_URL?.replace('/api', '') || window.location.origin.replace('3000', '5000');
    const socket = io(socketUrl, { 
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => console.log('[CHATBOT] Voice socket connected'));
    
    socket.on('transcript-result', (data: { transcript: string; isFinal: boolean }) => {
      if (data.isFinal) {
        setInput(prev => (prev + ' ' + data.transcript).trim());
      }
    });

    return () => { 
      socket.disconnect(); 
      cleanupMedia();
    };
  }, []);

  const cleanupMedia = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    mediaRecorderRef.current = null;
    streamRef.current = null;
  };

  const generateSessionId = () =>
    Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let activeId = conversationId;
    let isNewSession = false;
    if (!activeId) {
      activeId = generateSessionId();
      setConversationId(activeId);
      localStorage.setItem('lastChatbotSessionId', activeId);
      isNewSession = true;
    }

    const history = newMessages.map(m => ({ role: m.role, content: m.content }));
    const baseUrl = (process.env as any).REACT_APP_API_URL || '/api';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';

    // Add a placeholder streaming message
    const streamingPlaceholder: Message = { role: 'assistant', content: '', isStreaming: true };
    setMessages([...newMessages, streamingPlaceholder]);

    try {
      const response = await fetch(`${baseUrl}/chatbot/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          history,
          conversationId: activeId,
          title: isNewSession ? text.substring(0, 30) + '...' : undefined,
        }),
      });

      if (!response.ok || !response.body) throw new Error('Stream request failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedContent = '';
      let finalData: any = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));

            if (parsed.type === 'token') {
              streamedContent += parsed.token;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: streamedContent, isStreaming: true };
                return updated;
              });
            } else if (parsed.type === 'tool') {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], toolStatus: `Syncing: ${parsed.tool}…` };
                return updated;
              });
            } else if (parsed.type === 'done') {
              finalData = parsed;
            }
          } catch { /* skip malformed */ }
        }
      }

      // Replace streaming placeholder with final complete message
      if (finalData) {
        setMessages([...newMessages, {
          id: finalData.messageId,
          role: 'assistant',
          content: finalData.message || streamedContent,
          intent: finalData.intent,
          isEmergency: finalData.isEmergency,
          availableDoctors: finalData.availableDoctors,
          bookingDetails: finalData.bookingDetails,
          isStreaming: false,
          safetyPipelineTriggered: finalData.safetyPipelineTriggered ?? false,
          userMessage: text,
        }]);
        if (finalData.isEmergency) toast.error('Emergency Alert Triggered!');
      }

    } catch (error: any) {
      console.error('[Chatbot] Stream error:', error);
      toast.error('Neural sync interrupted');
      setMessages(messages);
      setInput(text);
    } finally {
      setIsLoading(false);
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
      toast.success(flagged ? 'Protocol flagged.' : 'Optimization feedback received.');
    } catch {
      toast.error('Feedback failed');
    }
  };

  const handleEscalate = async (msg: Message) => {
    if (!msg.id || escalatedIds.has(msg.id)) return;
    try {
      await API.post('/escalations', {
        conversationId,
        chatHistoryId: msg.id,
        userMessage: msg.userMessage || '(not available)',
        aiResponse: msg.content,
      });
      setEscalatedIds(prev => new Set(prev).add(msg.id!));
      toast.success('Escalated to human medical reviewer.');
    } catch {
      toast.error('Escalation failed');
    }
  };

  const clearHistory = async () => {
    if (!window.confirm("Purge all clinical chat history?")) return;
    try {
      await API.delete(`/chatbot/history?conversationId=${conversationId}`);
      setMessages([{ role: 'assistant', content: "Logic core wiped. Ready for fresh session." }]);
      setConversationId(null);
      localStorage.removeItem('lastChatbotSessionId');
      toast.success('History purged');
    } catch (e) {
      toast.error('Purge failed');
    }
  };

  const startNewChat = () => {
    setMessages([{ role: 'assistant', content: "Reinitializing conversation. Describe your clinical concern." }]);
    setConversationId(null);
    localStorage.removeItem('lastChatbotSessionId');
    toast.success('Session reset');
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopVoice();
    } else {
      await startVoice();
    }
  };

  const startVoice = async () => {
    try {
      cleanupMedia();
      if (!socketRef.current?.connected) socketRef.current?.connect();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      socketRef.current?.emit('start-transcription', { language: 'en' });
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socketRef.current?.connected) {
          const buffer = await event.data.arrayBuffer();
          socketRef.current.emit('audio-chunk', buffer);
        }
      };
      mediaRecorder.start(250);
      setIsRecording(true);
      toast.success("Voice monitoring active");
    } catch (e) {
      toast.error("Microphone linkage failed");
    }
  };

  const stopVoice = () => {
    try {
      cleanupMedia();
      if (socketRef.current?.connected) socketRef.current.emit('stop-transcription');
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999]">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            layoutId="chatbot-window"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-slate-900 text-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-center relative overflow-hidden group border border-white/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <SparklesIcon className="h-4 w-4 absolute top-2 right-2 text-indigo-400 animate-pulse z-10" />
            <ChatBubbleLeftRightIcon className="h-8 w-8 relative z-10" />
          </motion.button>
        ) : (
          <motion.div
            layoutId="chatbot-window"
            initial={{ opacity: 0, y: 100, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            className="bg-white rounded-[44px] shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-slate-100 w-[420px] h-[680px] flex flex-col overflow-hidden origin-bottom-right"
          >
            {/* ═══ PREMIUM HEADER ═══ */}
            <div className="px-8 py-7 bg-slate-900 text-white relative">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                 <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-[60px]" />
              </div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-[20px] border border-white/10 flex items-center justify-center shadow-lg">
                    <SparklesIcon className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Intelligence Hub</h3>
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.25em] flex items-center gap-2 mt-0.5">
                       <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                       {isLoading ? 'Processing' : 'Neural Core Active'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                  <button onClick={() => { setIsOpen(false); navigate(`/app/assistant?sessionId=${conversationId || ''}`); }} className="p-2 hover:bg-white/10 rounded-xl transition-all" title="Expand View"><ArrowTopRightOnSquareIcon className="h-4 w-4" /></button>
                  <button onClick={startNewChat} className="p-2 hover:bg-white/10 rounded-xl transition-all" title="New Logic Session"><PlusCircleIcon className="h-4 w-4" /></button>
                  <button onClick={clearHistory} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-rose-400" title="Purge Records"><TrashIcon className="h-4 w-4" /></button>
                  <button onClick={() => setIsOpen(false)} className="ml-1 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"><XMarkIcon className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            {/* ═══ CONVERSATION FIELD ═══ */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[88%] relative ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`p-5 rounded-[28px] text-sm leading-relaxed shadow-sm transition-all ${
                        m.role === 'user' 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : m.isEmergency 
                            ? 'bg-rose-50 border border-rose-100 text-rose-900 rounded-tl-none'
                            : 'bg-white border border-slate-100 text-slate-700/80 rounded-tl-none font-bold'
                      }`}>
                        {m.toolStatus && m.isStreaming && (
                          <div className="flex items-center gap-2 text-[9px] text-indigo-500 font-black uppercase tracking-widest mb-2 animate-pulse">
                             <CommandLineIcon className="h-3 w-3" />
                             {m.toolStatus}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">
                          {m.content}
                          {m.isStreaming && <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 h-4 bg-indigo-500 ml-1 rounded-sm align-middle" />}
                        </p>

                        {/* EMERGENCY OVERLAY */}
                        {m.isEmergency && (
                           <div className="mt-4 p-4 bg-rose-600 text-white rounded-2xl flex flex-col gap-3 animate-pulse shadow-xl shadow-rose-200">
                             <div className="flex items-center gap-3">
                               <ExclamationTriangleIcon className="h-6 w-6" />
                               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Priority Alert Triggered</span>
                             </div>
                             <p className="text-[11px] font-bold opacity-90 leading-tight">Emergency protocols initiated. Response teams notified.</p>
                           </div>
                        )}

                        {/* MATCHMAKING LIST */}
                        {m.availableDoctors && m.availableDoctors.length > 0 && (
                          <div className="mt-6 space-y-2">
                             <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] block ml-1 mb-3">Optimal Matches Found</span>
                             {m.availableDoctors.map((doc: any) => (
                               <div key={doc.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between group hover:bg-indigo-600 transition-all">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-900 shadow-sm group-hover:bg-white/20 group-hover:text-white transition-all">
                                      <UserIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="font-black text-xs text-slate-900 group-hover:text-white transition-colors">{doc.doctorName || doc.name}</p>
                                      <p className="text-[9px] font-black text-slate-400 group-hover:text-white/70 uppercase tracking-widest transition-colors">{doc.department}</p>
                                    </div>
                                 </div>
                                 <button
                                   onClick={() => { setIsOpen(false); navigate(`/app/appointments?doctorId=${doc.id}&doctorName=${encodeURIComponent(doc.doctorName || doc.name)}`); }}
                                   className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-indigo-600 transition-all shadow-lg"
                                 >
                                   Secure
                                 </button>
                               </div>
                             ))}
                          </div>
                        )}

                        {/* BOOKING SUCCESS */}
                        {m.bookingDetails && (
                          <div className="mt-6 bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                               <CalendarIcon className="h-6 w-6" />
                            </div>
                            <div>
                               <p className="text-xs font-black text-emerald-900 uppercase tracking-widest">Protocol Confirmed</p>
                               <p className="text-[10px] font-bold text-emerald-600 mt-1">Serial Registry: #{m.bookingDetails.serialNumber}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* QUALITY ASSURANCE BAR */}
                      {m.role === 'assistant' && m.id && !m.isStreaming && (
                        <div className="flex items-center gap-3 mt-3 px-2">
                           <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-slate-100 shadow-sm">
                             <button onClick={() => submitFeedback(i, 'thumbs_up')} className={`p-1.5 rounded-lg transition-all ${m.feedbackRating === 'thumbs_up' ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-emerald-400'}`}><HandThumbUpIcon className="h-3.5 w-3.5" /></button>
                             <button onClick={() => submitFeedback(i, 'thumbs_down')} className={`p-1.5 rounded-lg transition-all ${m.feedbackRating === 'thumbs_down' ? 'text-rose-500 bg-rose-50' : 'text-slate-300 hover:text-rose-400'}`}><HandThumbDownIcon className="h-3.5 w-3.5" /></button>
                           </div>
                           
                           <div className="relative group/flag">
                             <button onClick={() => setFlagOpenForIndex(flagOpenForIndex === i ? null : i)} className={`p-1.5 rounded-lg border border-slate-100 transition-all ${m.feedbackFlagged ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400'}`}><FlagIcon className="h-3.5 w-3.5" /></button>
                             {flagOpenForIndex === i && (
                               <div className="absolute bottom-full left-0 mb-3 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl py-2 min-w-[200px] z-50 overflow-hidden">
                                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 py-2 block border-b border-white/5">Report Deviation</span>
                                 {FLAG_REASONS.map(reason => (
                                   <button key={reason} onClick={() => { submitFeedback(i, undefined, true, reason); setFlagOpenForIndex(null); }} className="w-full text-left px-4 py-2.5 text-[10px] font-black text-slate-300 hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest">{reason}</button>
                                 ))}
                               </div>
                             )}
                           </div>

                           <div className="ml-auto">
                              {m.id && escalatedIds.has(m.id) ? (
                                <span className="flex items-center gap-1.5 text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] bg-emerald-50 px-3 py-1 rounded-full outline outline-1 outline-emerald-100">
                                  <UserGroupIcon className="h-3 w-3" /> ESCALATED
                                </span>
                              ) : (
                                <button onClick={() => handleEscalate(m)} className={`flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black tracking-[0.2em] transition-all uppercase ${m.safetyPipelineTriggered ? 'bg-amber-50 text-amber-600 outline outline-1 outline-amber-100 hover:bg-amber-100' : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                                  <UserGroupIcon className="h-3 w-3" /> Request Review
                                </button>
                              )}
                           </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <div className="flex justify-start">
                   <div className="bg-white border border-slate-100 px-5 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                      <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                   </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* ═══ COMMAND INPUT AREA ═══ */}
            <div className="px-8 py-6 bg-white border-t border-slate-50 relative">
               <div className="flex items-center gap-4">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleRecording}
                    className={`p-4 rounded-[20px] transition-all relative group ${isRecording ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    {isRecording ? <div className="absolute inset-x-0 bottom-1 flex justify-center gap-0.5"><motion.div animate={{ height: [4, 8, 4] }} transition={{ repeat: Infinity }} className="w-[1px] bg-white rounded-full" /><motion.div animate={{ height: [6, 12, 6] }} transition={{ repeat: Infinity, delay: 0.1 }} className="w-[1px] bg-white rounded-full" /><motion.div animate={{ height: [4, 8, 4] }} transition={{ repeat: Infinity, delay: 0.2 }} className="w-[1px] bg-white rounded-full" /></div> : null}
                    {isRecording ? <StopIcon className="h-6 w-6" /> : <MicrophoneIcon className="h-6 w-6" />}
                  </motion.button>

                  <div className="flex-1 relative">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Enter clinical query..."
                      className="w-full bg-slate-50 border-none rounded-[20px] px-6 py-4 text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:tracking-widest focus:ring-2 focus:ring-indigo-600/10 transition-all"
                    />
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className="p-4 bg-slate-900 text-white rounded-[20px] shadow-2xl shadow-slate-200 disabled:opacity-30 transition-all flex items-center justify-center border border-white/5"
                  >
                    <PaperAirplaneIcon className="h-6 w-6" />
                  </motion.button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatbotWidget;
