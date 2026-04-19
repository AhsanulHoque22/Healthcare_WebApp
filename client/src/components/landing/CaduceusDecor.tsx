import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

/**
 * Caduceus Animation Component
 * Renders the central staff and serpents that animate on scroll
 */
export const CaduceusStaff: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const pathLength = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  
  // Serpent paths (sine waves)
  const serpent1 = "M 50 0 Q 80 100 50 200 Q 20 300 50 400 Q 80 500 50 600 Q 20 700 50 800 Q 80 900 50 1000";
  const serpent2 = "M 50 0 Q 20 100 50 200 Q 80 300 50 400 Q 20 500 50 600 Q 80 700 50 800 Q 20 900 50 1000";

  return (
    <div ref={containerRef} className="absolute inset-0 flex justify-center pointer-events-none z-0">
      <svg width="100" height="100%" viewBox="0 0 100 1000" preserveAspectRatio="none" className="h-full overflow-visible">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="rodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff3b3b" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        {/* Wings atop the Staff */}
        <motion.path 
          d="M 50 20 C 30 0 10 20 10 40 C 10 60 30 50 50 50 C 70 50 90 60 90 40 C 90 20 70 0 50 20" 
          fill="none" 
          stroke="url(#rodGradient)" 
          strokeWidth="2" 
          filter="url(#glow)"
          style={{ pathLength }}
        />

        {/* The Staff (Rod) */}
        <line x1="50" y1="0" x2="50" y2="1000" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 4" />
        <motion.line 
          x1="50" y1="0" x2="50" y2="1000" 
          stroke="url(#rodGradient)" 
          strokeWidth="4" 
          filter="url(#glow)"
          style={{ pathLength }}
        />

        {/* Serpents */}
        <motion.path 
          d={serpent1} 
          fill="none" 
          stroke="#6366f1" 
          strokeWidth="1.5" 
          strokeOpacity="0.3" 
          strokeDasharray="10 5"
        />
        <motion.path 
          d={serpent2} 
          fill="none" 
          stroke="#ff3b3b" 
          strokeWidth="1.5" 
          strokeOpacity="0.3" 
          strokeDasharray="10 5"
        />
        
        {/* Animated Glow Serpents */}
        <motion.path 
          d={serpent1} 
          fill="none" 
          stroke="#6366f1" 
          strokeWidth="2.5" 
          style={{ pathLength }}
          filter="url(#glow)"
        />
        <motion.path 
          d={serpent2} 
          fill="none" 
          stroke="#ff3b3b" 
          strokeWidth="2.5" 
          style={{ pathLength }}
          filter="url(#glow)"
        />

        {/* Traveling Pulse */}
        <motion.circle 
          cx="50" 
          cy="0" 
          r="8" 
          fill="#ff3b3b" 
          filter="url(#glow)"
          style={{ 
            offsetPath: `path("M 50 0 L 50 1000")`,
            offsetDistance: useTransform(pathLength, [0, 1], ["0%", "100%"])
          }}
        />
      </svg>
    </div>
  );
};

/**
 * Heartbeat background animation
 */
export const HeartbeatLine: React.FC = () => {
  return (
    <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
      <svg width="200%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="none" className="h-full w-[200%] animate-[slide-left_20s_linear_infinite]">
        <path 
          d="M 0 50 L 100 50 L 110 40 L 120 70 L 130 20 L 140 80 L 150 50 L 160 50 L 250 50" 
          fill="none" 
          stroke="#ef4444" 
          strokeWidth="1" 
          vectorEffect="non-scaling-stroke"
        />
        {/* Loop the path */}
        <path 
          d="M 250 50 L 350 50 L 360 40 L 370 70 L 380 20 L 390 80 L 400 50 L 410 50 L 500 50" 
          fill="none" 
          stroke="#ef4444" 
          strokeWidth="1" 
          vectorEffect="non-scaling-stroke"
        />
        <path 
          d="M 500 50 L 600 50 L 610 40 L 620 70 L 630 20 L 640 80 L 650 50 L 660 50 L 750 50" 
          fill="none" 
          stroke="#ef4444" 
          strokeWidth="1" 
          vectorEffect="non-scaling-stroke"
        />
        <path 
          d="M 750 50 L 850 50 L 860 40 L 870 70 L 880 20 L 890 80 L 900 50 L 910 50 L 1000 50" 
          fill="none" 
          stroke="#ef4444" 
          strokeWidth="1" 
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};
