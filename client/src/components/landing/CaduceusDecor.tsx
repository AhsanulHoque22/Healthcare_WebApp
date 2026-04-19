import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

/**
 * Caduceus Animation Component
 * Renders the central staff and serpents that animate on scroll
 * Optimized with static majestic wings and symmetrical feathered design
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

        {/* --- MAJESTIC WIDE FEATHERED WINGS (STATIC) --- */}
        <g filter="url(#glow)">
          {/* LEFT WING - Redesigned with individual layered feathers */}
          <g fill="url(#rodGradient)" fillOpacity="0.05" stroke="url(#rodGradient)" strokeWidth="2.5" strokeOpacity="0.6">
            {/* Main Top Arc */}
            <path d="M 200 60 C 180 40, 120 20, 20 60 C -10 75, 40 100, 70 120" />
            {/* Feather Layer 1 (Top) */}
            <path d="M 50 65 Q 125 90 200 90" strokeWidth="1.5" strokeOpacity="0.3" />
            {/* Feather Layer 2 */}
            <path d="M 40 90 Q 120 110 200 110" strokeWidth="1.5" strokeOpacity="0.3" />
            {/* Feather 3 (Middle) */}
            <path d="M 60 120 Q 130 130 200 130" strokeWidth="1.5" strokeOpacity="0.3" />
            {/* Bottom Scalloped Edge */}
            <path d="M 70 120 Q 100 150 130 145 Q 165 140 200 120" fillOpacity="0.03" />
          </g>

          {/* RIGHT WING - Symmetrical feathered design */}
          <g fill="url(#rodGradient)" fillOpacity="0.05" stroke="url(#rodGradient)" strokeWidth="2.5" strokeOpacity="0.6">
            {/* Main Top Arc */}
            <path d="M 200 60 C 220 40, 280 20, 380 60 C 410 75, 360 100, 330 120" />
            {/* Feather Layer 1 (Top) */}
            <path d="M 350 65 Q 275 90 200 90" strokeWidth="1.5" strokeOpacity="0.3" />
            {/* Feather Layer 2 */}
            <path d="M 360 90 Q 280 110 200 110" strokeWidth="1.5" strokeOpacity="0.3" />
            {/* Feather 3 (Middle) */}
            <path d="M 340 120 Q 270 130 200 130" strokeWidth="1.5" strokeOpacity="0.3" />
            {/* Bottom Scalloped Edge */}
            <path d="M 330 120 Q 300 150 270 145 Q 235 140 200 120" fillOpacity="0.03" />
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

export const HeartbeatLine: React.FC = () => null;
