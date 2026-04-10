import React, { useState, useEffect, useRef } from 'react';
import API from '../api/api';
import { 
  PaperAirplaneIcon, 
  SparklesIcon, 
  BackwardIcon, 
  TrashIcon, 
  PlusCircleIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isEmergency?: boolean;
  availableDoctors?: any[];
  bookingDetails?: any;
  intent?: string;
  context?: any;
}

const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const resp = await API.get('/chatbot/history');
      if (resp.data.data) {
        setMessages(resp.data.data.map((h: any) => ({
          role: h.role,
          content: h.content,
          isEmergency: h.intent === 'EMERGENCY',
          availableDoctors: h.availableDoctors,
          bookingDetails: h.bookingDetails,
          intent: h.intent
        })));
      }
    } catch (err) {
      console.error("Failed to load assistant history");
    }
  };

  const handleSend = async (customText?: string) => {
    const text = customText || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await API.post('/chatbot/chat', { message: text });
      const aiResponse = response.data.data;
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse.message,
        intent: aiResponse.intent,
        isEmergency: aiResponse.intent === 'EMERGENCY',
        availableDoctors: aiResponse.availableDoctors,
        bookingDetails: aiResponse.bookingDetails
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Assistant is unavailable. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = async () => {
    if (window.confirm("Start a new conversation? Current context will be archived.")) {
      setMessages([]);
      await API.delete('/chatbot/history');
      toast.success("New chat started");
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <SparklesIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Health Assistant</h1>
            <p className="text-blue-100 text-sm opacity-80 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Llama 3.3 Powered • Zero-Trust Secure
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={startNewChat} className="p-2 hover:bg-white/10 rounded-xl transition-all" title="Reset">
            <PlusCircleIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-blue-100 p-6 rounded-full">
              <SparklesIcon className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Hello! I'm your healthcare assistant.</h2>
            <p className="text-gray-600 max-w-md">I can help you find doctors, manage appointments, check your medical records, or identify symptoms.</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
               {["Find a cardiologist", "Book an appointment", "My active medicines", "Check lab status"].map(q => (
                 <button key={q} onClick={() => handleSend(q)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-200 transition-all">
                   {q}
                 </button>
               ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[80%] rounded-2xl p-5 shadow-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : m.isEmergency 
                  ? 'bg-red-50 border-2 border-red-200 text-red-900 rounded-tl-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
            }`}>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{m.content}</p>
              
              {m.isEmergency && (
                <div className="mt-4 bg-red-600 text-white p-3 rounded-xl text-sm flex items-center gap-2 animate-pulse">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  STAY CALM: Emergency services are being alerted.
                </div>
              )}

              {m.availableDoctors && m.availableDoctors.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                   {m.availableDoctors.map((doc: any) => (
                     <div key={doc.id} className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex flex-col justify-between hover:bg-white transition-all group">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-600/10 p-2 rounded-xl text-blue-600">
                             <UserIcon className="h-6 w-6" />
                          </div>
                          <div>
                             <p className="font-bold text-sm text-blue-900">{doc.doctorName || doc.name}</p>
                             <p className="text-xs text-blue-700">{doc.department} • {doc.hospital}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleSend(`Book an appointment with ${doc.doctorName || doc.name}`)}
                          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md group-hover:scale-[1.02]"
                        >
                          Book Now
                        </button>
                     </div>
                   ))}
                </div>
              )}

              {m.bookingDetails && (
                <div className="mt-4 bg-emerald-50 border-2 border-emerald-200 p-4 rounded-2xl text-emerald-900 shadow-sm">
                  <p className="font-bold flex items-center gap-2 text-sm mb-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Appointment Scheduled!
                  </p>
                  <p className="text-xs opacity-90 leading-relaxed font-medium">
                    With {m.bookingDetails.doctorName} on {m.bookingDetails.date}.
                    <br/>Status: <strong>{m.bookingDetails.note || 'Requested'}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-.1s]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-.2s]"></div>
              </div>
              <span className="text-sm font-medium text-blue-600">Assistant is thinking...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute inset-0 bg-blue-400/5 blur-xl group-hover:bg-blue-400/10 transition-colors"></div>
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder="Ask anything about your health or appointments..."
              className="flex-1 bg-gray-50/80 backdrop-blur-sm border border-gray-200 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400 shadow-inner"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-lg hover:shadow-blue-500/20"
            >
              <PaperAirplaneIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="flex justify-center mt-3">
          <p className="text-[10px] text-gray-400 font-medium">✨ Private & Secure End-to-End Encryption</p>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
