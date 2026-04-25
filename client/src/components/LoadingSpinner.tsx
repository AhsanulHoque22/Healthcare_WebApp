import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Synchronizing Systems...', size = 'md' }) => {
  const sizeConfig = {
    sm: { container: 'h-auto py-2', outer: 'h-6 w-6', inner: 'h-3 w-3', text: 'text-[8px]' },
    md: { container: 'min-h-[400px]', outer: 'h-20 w-20', inner: 'h-10 w-10', text: 'text-[10px]' },
    lg: { container: 'min-h-[600px]', outer: 'h-32 w-32', inner: 'h-16 w-16', text: 'text-xs' },
  };

  const config = sizeConfig[size];

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
               className="h-5 w-5 rounded-full border-2 border-slate-100 border-t-indigo-500"
            />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{message}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-12 ${config.container}`}>
      <div className="relative flex items-center justify-center">
        {/* Ambient Glow */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute ${config.outer} bg-indigo-500 rounded-full blur-[40px]`}
        />

        {/* Outer Orbit */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className={`${config.outer} rounded-full border-[0.5px] border-slate-200 border-t-indigo-500 border-r-indigo-500/20 shadow-inner`}
        />

        {/* Inner Counter-Orbit */}
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className={`absolute ${config.inner} rounded-full border-[0.5px] border-slate-100 border-b-violet-500 border-l-violet-500/20`}
        />

        {/* Core Pulse */}
        <motion.div 
          animate={{ scale: [0.8, 1, 0.8], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute h-2 w-2 bg-slate-900 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)]"
        />
      </div>

      <div className="text-center space-y-3">
        <motion.p 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`${config.text} font-black text-slate-400 uppercase tracking-[0.3em] ml-[0.3em]`}
        >
          {message}
        </motion.p>
        <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
                <motion.div 
                    key={i}
                    animate={{ scaleY: [1, 2, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-[2px] h-3 bg-indigo-500 rounded-full"
                />
            ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
