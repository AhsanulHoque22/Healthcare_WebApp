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
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

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

  // Handle URL parameters for session synchronization
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
    setTimeout(() => inputRef.current?.focus(), 100);
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
    inputRef.current?.focus();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      {/* Ambient background orbs — exactly like Dashboard */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative z-10 p-4 sm:p-6 animate-fade-in">
        {/* Page heading */}
        <div className="mb-5 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Livora AI Assistant</h1>
            <p className="text-sm text-gray-500">Your intelligent healthcare companion</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 bg-white/70 backdrop-blur-sm border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Online
          </div>
        </div>

        {/* Main chat shell */}
        <div className="flex gap-4" style={{ height: 'calc(100vh - 11rem)' }}>

          {/* ── SIDEBAR ──────────────────────────────────────────────── */}
          <div
            className={`
              flex-shrink-0 flex flex-col
              bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60
              transition-all duration-300 overflow-hidden
              ${isSidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 pointer-events-none'}
              lg:opacity-100 lg:pointer-events-auto
              ${!isSidebarOpen ? 'lg:w-0' : 'lg:w-72'}
            `}
          >
            {/* Sidebar top */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Conversations</span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* New chat button */}
            <div className="p-3 flex-shrink-0">
              <button
                id="new-chat-btn"
                onClick={startNewChat}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 px-4 rounded-xl font-semibold text-sm shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 transition-all duration-200"
              >
                <PlusCircleIcon className="h-4 w-4" />
                New Conversation
              </button>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
              {sessions.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <SparklesIcon className="h-6 w-6 text-indigo-400" />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">No conversations yet.</p>
                  <p className="text-[11px] text-gray-300 mt-1">Start chatting above.</p>
                </div>
              ) : (
                sessions.map(s => {
                  const isActive = s.conversationId === currentSessionId;
                  return (
                    <div
                      key={s.conversationId}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectSession(s.conversationId)}
                      onKeyDown={e => e.key === 'Enter' && selectSession(s.conversationId)}
                      className={`
                        group flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all duration-200 border
                        ${isActive
                          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-sm'
                          : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                        }
                      `}
                    >
                      <div className={`
                        w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                        ${isActive ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-sm' : 'bg-gray-100 group-hover:bg-indigo-100'}
                      `}>
                        <SparklesIcon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-gray-700'}`}>
                          {s.title || 'Conversation'}
                        </p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <ClockIcon className="h-2.5 w-2.5" />
                          {formatDate(s.lastMessageAt)}
                        </p>
                      </div>

                      <button
                        onClick={e => deleteSession(e, s.conversationId)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all"
                        aria-label="Delete"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar footer — trust badge */}
            <div className="p-3 border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-green-500" />
                HIPAA Compliant · Private Session
              </div>
            </div>
          </div>

          {/* ── MAIN CHAT ─────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 overflow-hidden min-w-0">

            {/* Chat header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-5 py-4 flex items-center gap-3 flex-shrink-0 relative overflow-hidden">
              {/* Decorative shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 pointer-events-none" />

              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
                aria-label="Toggle sidebar"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>

              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl flex-shrink-0">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-base leading-tight">Livora AI Assistant</h2>
                <p className="text-blue-100 text-xs flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Secure Clinical Intelligence
                </p>
              </div>

              {currentSessionId && (
                <span className="bg-white/15 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/20">
                  Active Chat
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-slate-50/50 to-white/30">

              {/* Empty state */}
              {messages.length === 0 && !isLoadingHistory && (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
                  <div className="relative mb-5">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-2xl" />
                    <div className="relative bg-gradient-to-br from-indigo-100 to-purple-100 p-5 rounded-3xl border border-indigo-200/50 shadow-lg">
                      <SparklesIcon className="h-10 w-10 text-indigo-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">How can I help you today?</h2>
                  <p className="text-gray-500 text-sm max-w-sm mb-6 leading-relaxed">
                    Describe your symptoms, search for doctors, or manage your appointments — all in one place.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md">
                    {QUICK_ACTIONS.map(item => (
                      <button
                        key={item.q}
                        onClick={() => handleSend(item.q)}
                        disabled={isLoading}
                        className="flex items-center gap-3 px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-200 hover:text-indigo-800 hover:shadow-md transition-all duration-200 text-left group disabled:opacity-50"
                      >
                        <span className="text-base">{item.emoji}</span>
                        <span className="flex-1">{item.label}</span>
                        <ChevronRightIcon className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-400.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Skeleton loader */}
              {isLoadingHistory && (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                      <div className="h-12 bg-gray-200 rounded-2xl" style={{ width: `${35 + i * 12}%` }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Messages */}
              {!isLoadingHistory && messages.map((m, i) => (
                <div key={i} className={`flex items-end gap-2.5 animate-fade-in-up ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>

                  {/* Avatar */}
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md mb-1">
                      <SparklesIcon className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {m.role === 'user' && (
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md mb-1">
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
                  )}

                  <div className={`max-w-[78%] flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {/* Bubble */}
                    <div className={`
                      rounded-2xl px-4 py-3 shadow-sm
                      ${m.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-br-md'
                        : m.isEmergency
                          ? 'bg-red-50 border-2 border-red-200 text-red-900 rounded-bl-md'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                      }
                    `}>
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-[450]">{m.content}</p>

                      {/* Emergency banner */}
                      {m.isEmergency && (
                        <div className="mt-3 bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                          <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                          IMMEDIATE ACTION: Call 999 or go to the nearest emergency room.
                        </div>
                      )}

                      {/* Doctor cards */}
                      {m.availableDoctors && m.availableDoctors.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {m.availableDoctors.map((doc: any) => (
                            <div
                              key={doc.id}
                              className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3 hover:shadow-md transition-all group"
                            >
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm transition-transform">
                                <UserIcon className="h-4.5 w-4.5 text-white h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-indigo-900 truncate">
                                  Dr. {doc.doctorName || doc.name}
                                </p>
                                <p className="text-[11px] text-indigo-600 font-medium">
                                  {doc.department} · {doc.hospital}
                                </p>
                              </div>
                              <button
                                onClick={() => navigate(`/app/appointments?doctorId=${doc.id}&doctorName=${encodeURIComponent(doc.doctorName || doc.name)}`)}
                                className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:shadow-md active:scale-95 transition-all"
                              >
                                Book
                                <ChevronRightIcon className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Booking confirmation */}
                      {m.bookingDetails && (
                        <div className="mt-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3 relative">
                          <span className="absolute -top-2.5 left-4 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                            Confirmed
                          </span>
                          <p className="text-sm font-bold text-emerald-800 mt-1">Appointment Requested ✓</p>
                          <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                            With <strong>{m.bookingDetails.doctorName}</strong> on {m.bookingDetails.date}.
                          </p>
                          {m.bookingDetails.serialNumber && (
                            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                              Serial #{m.bookingDetails.serialNumber}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <p className="text-[10px] text-gray-400 font-semibold mt-1 px-1 uppercase tracking-wider">
                      {formatTime(m.createdAt)}
                    </p>

                    {/* Feedback bar — only for assistant messages with a persisted id */}
                    {m.role === 'assistant' && m.id && (
                      <div className="flex items-center gap-0.5 mt-1 px-1">
                        <button
                          onClick={() => submitFeedback(i, 'thumbs_up')}
                          title="Good response"
                          className={`p-1 rounded-lg transition-all ${m.feedbackRating === 'thumbs_up' ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-green-500 hover:bg-green-50'}`}
                        >
                          <HandThumbUpIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => submitFeedback(i, 'thumbs_down')}
                          title="Bad response"
                          className={`p-1 rounded-lg transition-all ${m.feedbackRating === 'thumbs_down' ? 'text-red-500 bg-red-50' : 'text-gray-300 hover:text-red-400 hover:bg-red-50'}`}
                        >
                          <HandThumbDownIcon className="h-3.5 w-3.5" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setFlagOpenForIndex(flagOpenForIndex === i ? null : i)}
                            title="Flag response"
                            className={`p-1 rounded-lg transition-all ${m.feedbackFlagged ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:text-orange-400 hover:bg-orange-50'}`}
                          >
                            <FlagIcon className="h-3.5 w-3.5" />
                          </button>
                          {flagOpenForIndex === i && (
                            <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[180px] z-10">
                              {FLAG_REASONS.map(reason => (
                                <button
                                  key={reason}
                                  onClick={() => { submitFeedback(i, undefined, true, reason); setFlagOpenForIndex(null); }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all"
                                >
                                  {reason}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-end gap-2.5 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                    <SparklesIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-3 shadow-sm flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-2 h-2 bg-indigo-400 rounded-full inline-block"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                    <span className="text-xs text-indigo-500 font-semibold ml-1">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 bg-white/60 backdrop-blur-sm border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300 transition-all duration-200">
                <input
                  ref={inputRef}
                  id="assistant-chat-input"
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && !isLoading) handleSend();
                  }}
                  placeholder="Talk to Livora Assistant..."
                  className="flex-1 bg-transparent py-2 text-gray-800 text-[15px] font-medium placeholder:text-gray-400 focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  id="assistant-send-btn"
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 active:scale-95 disabled:opacity-40 disabled:shadow-none disabled:scale-100 transition-all duration-200"
                  aria-label="Send"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="text-center text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-2.5 flex items-center justify-center gap-1.5">
                <ShieldCheckIcon className="h-3 w-3 text-green-500" />
                Private Clinical Session · HIPAA Compliant
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
