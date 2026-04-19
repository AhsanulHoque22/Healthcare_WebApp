import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

/**
 * Caduceus Animation Component
 * Renders the central staff and serpents that animate on scroll
 * Redesigned for light background and larger, more majestic wings
 */
export const CaduceusStaff: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const pathLength = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  
  // Serpent paths (sine waves) - Scaled for viewBox 400x1000
  const serpent1 = "M 200 0 Q 320 100 200 200 Q 80 300 200 400 Q 320 500 200 600 Q 80 700 200 800 Q 320 900 200 1000";
  const serpent2 = "M 200 0 Q 80 100 200 200 Q 320 300 200 400 Q 80 500 200 600 Q 320 700 200 800 Q 80 900 200 1000";

  return (
    <div ref={containerRef} className="absolute inset-0 flex justify-center pointer-events-none z-0">
      <svg width="400" height="100%" viewBox="0 0 400 1000" preserveAspectRatio="none" className="h-full overflow-visible">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="rodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff3b3b" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>

        {/* Majestic Wings atop the Staff - Much larger now */}
        <motion.path 
          d="M 200 40 
             C 120 -20, 0 20, 0 80 
             C 0 130, 80 110, 200 110 
             C 320 110, 400 130, 400 80 
             C 400 20, 280 -20, 200 40 Z" 
          fill="url(#rodGradient)" 
          fillOpacity="0.05"
          stroke="url(#rodGradient)" 
          strokeWidth="3" 
          filter="url(#glow)"
          style={{ pathLength }}
        />
        
        {/* Inner wing details */}
        <motion.path 
           d="M 60 70 Q 130 80 200 80 M 340 70 Q 270 80 200 80"
           fill="none"
           stroke="url(#rodGradient)"
           strokeWidth="1.5"
           strokeOpacity="0.3"
           style={{ pathLength }}
        />

        {/* The Staff (Rod) - Guide Line */}
        <line x1="200" y1="0" x2="200" y2="1000" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 4" />
        
        {/* The Staff (Rod) - Animated Glow */}
        <motion.line 
          x1="200" y1="0" x2="200" y2="1000" 
          stroke="url(#rodGradient)" 
          strokeWidth="5" 
          filter="url(#glow)"
          style={{ pathLength }}
        />

        {/* Gray Background Serpents */}
        <motion.path 
          d={serpent1} 
          fill="none" 
          stroke="#4f46e5" 
          strokeWidth="2" 
          strokeOpacity="0.1" 
          strokeDasharray="12 6"
        />
        <motion.path 
          d={serpent2} 
          fill="none" 
          stroke="#ff3b3b" 
          strokeWidth="2" 
          strokeOpacity="0.1" 
          strokeDasharray="12 6"
        />
        
        {/* Animated Glow Serpents */}
        <motion.path 
          d={serpent1} 
          fill="none" 
          stroke="#4f46e5" 
          strokeWidth="3" 
          style={{ pathLength }}
          filter="url(#glow)"
        />
        <motion.path 
          d={serpent2} 
          fill="none" 
          stroke="#ff3b3b" 
          strokeWidth="3" 
          style={{ pathLength }}
          filter="url(#glow)"
        />

        {/* Traveling Pulse */}
        <motion.circle 
          cx="200" 
          cy="0" 
          r="10" 
          fill="#ff3b3b" 
          filter="url(#glow)"
          style={{ 
            offsetPath: `path("M 200 0 L 200 1000")`,
            offsetDistance: useTransform(pathLength, [0, 1], ["0%", "100%"])
          }}
        />
      </svg>
    </div>
  );
};

/**
 * Heartbeat background animation - Darker for light background visibility
 */
export const HeartbeatLine: React.FC = () => {
  return (
    <div className="absolute inset-0 opacity-[0.15] pointer-events-none overflow-hidden">
      <svg width="200%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="none" className="h-full w-[200%] animate-[slide-left_25s_linear_infinite]">
        <path 
          d="M 0 50 L 100 50 L 110 40 L 120 70 L 130 20 L 140 80 L 150 50 L 160 50 L 250 50" 
          fill="none" 
          stroke="#ef4444" 
          strokeWidth="1.5" 
          vectorEffect="non-scaling-stroke"
        />
        <path 
          d="M 250 50 L 350 50 L 360 40 L 370 70 L 380 20 L 390 80 L 400 50 L 410 50 L 500 50" 
          fill="none" 
          stroke="#ef4444" 
          strokeWidth="1.5" 
          vectorEffect="non-scaling-stroke"
        />
        <path 
          d="M 500 50 L 600 50 L 610 40 L 620 70 L 630 20 L 640 80 L 650 50 L 660 50 L 750 50" 
          fill="none" 
          stroke="#ef4444" 
          strokeWidth="1.5" 
          vectorEffect="non-scaling-stroke"
        />
        <path 
          d="M 750 50 L 850 50 L 860 40 L 870 70 L 880 20 L 890 80 L 900 50 L 910 50 L 1000 50" 
          fill="none" 
          stroke="#ef4444" 
          strokeWidth="1.5" 
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};
