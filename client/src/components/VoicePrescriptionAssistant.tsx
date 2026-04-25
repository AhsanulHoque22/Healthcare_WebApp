import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MicrophoneIcon,
  StopIcon,
  SpeakerWaveIcon,
  GlobeAltIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface VoicePrescriptionAssistantProps {
  onTranscriptionUpdate: (transcript: string, isFinal: boolean) => void;
  onExtractionRequest: (fullTranscript: string) => void;
  isProcessing: boolean;
}

const VoicePrescriptionAssistant: React.FC<VoicePrescriptionAssistantProps> = ({
  onTranscriptionUpdate,
  onExtractionRequest,
  isProcessing
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [socketStatus, setSocketStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    // Initialize socket connection
    const env = process.env as any;
    const socketUrl = env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    console.log('[VOICE] Connecting to socket at:', socketUrl);

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[VOICE] Socket connected successfully');
      setSocketStatus('connected');
    });

    socket.on('disconnect', () => {
      setSocketStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('[VOICE] Socket connection error:', error);
      setSocketStatus('disconnected');
    });

    socket.on('transcript-result', (data: { transcript: string; isFinal: boolean }) => {
      if (data.isFinal) {
        setTranscript(prev => (prev + ' ' + data.transcript).trim());
        setInterimTranscript('');
        onTranscriptionUpdate(data.transcript, true);
      } else {
        setInterimTranscript(data.transcript);
        onTranscriptionUpdate(data.transcript, false);
      }
    });

    socket.on('transcription-error', (error: string) => {
      console.error('[VOICE] Transcription error:', error);
      toast.error(`Transcription Error: ${error}`);
      stopRecording();
    });

    return () => {
      socket.disconnect();
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    if (socketStatus !== 'connected' || !socketRef.current) {
      console.warn('[VOICE] No socket connection!', { socketStatus, hasRef: !!socketRef.current });
      toast.error('Voice service is not connected. Reconnecting...');
      return;
    }

    try {
      console.log('[VOICE] Attempting to start recorder. Socket ID:', socketRef.current.id);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      console.log('[VOICE] Using mimeType:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      console.log('[VOICE] Emitting start-transcription...');
      socketRef.current.emit('start-transcription', { language });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          if (socketRef.current?.connected) {
            const buffer = await event.data.arrayBuffer();
            socketRef.current.emit('audio-chunk', buffer);
          } else {
            console.warn('[VOICE] Socket disconnected during data capture');
          }
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      toast.success('Listening...');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current?.connected) {
        socketRef.current.emit('stop-transcription');
      }
    } catch (e) {
      console.warn('Cleanup error:', e);
    } finally {
      setIsRecording(false);
      setInterimTranscript('');
      mediaRecorderRef.current = null;
      streamRef.current = null;
    }
  };

  const handleExtract = () => {
    if (transcript.trim()) {
      onExtractionRequest(transcript);
    } else {
      toast.error('No transcript available to process');
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-cyan-50/80 backdrop-blur-xl rounded-[28px] border border-emerald-100/50 p-6 mb-6 shadow-xl shadow-emerald-500/5"
      style={{
        background: `
          radial-gradient(circle at 30% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, rgba(20, 184, 166, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, rgba(236, 253, 245, 0.9) 0%, rgba(240, 253, 250, 0.8) 100%)
        `
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4"
        >
          <motion.div
            animate={isRecording ? {
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 0 0 rgba(16, 185, 129, 0.4)',
                '0 0 0 10px rgba(16, 185, 129, 0)',
                '0 0 0 0 rgba(16, 185, 129, 0)'
              ]
            } : {}}
            transition={{ duration: 2, repeat: isRecording ? Infinity : 0 }}
            className={`relative p-3 rounded-2xl transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 text-white shadow-2xl shadow-red-500/30'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/20'
            }`}
          >
            <MicrophoneIcon className="h-6 w-6" />
            {isRecording && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full border-2 border-white"
              />
            )}
          </motion.div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3"
            >
              <h4 className="font-bold text-gray-900 text-lg">Voice Assistant</h4>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                className={`w-3 h-3 rounded-full shadow-lg ${
                  socketStatus === 'connected'
                    ? 'bg-emerald-500 shadow-emerald-500/50'
                    : 'bg-red-500 shadow-red-500/50'
                } ${socketStatus === 'connecting' ? 'animate-pulse' : ''}`}
              />
              <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{socketStatus}</span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-gray-600 font-medium"
            >
              Dictate and edit before auto-filling
            </motion.p>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3"
        >
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'bn')}
            className="text-sm border border-emerald-200/60 rounded-xl bg-white/80 backdrop-blur-sm px-3 py-2 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all shadow-sm"
          >
            <option value="en">🇺🇸 English</option>
            <option value="bn">🇧🇩 Bengali</option>
          </select>

          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.button
                key="stop"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: 'spring', stiffness: 200 }}
                onClick={stopRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl hover:shadow-red-500/30"
              >
                <StopIcon className="h-4 w-4" />
                Stop
              </motion.button>
            ) : (
              <motion.button
                key="start"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: 'spring', stiffness: 200 }}
                onClick={startRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl hover:shadow-emerald-500/30"
              >
                <MicrophoneIcon className="h-4 w-4" />
                Start Listening
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Transcript Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative"
      >
        <textarea
          value={transcript + (interimTranscript ? ' ' + interimTranscript : '')}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder='Click "Start Listening" and speak naturally...'
          className="w-full bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100/60 p-6 min-h-[120px] max-h-[300px] text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 outline-none transition-all shadow-lg resize-none"
          disabled={isRecording}
        />

        {!transcript && !interimTranscript && !isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400 gap-3"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <SparklesIcon className="h-8 w-8 opacity-30" />
            </motion.div>
            <p className="text-sm font-medium">Example: "Patient has dry cough and mild fever..."</p>
          </motion.div>
        )}

        {(transcript || interimTranscript) && !isRecording && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={clearTranscript}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/40"
          >
            <XMarkIcon className="h-4 w-4" />
          </motion.button>
        )}
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex justify-between items-center mt-6"
      >
        <motion.span
          animate={isRecording ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
          transition={{ duration: 1.5, repeat: isRecording ? Infinity : 0 }}
          className="text-sm text-emerald-700 font-bold italic"
        >
          {isRecording ? "🎤 Live transcribing... speak clearly" : transcript ? "✓ You can edit the text above before auto-filling" : ""}
        </motion.span>

        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
          onClick={handleExtract}
          disabled={!transcript || isProcessing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold transition-all shadow-xl ${
            !transcript || isProcessing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-gray-200/50'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white hover:shadow-emerald-500/40 active:scale-95'
          }`}
        >
          {isProcessing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              Processing...
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              Auto-Fill Prescription
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default VoicePrescriptionAssistant;
