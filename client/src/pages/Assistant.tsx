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
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
  ChevronRightIcon,
  Bars3Icon,
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

const QUICK_ACTIONS = [
  { q: 'Symptoms for heart issue', label: 'Check Heart Symptoms' },
  { q: 'Find cardiologist', label: 'Find Cardiologists' },
  { q: "What's my next appointment?", label: 'My Appointments' },
  { q: 'Search for oncologist', label: 'Find Oncologists' },
];

const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fetch session list on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      fetchHistory(currentSessionId);
    } else {
      setMessages([]);
    }
    // Focus input after session switch
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [currentSessionId]);

  const fetchSessions = useCallback(async () => {
    try {
      const resp = await API.get('/chatbot/sessions');
      if (resp.data.success) {
        setSessions(resp.data.data);
      }
    } catch (err) {
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
            role: h.role,
            content: h.content,
            isEmergency: h.intent === 'EMERGENCY',
            availableDoctors: h.availableDoctors,
            bookingDetails: h.bookingDetails,
            intent: h.intent,
            createdAt: h.createdAt,
          }))
        );
      }
    } catch (err) {
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
      // Set state immediately so subsequent messages use same session
      setCurrentSessionId(sessionId);
      isNewSession = true;
    }

    const userMessage: Message = {
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
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
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse.message,
        intent: aiResponse.intent,
        isEmergency: aiResponse.intent === 'EMERGENCY',
        availableDoctors: aiResponse.availableDoctors,
        bookingDetails: aiResponse.bookingDetails,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Always refresh session list after each message to keep it current
      await fetchSessions();
    } catch (error: any) {
      toast.error('Assistant reasoning engine failed. Please try again.');
      // Roll back optimistic user message
      setMessages((prev) => prev.filter((m) => m !== userMessage));
      setInput(text);
    } finally {
      setIsLoading(false);
    }
  };

  // Start a completely fresh session (no ID = new session on first message)
  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  const selectSession = (sessionId: string) => {
    if (sessionId === currentSessionId) return;
    setCurrentSessionId(sessionId);
    // Close sidebar on mobile when selecting
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await API.delete(`/chatbot/history?conversationId=${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.conversationId !== sessionId));
      if (currentSessionId === sessionId) startNewChat();
      toast.success('Conversation deleted');
    } catch (err) {
      toast.error('Failed to delete conversation');
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="assistant-container">
      {/* Mobile sidebar toggle when closed */}
      {!isSidebarOpen && (
        <button
          className="assistant-mobile-toggle"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className={`assistant-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        {/* Sidebar header */}
        <div className="sidebar-header">
          <div className="sidebar-header-left">
            <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-indigo-400" />
            <span className="sidebar-title">Conversations</span>
          </div>
          <button
            className="sidebar-close-btn lg-hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* New Chat button — only one, canonical action */}
        <div className="sidebar-new-chat-area">
          <button className="new-chat-btn" onClick={startNewChat} id="new-chat-btn">
            <PlusCircleIcon className="h-5 w-5" />
            New Conversation
          </button>
        </div>

        {/* Session list */}
        <div className="session-list">
          {sessions.length === 0 ? (
            <div className="session-empty">
              <SparklesIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400 italic">No conversations yet.</p>
              <p className="text-[10px] text-gray-300 mt-1">Start chatting to create one.</p>
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = currentSessionId === s.conversationId;
              return (
                <div
                  key={s.conversationId}
                  className={`session-item ${isActive ? 'active' : ''}`}
                  onClick={() => selectSession(s.conversationId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && selectSession(s.conversationId)}
                >
                  <div className={`session-icon ${isActive ? 'active' : ''}`}>
                    <SparklesIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="session-info">
                    <p className="session-title">{s.title || 'Conversation'}</p>
                    <p className="session-date">
                      <ClockIcon className="h-2.5 w-2.5" />
                      {formatDate(s.lastMessageAt)}
                    </p>
                  </div>
                  <button
                    className="session-delete-btn"
                    onClick={(e) => deleteSession(e, s.conversationId)}
                    aria-label="Delete conversation"
                    title="Delete"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── MAIN CHAT AREA ──────────────────────────────────────────────── */}
      <main className="assistant-main">
        {/* Header — no redundant new-chat button here */}
        <header className="chat-header">
          <button
            className="chat-header-menu-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="chat-header-brand">
            <div className="chat-header-icon">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="chat-header-title">Livora AI Assistant</h1>
              <p className="chat-header-status">
                <span className="status-dot" />
                Secure Clinical Intelligence
              </p>
            </div>
          </div>
        </header>

        {/* Messages area */}
        <div className="messages-area">
          {/* Empty state */}
          {messages.length === 0 && !isLoadingHistory && (
            <div className="empty-state">
              <div className="empty-icon-ring">
                <SparklesIcon className="h-10 w-10 text-indigo-400" />
              </div>
              <h2 className="empty-title">How can I help you today?</h2>
              <p className="empty-subtitle">
                Describe your symptoms, ask about doctors, or manage your appointments.
              </p>
              <div className="quick-actions-grid">
                {QUICK_ACTIONS.map((item) => (
                  <button
                    key={item.q}
                    className="quick-action-btn"
                    onClick={() => handleSend(item.q)}
                    disabled={isLoading}
                  >
                    {item.label}
                    <ChevronRightIcon className="h-4 w-4 quick-action-arrow" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading history skeleton */}
          {isLoadingHistory && (
            <div className="history-loading">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`skeleton-row ${i % 2 === 0 ? 'right' : 'left'}`}>
                  <div className="skeleton-bubble" style={{ width: `${40 + i * 15}%` }} />
                </div>
              ))}
            </div>
          )}

          {/* Message list */}
          {!isLoadingHistory &&
            messages.map((m, i) => (
              <div
                key={i}
                className={`message-row ${m.role === 'user' ? 'user' : 'assistant'}`}
              >
                {/* Avatar */}
                {m.role === 'assistant' && (
                  <div className="assistant-avatar">
                    <SparklesIcon className="h-4 w-4 text-indigo-400" />
                  </div>
                )}

                <div className="message-group">
                  {/* Bubble */}
                  <div
                    className={`message-bubble ${
                      m.role === 'user'
                        ? 'user-bubble'
                        : m.isEmergency
                        ? 'emergency-bubble'
                        : 'assistant-bubble'
                    }`}
                  >
                    <p className="message-text">{m.content}</p>

                    {/* Emergency banner */}
                    {m.isEmergency && (
                      <div className="emergency-banner">
                        <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                        IMMEDIATE ACTION: Call 999 or go to the nearest emergency room.
                      </div>
                    )}

                    {/* Doctor cards */}
                    {m.availableDoctors && m.availableDoctors.length > 0 && (
                      <div className="doctor-grid">
                        {m.availableDoctors.map((doc: any) => (
                          <div key={doc.id} className="doctor-card">
                            <div className="doctor-card-avatar">
                              <UserIcon className="h-5 w-5" />
                            </div>
                            <div className="doctor-card-info">
                              <p className="doctor-name">
                                Dr. {doc.doctorName || doc.name}
                              </p>
                              <p className="doctor-meta">
                                {doc.department} · {doc.hospital}
                              </p>
                            </div>
                            <button
                              className="book-now-btn"
                              onClick={() =>
                                navigate(
                                  `/app/appointments?doctorId=${doc.id}&doctorName=${encodeURIComponent(
                                    doc.doctorName || doc.name
                                  )}`
                                )
                              }
                            >
                              Book
                              <ChevronRightIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Booking confirmation */}
                    {m.bookingDetails && (
                      <div className="booking-confirmation">
                        <div className="booking-badge">Confirmed</div>
                        <p className="booking-title">Appointment Requested</p>
                        <p className="booking-detail">
                          With <strong>{m.bookingDetails.doctorName}</strong> on{' '}
                          {m.bookingDetails.date}.
                        </p>
                        {m.bookingDetails.serialNumber && (
                          <p className="booking-serial">
                            Serial #{m.bookingDetails.serialNumber}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className={`message-timestamp ${m.role === 'user' ? 'text-right' : ''}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="message-row assistant">
              <div className="assistant-avatar">
                <SparklesIcon className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="input-area">
          <div className="input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isLoading) handleSend();
              }}
              placeholder="Talk to Livora Assistant..."
              className="chat-input"
              id="assistant-chat-input"
              disabled={isLoading}
              aria-label="Message input"
            />
            <button
              id="assistant-send-btn"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="send-btn"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="input-disclaimer">
            <ClockIcon className="h-3 w-3" />
            Private Clinical Session · HIPAA Compliant
          </p>
        </div>
      </main>

      {/* Styles */}
      <style>{`
        /* ── Layout ───────────────────────────────────────── */
        .assistant-container {
          display: flex;
          height: calc(100vh - 5rem);
          background: #0f1117;
          border-radius: 1.25rem;
          overflow: hidden;
          position: relative;
          box-shadow: 0 25px 60px rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.06);
        }

        /* ── Sidebar ──────────────────────────────────────── */
        .assistant-sidebar {
          width: 19rem;
          background: #13151e;
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease, transform 0.3s ease;
          flex-shrink: 0;
          overflow: hidden;
          z-index: 20;
        }
        .assistant-sidebar.closed {
          width: 0;
          transform: translateX(-100%);
          position: absolute;
          height: 100%;
        }
        .assistant-sidebar.open {
          transform: translateX(0);
        }
        @media (max-width: 1023px) {
          .assistant-sidebar {
            position: absolute;
            height: 100%;
          }
        }
        @media (min-width: 1024px) {
          .assistant-sidebar.closed {
            transform: none;
            width: 0;
          }
        }

        .assistant-mobile-toggle {
          position: absolute;
          top: 1rem;
          left: 1rem;
          z-index: 30;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          color: #c4c9d9;
          border-radius: 0.5rem;
          padding: 0.5rem;
          transition: background 0.2s;
        }
        .assistant-mobile-toggle:hover { background: rgba(255,255,255,0.14); }
        .lg-hidden { display: block; }
        @media (min-width: 1024px) { .lg-hidden { display: none; } }

        /* Sidebar Header */
        .sidebar-header {
          padding: 1.25rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .sidebar-header-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .sidebar-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #9ca3c4;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .sidebar-close-btn {
          color: #6b7280;
          padding: 0.25rem;
          border-radius: 0.375rem;
          transition: color 0.2s, background 0.2s;
        }
        .sidebar-close-btn:hover { color: #e5e7eb; background: rgba(255,255,255,0.07); }

        /* New chat */
        .sidebar-new-chat-area {
          padding: 0.75rem 1rem;
          flex-shrink: 0;
        }
        .new-chat-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.7rem 1rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border-radius: 0.75rem;
          font-weight: 700;
          font-size: 0.875rem;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(99,102,241,0.3);
        }
        .new-chat-btn:hover {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(99,102,241,0.45);
        }
        .new-chat-btn:active { transform: translateY(0); }

        /* Session list */
        .session-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 0.75rem 1rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .session-empty {
          text-align: center;
          padding: 2.5rem 1rem;
        }
        .session-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.675rem 0.75rem;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          border: 1px solid transparent;
          margin-bottom: 0.25rem;
          group: '';
        }
        .session-item:hover { background: rgba(255,255,255,0.05); }
        .session-item.active {
          background: rgba(99,102,241,0.12);
          border-color: rgba(99,102,241,0.3);
        }
        .session-icon {
          width: 2rem;
          height: 2rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.07);
          color: #6b7280;
          flex-shrink: 0;
        }
        .session-icon.active { background: rgba(99,102,241,0.25); color: #818cf8; }
        .session-info { flex: 1; min-width: 0; }
        .session-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #d1d5db;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .session-item.active .session-title { color: #c7d2fe; }
        .session-date {
          font-size: 0.6875rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.125rem;
        }
        .session-delete-btn {
          opacity: 0;
          color: #6b7280;
          padding: 0.25rem;
          border-radius: 0.375rem;
          transition: opacity 0.2s, color 0.2s, background 0.2s;
          flex-shrink: 0;
        }
        .session-item:hover .session-delete-btn { opacity: 1; }
        .session-delete-btn:hover { color: #f87171; background: rgba(248,113,113,0.1); }

        /* ── Main ──────────────────────────────────────────── */
        .assistant-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #0f1117;
          overflow: hidden;
          min-width: 0;
        }

        /* Header */
        .chat-header {
          padding: 1rem 1.25rem;
          background: #13151e;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 0.875rem;
          flex-shrink: 0;
        }
        .chat-header-menu-btn {
          color: #9ca3af;
          padding: 0.375rem;
          border-radius: 0.5rem;
          transition: color 0.2s, background 0.2s;
        }
        .chat-header-menu-btn:hover { color: #e5e7eb; background: rgba(255,255,255,0.07); }
        .chat-header-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .chat-header-icon {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          padding: 0.5rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(99,102,241,0.3);
        }
        .chat-header-title {
          font-size: 1rem;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.02em;
        }
        .chat-header-status {
          font-size: 0.7rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-top: 0.125rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .status-dot {
          width: 0.5rem;
          height: 0.5rem;
          background: #34d399;
          border-radius: 50%;
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }

        /* Messages */
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        /* Empty state */
        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
          gap: 1rem;
        }
        .empty-icon-ring {
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 50%;
          padding: 1.25rem;
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .empty-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.02em;
        }
        .empty-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          max-width: 24rem;
          line-height: 1.6;
        }
        .quick-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.625rem;
          width: 100%;
          max-width: 28rem;
          margin-top: 0.5rem;
        }
        .quick-action-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.875rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #c4c9d9;
          text-align: left;
          transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
        }
        .quick-action-btn:hover:not(:disabled) {
          background: rgba(99,102,241,0.1);
          border-color: rgba(99,102,241,0.3);
          color: #c7d2fe;
          transform: translateY(-1px);
        }
        .quick-action-btn:disabled { opacity: 0.5; }
        .quick-action-arrow {
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
        }
        .quick-action-btn:hover .quick-action-arrow {
          opacity: 1;
          transform: translateX(3px);
        }

        /* Loading skeleton */
        .history-loading { display: flex; flex-direction: column; gap: 1rem; }
        .skeleton-row { display: flex; }
        .skeleton-row.right { justify-content: flex-end; }
        .skeleton-row.left { justify-content: flex-start; }
        .skeleton-bubble {
          height: 3rem;
          background: rgba(255,255,255,0.06);
          border-radius: 1rem;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }

        /* Message rows */
        .message-row {
          display: flex;
          align-items: flex-end;
          gap: 0.625rem;
          animation: msg-in 0.25s ease;
        }
        .message-row.user { flex-direction: row-reverse; }
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .message-group { display: flex; flex-direction: column; max-width: 78%; }
        .message-row.user .message-group { align-items: flex-end; }
        .message-row.assistant .message-group { align-items: flex-start; }

        .assistant-avatar {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-bottom: 0.25rem;
        }

        /* Bubbles */
        .message-bubble {
          padding: 0.875rem 1.125rem;
          border-radius: 1.25rem;
          max-width: 100%;
        }
        .user-bubble {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border-bottom-right-radius: 0.25rem;
          box-shadow: 0 4px 20px rgba(99,102,241,0.3);
        }
        .assistant-bubble {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #e2e8f0;
          border-bottom-left-radius: 0.25rem;
        }
        .emergency-bubble {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          border-bottom-left-radius: 0.25rem;
        }
        .message-text {
          font-size: 0.9375rem;
          line-height: 1.65;
          white-space: pre-wrap;
          font-weight: 450;
        }
        .message-timestamp {
          font-size: 0.6875rem;
          color: #4b5563;
          margin-top: 0.25rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* Emergency banner */
        .emergency-banner {
          margin-top: 0.75rem;
          background: #ef4444;
          color: white;
          border-radius: 0.625rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.8125rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: pulse-bg 2s infinite;
        }
        @keyframes pulse-bg {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }

        /* Doctor cards */
        .doctor-grid {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .doctor-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 0.875rem;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: background 0.2s, border-color 0.2s;
        }
        .doctor-card:hover { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.4); }
        .doctor-card-avatar {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.625rem;
          background: rgba(99,102,241,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #818cf8;
          flex-shrink: 0;
        }
        .doctor-card-info { flex: 1; min-width: 0; }
        .doctor-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #c7d2fe;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .doctor-meta {
          font-size: 0.7rem;
          color: #818cf8;
          margin-top: 0.125rem;
        }
        .book-now-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          white-space: nowrap;
          box-shadow: 0 2px 10px rgba(99,102,241,0.35);
        }
        .book-now-btn:hover { opacity: 0.9; transform: scale(1.04); }
        .book-now-btn:active { transform: scale(0.97); }

        /* Booking confirmation */
        .booking-confirmation {
          margin-top: 0.875rem;
          background: rgba(52,211,153,0.08);
          border: 1px solid rgba(52,211,153,0.25);
          border-radius: 0.875rem;
          padding: 0.875rem 1rem;
          position: relative;
        }
        .booking-badge {
          display: inline-block;
          background: #34d399;
          color: #064e3b;
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.175rem 0.5rem;
          border-radius: 999px;
          margin-bottom: 0.375rem;
        }
        .booking-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #6ee7b7;
        }
        .booking-detail {
          font-size: 0.75rem;
          color: #a7f3d0;
          margin-top: 0.25rem;
          line-height: 1.5;
        }
        .booking-serial {
          font-size: 0.6875rem;
          color: #6ee7b7;
          margin-top: 0.25rem;
          font-weight: 600;
        }

        /* Typing indicator */
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.875rem 1.125rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 1.25rem;
          border-bottom-left-radius: 0.25rem;
        }
        .typing-indicator span {
          width: 0.5rem;
          height: 0.5rem;
          background: #6366f1;
          border-radius: 50%;
          animation: bounce-dot 1.2s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce-dot {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-5px); opacity: 1; }
        }

        /* Input area */
        .input-area {
          padding: 1rem 1.25rem;
          background: #13151e;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 1rem;
          padding: 0.375rem 0.375rem 0.375rem 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-wrapper:focus-within {
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #f1f5f9;
          font-size: 0.9375rem;
          font-weight: 450;
          padding: 0.5rem 0;
        }
        .chat-input::placeholder { color: #4b5563; font-weight: 500; }
        .chat-input:disabled { opacity: 0.6; }
        .send-btn {
          width: 2.75rem;
          height: 2.75rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(99,102,241,0.4);
        }
        .send-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: scale(1.06);
          box-shadow: 0 6px 20px rgba(99,102,241,0.5);
        }
        .send-btn:active:not(:disabled) { transform: scale(0.95); }
        .send-btn:disabled { opacity: 0.35; box-shadow: none; }
        .input-disclaimer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          font-size: 0.6875rem;
          color: #374151;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-top: 0.625rem;
        }
      `}</style>
    </div>
  );
};

export default Assistant;
