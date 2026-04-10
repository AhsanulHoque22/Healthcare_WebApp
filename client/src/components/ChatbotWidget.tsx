import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
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
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

import API from '../api/api';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  isEmergency?: boolean;
  availableDoctors?: any[];
  bookingDetails?: any;
}

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm Livora AI. How can I help you today? You can describe your symptoms or ask for an appointment." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Load history on mount (Isolated to account)
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await API.get('/chatbot/history');
        if (response.data.data.length > 0) {
          const formattedHistory = response.data.data.map((h: any) => ({
            role: h.role,
            content: h.content,
            intent: h.intent,
            isEmergency: h.intent === 'EMERGENCY',
            availableDoctors: h.availableDoctors,
            bookingDetails: h.bookingDetails,
            context: h.context
          }));
          setMessages(formattedHistory);
          setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'auto' });
          }, 100);
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

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send history to LLM for context (stripped to role/content only)
      const history = newMessages.map(m => ({ role: m.role, content: m.content }));
      
      const response = await API.post('/chatbot/message', { message: text, history });
      
      const aiData = response.data.data;
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: aiData.message,
        intent: aiData.intent,
        isEmergency: aiData.isEmergency,
        availableDoctors: aiData.availableDoctors,
        bookingDetails: aiData.bookingDetails
      }]);

      if (aiData.isEmergency) {
        toast.error("Emergency Alert Triggered!");
      }

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to connect to AI server";
      console.error("[Chatbot] Error:", error);
      toast.error(errorMsg);
      // Rollback messages if failed
      setMessages(messages);
      setInput(text);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your chat history?")) return;
    try {
      await API.delete('/chatbot/history');
      setMessages([{ role: 'assistant', content: "History deleted. I'm starting fresh!" }]);
      toast.success('History wiped');
    } catch (e) {
      toast.error('Could not clear history');
    }
  };

  const startNewChat = () => {
    setMessages([{ role: 'assistant', content: "Starting a new conversation. What's on your mind?" }]);
    toast.success('New chat started');
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
      
      if (!socketRef.current?.connected) {
        socketRef.current?.connect();
      }

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
      toast.success("Listening...");
    } catch (e) {
      console.error("[Chatbot] Microphone error:", e);
      toast.error("Microphone access failed");
    }
  };

  const stopVoice = () => {
    try {
      cleanupMedia();
      if (socketRef.current?.connected) {
        socketRef.current.emit('stop-transcription');
      }
    } catch (e) {
      console.warn('[Chatbot] stopVoice error:', e);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all group relative animate-bounce"
        >
          <SparklesIcon className="h-4 w-4 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          <ChatBubbleLeftRightIcon className="h-8 w-8" />
        </button>
      ) : (
        <div className="bg-white w-[400px] h-[600px] rounded-3xl shadow-3xl border border-gray-100 flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <SparklesIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold">Livora AI</h3>
                <p className="text-[10px] opacity-80 uppercase tracking-widest flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></span>
                  {isLoading ? 'Processing...' : 'Online'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  navigate('/app/assistant');
                }} 
                className="hover:bg-white/20 p-2 rounded-full transition-all" 
                title="Full screen history"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5" />
              </button>
              <button onClick={startNewChat} className="hover:bg-white/20 p-2 rounded-full transition-all" title="New conversation">
                <PlusCircleIcon className="h-5 w-5" />
              </button>
              <button onClick={clearHistory} className="hover:bg-white/20 p-2 rounded-full transition-all" title="Delete history">
                <TrashIcon className="h-5 w-5" />
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-all">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : m.isEmergency 
                      ? 'bg-red-50 border-2 border-red-200 text-red-900 rounded-tl-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  
                  {/* Emergency Warning */}
                  {m.isEmergency && (
                    <div className="mt-3 bg-red-600 text-white p-2 rounded-xl text-[11px] flex items-center gap-2 animate-pulse">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      STAY CALM: Emergency services are being alerted.
                    </div>
                  )}

                  {/* Doctor Matchmaking Results */}
                  {m.availableDoctors && m.availableDoctors.length > 0 && (
                    <div className="mt-4 space-y-2">
                       {m.availableDoctors.map((doc: any) => (
                         <div key={doc.id} className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center justify-between group hover:bg-white transition-all">
                           <div className="flex items-center gap-3">
                             <div className="bg-blue-600/10 p-2 rounded-lg text-blue-600">
                               <UserIcon className="h-4 w-4" />
                             </div>
                             <div>
                               <p className="font-bold text-xs text-blue-900">{doc.name}</p>
                               <p className="text-[10px] text-blue-700">{doc.hospital}</p>
                             </div>
                           </div>
                           <button 
                             onClick={() => handleSend(`Book with ${doc.name}`)}
                             className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-lg hover:bg-blue-700 transition-all font-bold"
                           >
                             Book
                           </button>
                         </div>
                       ))}
                    </div>
                  )}

                  {/* Booking Confirmation */}
                  {m.bookingDetails && (
                    <div className="mt-4 bg-green-50 border-2 border-green-200 p-3 rounded-xl flex items-center gap-3">
                      <div className="bg-green-600 text-white p-2 rounded-lg">
                        <CalendarIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-green-900">Appointment Confirmed!</p>
                        <p className="text-[10px] text-green-700">Serial #{m.bookingDetails.serialNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white border border-gray-100 px-4 py-2 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-300"></div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
            <button 
              onClick={toggleRecording}
              className={`p-3 rounded-2xl transition-all ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              title={isRecording ? "Click to stop" : "Click to speak"}
            >
              {isRecording ? <StopIcon className="h-6 w-6" /> : <MicrophoneIcon className="h-6 w-6" />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type or click microphone..."
              className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-200 hover:scale-110 active:scale-95 disabled:opacity-50 transition-all"
            >
              <PaperAirplaneIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
