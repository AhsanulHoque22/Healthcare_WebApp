import React, { useState, useEffect } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, VideoCameraIcon, UserIcon } from '@heroicons/react/24/outline';

interface VideoConsultationProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
  doctorName: string;
  patientName: string;
  userEmail: string;
  userRole: 'doctor' | 'patient';
}

const VideoConsultation: React.FC<VideoConsultationProps> = ({
  isOpen,
  onClose,
  appointmentId,
  doctorName,
  patientName,
  userEmail,
  userRole
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Generate consistent room name for both doctor and patient
  const roomName = `HealthcareApp${appointmentId}`;

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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 226, 0.3) 0%, transparent 50%),
            #0a0a1a
          `
        }}
      >
        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          exit={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 300,
            duration: 0.6
          }}
          className="relative bg-white/10 backdrop-blur-xl border border-white/[0.08] rounded-[32px] shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Premium Header */}
          <div className="relative p-8 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-xl border-b border-white/[0.08]">
            {/* Background mesh gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-cyan-500/10 rounded-t-[32px]" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20"
                >
                  <VideoCameraIcon className="h-7 w-7 text-white" />
                </motion.div>

                <div>
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent"
                  >
                    Video Consultation
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-slate-300 text-sm font-medium"
                  >
                    Secure healthcare communication platform
                  </motion.p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="hidden md:flex items-center gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-2xl px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                    <span className="text-sm font-bold text-emerald-300 uppercase tracking-wider">Live Session</span>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={onClose}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center text-white hover:text-red-300 transition-all duration-300 shadow-lg hover:shadow-red-500/20"
                >
                  <XMarkIcon className="h-6 w-6" />
                </motion.button>
              </div>
            </div>

            {/* Participant Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-6 flex items-center gap-4"
            >
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                <UserIcon className="h-5 w-5 text-indigo-400" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {userRole === 'doctor' ? 'Patient' : 'Doctor'}
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {userRole === 'doctor' ? patientName : doctorName}
                  </p>
                </div>
              </div>

              <div className="w-px h-8 bg-white/20" />

              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-xs font-bold text-white">ID</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Appointment</p>
                  <p className="text-sm font-semibold text-white">#{appointmentId}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Video Container */}
          <div className="flex-1 relative bg-slate-900/50">
            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm"
                >
                  <div className="text-center max-w-md mx-auto p-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full mx-auto mb-8"
                    />

                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-xl font-bold text-white mb-4"
                    >
                      {userRole === 'doctor' ? 'Initializing Consultation' : 'Joining Consultation'}
                    </motion.h3>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-slate-300 mb-6"
                    >
                      Establishing secure video connection...
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-left"
                    >
                      <h4 className="text-sm font-bold text-indigo-300 mb-3 uppercase tracking-wider">Connection Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-slate-300">Secure room created</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-slate-300">Video interface loading</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                          <span className="text-xs text-slate-400">Waiting for participant</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full"
              >
                <JitsiMeeting
                  domain="meet.jit.si"
                  roomName={roomName}
                  configOverwrite={{
                    startWithAudioMuted: false,
                    disableModeratorIndicator: true,
                    prejoinPageEnabled: false,
                    requireDisplayName: false,
                    enableLobby: false,
                    enableWelcomePage: false,
                    enableClosePage: false,
                    startScreenSharing: false,
                    enableEmailInStats: false
                  }}
                  interfaceConfigOverwrite={{
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    SHOW_JITSI_WATERMARK: false,
                    HIDE_DEEP_LINKING_LOGO: true,
                    MOBILE_APP_PROMO: false
                  }}
                  userInfo={{
                    displayName: userRole === 'doctor' ? `Dr. ${doctorName}` : patientName,
                    email: userEmail
                  }}
                  onApiReady={(externalApi) => {
                    console.log('Jitsi Meet API is ready');
                  }}
                  getIFrameRef={(iframeRef: any) => {
                    iframeRef.style.height = '100%';
                    iframeRef.style.width = '100%';
                    iframeRef.style.borderRadius = '0';
                  }}
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoConsultation;
