import React, { useEffect, useRef, useState } from 'react';

interface VideoConsultationProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
  doctorName: string;
  patientName: string;
  userRole: 'doctor' | 'patient';
}

const VideoConsultation: React.FC<VideoConsultationProps> = ({
  isOpen,
  onClose,
  appointmentId,
  doctorName,
  patientName,
  userRole
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Generate consistent room name for both doctor and patient
  const roomName = `HealthcareApp${appointmentId}`;
  
  // Create the Jitsi Meet URL with parameters to bypass authentication
  const jitsiUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.requireDisplayName=false&config.enableLobby=false&config.enableWelcomePage=false&config.enableClosePage=false&userInfo.displayName=${encodeURIComponent(userRole === 'doctor' ? `Dr. ${doctorName}` : patientName)}`;

  useEffect(() => {
    if (isOpen) {
      // Simulate loading time
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-black rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Minimal Header */}
        <div className="flex items-center justify-between p-4 bg-gray-900 text-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-lg font-semibold">Healthcare Video Consultation</h3>
              <p className="text-sm text-gray-300">
                {userRole === 'doctor' ? `Patient: ${patientName}` : `Doctor: ${doctorName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video Container - Full Height */}
        <div className="flex-1 relative bg-gray-900">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white max-w-md mx-auto p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-6"></div>
                <p className="text-xl font-semibold mb-4">
                  {userRole === 'doctor' 
                    ? 'Starting Video Consultation' 
                    : 'Joining Video Consultation'
                  }
                </p>
                <p className="text-gray-300 mb-6">
                  Loading secure video interface...
                </p>
                <div className="bg-gray-800 rounded-lg p-4 text-left">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">Ready to Connect:</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• No authentication required</li>
                    <li>• Direct room access</li>
                    <li>• Both participants join the same room</li>
                    <li>• Full video/audio controls available</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {!isLoading && (
            <iframe
              src={jitsiUrl}
              className="w-full h-full border-0"
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              title="Video Consultation"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoConsultation;
