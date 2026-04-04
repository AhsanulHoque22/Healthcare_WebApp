import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
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

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    socketRef.current = io(socketUrl);

    socketRef.current.on('transcript-result', (data: { transcript: string; isFinal: boolean }) => {
      if (data.isFinal) {
        setTranscript(prev => prev + ' ' + data.transcript);
        setInterimTranscript('');
        onTranscriptionUpdate(data.transcript, true);
      } else {
        setInterimTranscript(data.transcript);
        onTranscriptionUpdate(data.transcript, false);
      }
    });

    socketRef.current.on('transcription-error', (error: string) => {
      toast.error(`Transcription Error: ${error}`);
      stopRecording();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const supportedMimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4'];
      const mimeType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });
      mediaRecorderRef.current = mediaRecorder;

      if (socketRef.current) {
        socketRef.current.emit('start-transcription', { language });
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current) {
          socketRef.current.emit('audio-chunk', event.data);
        }
      };

      mediaRecorder.start(250); // Send chunks every 250ms
      setIsRecording(true);
      toast.success('Listening...');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (socketRef.current) {
      socketRef.current.emit('stop-transcription');
    }
    setIsRecording(false);
    setInterimTranscript('');
  };

  const handleExtract = () => {
    if (transcript.trim()) {
      onExtractionRequest(transcript);
    } else {
      toast.error('No transcript to process');
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  return (
    <div className="bg-emerald-50/30 rounded-2xl border border-emerald-100 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'}`}>
            <MicrophoneIcon className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Voice Assistant</h4>
            <p className="text-xs text-gray-500">Dictate prescription details naturally</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as 'en' | 'bn')}
            className="text-xs border-emerald-200 rounded-lg bg-white focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="en">English (Medical)</option>
            <option value="bn">Bengali</option>
          </select>

          {isRecording ? (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm"
            >
              <StopIcon className="h-4 w-4" />
              Stop
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm"
            >
              <MicrophoneIcon className="h-4 w-4" />
              Start Listening
            </button>
          )}
        </div>
      </div>

      <div className="relative bg-white rounded-xl border border-emerald-100 p-4 min-h-[100px] max-h-[200px] overflow-y-auto">
        {transcript || interimTranscript ? (
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {transcript}
            <span className="text-emerald-500 font-medium italic">{interimTranscript}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <SparklesIcon className="h-8 w-8 opacity-20" />
            <p className="text-sm">Click "Start Listening" and speak naturally...</p>
            <p className="text-[10px]">Example: "Patient has dry cough and mild fever. Suggest Paracetamol 500mg three times a day for 5 days."</p>
          </div>
        )}
        
        {(transcript || interimTranscript) && (
          <button 
            onClick={clearTranscript}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex justify-end mt-4 gap-3">
        <button
          onClick={handleExtract}
          disabled={!transcript || isProcessing}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
            !transcript || isProcessing 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg active:scale-95'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4" />
              Auto-Fill Prescription
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoicePrescriptionAssistant;
