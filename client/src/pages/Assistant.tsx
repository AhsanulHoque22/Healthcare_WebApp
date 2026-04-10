import React, { useState, useEffect, useRef } from 'react';
import API from '../api/api';
import { 
  PaperAirplaneIcon, 
  SparklesIcon, 
  TrashIcon, 
  PlusCircleIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isEmergency?: boolean;
  availableDoctors?: any[];
  bookingDetails?: any;
  intent?: string;
  createdAt?: string;
}

interface Session {
  conversationId: string;
  title: string;
  lastMessageAt: string;
}

const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      fetchHistory(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const resp = await API.get('/chatbot/sessions');
      if (resp.data.success) {
        setSessions(resp.data.data);
      }
    } catch (err) {
      console.error("Failed to load sessions");
    }
  };

  const fetchHistory = async (sessionId: string) => {
    try {
      const resp = await API.get(`/chatbot/history?conversationId=${sessionId}`);
      if (resp.data.data) {
        setMessages(resp.data.data.map((h: any) => ({
          role: h.role,
          content: h.content,
          isEmergency: h.intent === 'EMERGENCY',
          availableDoctors: h.availableDoctors,
          bookingDetails: h.bookingDetails,
          intent: h.intent,
          createdAt: h.createdAt
        })));
      }
    } catch (err) {
      toast.error("Failed to load conversation history");
    }
  };

  const generateSessionId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const handleSend = async (customText?: string) => {
    const text = customText || input;
    if (!text.trim() || isLoading) return;

    let sessionId = currentSessionId;
    let isNewSession = false;
    
    if (!sessionId) {
      sessionId = generateSessionId();
      setCurrentSessionId(sessionId);
      isNewSession = true;
    }

    const userMessage: Message = { role: 'user', content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await API.post('/chatbot/message', { 
        message: text, 
        conversationId: sessionId,
        title: isNewSession ? text.substring(0, 30) + (text.length > 30 ? '...' : '') : undefined
      });
      
      const aiResponse = response.data.data;
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse.message,
        intent: aiResponse.intent,
        isEmergency: aiResponse.intent === 'EMERGENCY',
        availableDoctors: aiResponse.availableDoctors,
        bookingDetails: aiResponse.bookingDetails,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      if (isNewSession) fetchSessions();
    } catch (error: any) {
      toast.error("Assistant reasoning engine failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const deleteSession = async (sessionId: string) => {
    if (window.confirm("Delete this conversation?")) {
      try {
        await API.delete(`/chatbot/history?conversationId=${sessionId}`);
        setSessions(prev => prev.filter(s => s.conversationId !== sessionId));
        if (currentSessionId === sessionId) {
          startNewChat();
        }
        toast.success("Conversation deleted");
      } catch (err) {
        toast.error("Failed to delete");
      }
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
      
      {/* Sidebar Overlay for Mobile */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden absolute top-6 left-6 z-20 bg-white p-2 rounded-xl border border-gray-200 shadow-lg text-gray-600 hover:text-blue-600 transition-all"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      )}

      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full lg:w-0'} 
        transition-all duration-300 bg-gray-50 border-r border-gray-100 flex flex-col z-30 absolute lg:relative h-full
      `}>
        <div className="p-6 border-b border-gray-200 bg-white flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-indigo-600" />
            Previous Chats
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400">
             <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all mb-4"
          >
            <PlusCircleIcon className="h-5 w-5" />
            New Assistant Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {sessions.map((s) => (
            <div 
              key={s.conversationId}
              className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                currentSessionId === s.conversationId 
                  ? 'bg-blue-50 border-blue-200 text-blue-900' 
                  : 'bg-white border-transparent hover:bg-white hover:border-gray-200 text-gray-700'
              }`}
              onClick={() => setCurrentSessionId(s.conversationId)}
            >
              <div className={`p-2 rounded-lg ${currentSessionId === s.conversationId ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <SparklesIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{s.title || 'Conversation'}</p>
                <p className="text-[10px] opacity-60 flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  {new Date(s.lastMessageAt).toLocaleDateString()}
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteSession(s.conversationId); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-10">
               <p className="text-xs text-gray-400 italic">No previous chats yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 flex items-center justify-between text-white shadow-lg relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md hidden sm:block">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Livora AI Assistant</h1>
              <p className="text-blue-100 text-xs sm:text-sm opacity-80 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Secure Clinical Intelligence
              </p>
            </div>
          </div>
          <button onClick={startNewChat} className="p-2 hover:bg-white/10 rounded-xl transition-all" title="Reset">
            <PlusCircleIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-gray-50/30">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
              <div className="bg-blue-100 p-6 rounded-full">
                <SparklesIcon className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">How can I help you today?</h2>
              <p className="text-gray-500 max-w-sm text-sm">Describe your symptoms, ask about doctors, or manage your appointments.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 w-full max-w-lg">
                {[
                  { q: "Symptoms for heart issue", label: "Check Heart Symptoms" },
                  { q: "Find cardiologist", label: "Find Cardiologists" },
                  { q: "What's my next appointment?", label: "My Appointments" },
                  { q: "Search for oncologist", label: "Find Oncologists" }
                ].map(item => (
                  <button key={item.q} onClick={() => handleSend(item.q)} className="px-5 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 hover:shadow-md transition-all text-left flex justify-between items-center group">
                    {item.label}
                    <ChevronRightIcon className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[85%] sm:max-w-[75%] group`}>
                <div className={`p-4 sm:p-5 rounded-3xl shadow-sm relative ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none' 
                    : m.isEmergency 
                      ? 'bg-red-50 border-2 border-red-200 text-red-900 rounded-tl-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-md'
                }`}>
                  <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap font-medium">{m.content}</p>
                  
                  {m.isEmergency && (
                    <div className="mt-4 bg-red-600 text-white p-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-pulse font-bold">
                      <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                      IMMEDIATE ACTION: Emergency services are being notified.
                    </div>
                  )}

                  {m.availableDoctors && m.availableDoctors.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {m.availableDoctors.map((doc: any) => (
                         <div key={doc.id} className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex flex-col justify-between hover:bg-white transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-all">
                               <SparklesIcon className="h-12 w-12" />
                            </div>
                            <div className="flex items-start gap-3 relative z-10">
                              <div className="bg-blue-600/10 p-2 rounded-xl text-blue-600 ring-2 ring-blue-600/20">
                                 <UserIcon className="h-6 w-6" />
                              </div>
                              <div className="min-w-0">
                                 <p className="font-bold text-sm text-blue-900 truncate">Dr. {doc.doctorName || doc.name}</p>
                                 <p className="text-[11px] text-blue-700 font-medium">{doc.department} • {doc.hospital}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => navigate(`/app/appointments?doctorId=${doc.id}&doctorName=${encodeURIComponent(doc.doctorName || doc.name)}`)}
                              className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs sm:text-sm font-extrabold hover:bg-blue-700 transition-all shadow-md group-hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2"
                            >
                              Book Now
                              <ChevronRightIcon className="h-4 w-4" />
                            </button>
                         </div>
                       ))}
                    </div>
                  )}

                  {m.bookingDetails && (
                    <div className="mt-4 bg-emerald-50 border-2 border-emerald-200 p-4 rounded-2xl text-emerald-900 shadow-sm relative">
                       <div className="absolute -top-3 left-6 px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">Confirmed</div>
                       <p className="font-bold text-sm flex items-center gap-2 mt-1">
                         Appointment Request Received
                       </p>
                       <p className="text-xs mt-2 font-medium opacity-90 leading-relaxed">
                         Scheduled with <strong>{m.bookingDetails.doctorName}</strong> on {m.bookingDetails.date}.
                         <br/>Serial Number: <strong>#{m.bookingDetails.serialNumber || 'TBD'}</strong>
                       </p>
                    </div>
                  )}
                </div>
                <div className={`mt-2 flex items-center gap-1.5 px-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formatTime(m.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-fade-in pl-2">
              <div className="bg-white border border-gray-100 rounded-3xl px-6 py-4 flex items-center gap-4 shadow-sm ring-1 ring-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce [animation-duration:1s]"></div>
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce [animation-duration:1s] [animation-delay:-0.2s]"></div>
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce [animation-duration:1s] [animation-delay:-0.4s]"></div>
                </div>
                <span className="text-xs sm:text-sm font-bold text-blue-700 tracking-tight uppercase">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} className="h-4" />
        </div>

        {/* Input Container */}
        <div className="p-4 sm:p-8 bg-white border-t border-gray-100 relative z-10">
          <div className="max-w-5xl mx-auto relative">
            <div className="flex items-center gap-3 bg-gray-50/80 backdrop-blur-md p-2 rounded-3xl border border-gray-200 shadow-inner group focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600/50 transition-all duration-300">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                placeholder="Talk to Livora Assistant..."
                className="flex-1 bg-transparent px-4 py-3 sm:py-4 focus:outline-none text-gray-800 font-medium placeholder:text-gray-400 placeholder:font-bold"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/30"
              >
                <PaperAirplaneIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex justify-center mt-4">
              <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase flex items-center gap-2 opacity-50">
                <ClockIcon className="h-3 w-3" />
                Private Clinical Session • HIPAA Compliant
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
