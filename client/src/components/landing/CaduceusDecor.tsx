import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

/**
 * Caduceus Animation Component
 * Renders the central staff and serpents that animate on scroll
 * Optimized with static majestic wings and symmetrical design
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
    <div ref={containerRef} className="w-full h-full flex justify-center pointer-events-none overflow-visible">
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

        {/* --- MAJESTIC WIDE WINGS (STATIC) --- */}
        <g filter="url(#glow)">
          {/* Left Wing - Large Span */}
          <path 
            d="M 200 40 
               L 180 20 
               C 120 -20, 20 0, 10 60 
               C -5 100, 50 120, 100 110 
               C 130 105, 170 90, 200 70" 
            fill="url(#rodGradient)" 
            fillOpacity="0.08"
            stroke="url(#rodGradient)" 
            strokeWidth="3" 
            strokeOpacity="0.6"
          />
          {/* Feather details - LEFT */}
<g stroke="url(#rodGradient)" fill="none">
  <path d="M 70 50 Q 120 65 165 70" strokeWidth="1.5" strokeOpacity="0.35" />
  <path d="M 55 70 Q 115 85 155 88" strokeWidth="1.3" strokeOpacity="0.3" />
  <path d="M 60 90 Q 110 105 145 105" strokeWidth="1.1" strokeOpacity="0.25" />
</g>
          {/* Right Wing - Large Span */}
          <path 
            d="M 200 40 
               L 220 20 
               C 280 -20, 380 0, 390 60 
               C 405 100, 350 120, 300 110 
               C 270 105, 230 90, 200 70" 
            fill="url(#rodGradient)" 
            fillOpacity="0.08"
            stroke="url(#rodGradient)" 
            strokeWidth="3" 
            strokeOpacity="0.6"
          />
          {/* Feather details - RIGHT */}
<g stroke="url(#rodGradient)" fill="none">
  <path d="M 330 50 Q 280 65 235 70" strokeWidth="1.5" strokeOpacity="0.35" />
  <path d="M 345 70 Q 285 85 245 88" strokeWidth="1.3" strokeOpacity="0.3" />
  <path d="M 340 90 Q 290 105 255 105" strokeWidth="1.1" strokeOpacity="0.25" />
</g>
</g>

        {/* --- THE STAFF (ROD) --- */}
        <line x1="200" y1="0" x2="200" y2="1000" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 4" strokeOpacity="0.4" />
        
        <motion.line 
          x1="200" y1="0" x2="200" y2="1000" 
          stroke="url(#rodGradient)" 
          strokeWidth="6" 
          filter="url(#glow)"
          style={{ pathLength }}
        />

        {/* --- SERPENTS --- */}
        <motion.path 
          d={serpent1} 
          fill="none" 
          stroke="#4f46e5" 
          strokeWidth="3.5" 
          style={{ pathLength }}
          filter="url(#glow)"
        />
        <motion.path 
          d={serpent2} 
          fill="none" 
          stroke="#ff3b3b" 
          strokeWidth="3.5" 
          style={{ pathLength }}
          filter="url(#glow)"
        />

        {/* Traveling Pulse */}
        <motion.circle 
          cx="200" 
          cy="0" 
          r="12" 
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
 * Empty component as HeartbeatLine is removed from main page but kept here for potential reuse
 */
export const HeartbeatLine: React.FC = () => {
  return null;
};
