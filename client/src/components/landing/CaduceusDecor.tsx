import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

/**
 * Caduceus Animation Component — Premium redesign
 * Central staff with animated serpents that draw on scroll
 */
export const CaduceusStaff: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const pathLength = useSpring(scrollYProgress, { stiffness: 80, damping: 30, restDelta: 0.001 });
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.2, 0.8, 0.4]);
  
  const serpent1 = "M 200 0 Q 320 100 200 200 Q 80 300 200 400 Q 320 500 200 600 Q 80 700 200 800 Q 320 900 200 1000";
  const serpent2 = "M 200 0 Q 80 100 200 200 Q 320 300 200 400 Q 80 500 200 600 Q 320 700 200 800 Q 80 900 200 1000";

  return (
    <div ref={containerRef} className="w-full h-full flex justify-center pointer-events-none overflow-visible">
      <svg width="400" height="100%" viewBox="0 0 400 1000" preserveAspectRatio="none" className="h-full overflow-visible">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="rodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="serpentBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="serpentRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Dashed guide line */}
        <line x1="200" y1="0" x2="200" y2="1000" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 6" strokeOpacity="0.3" />

        {/* Soft glow behind the rod */}
        <motion.line x1="200" y1="0" x2="200" y2="1000" stroke="url(#rodGradient)" strokeWidth="20" filter="url(#softGlow)"
          style={{ pathLength, opacity: glowOpacity }} />

        {/* Main rod */}
        <motion.line x1="200" y1="0" x2="200" y2="1000" stroke="url(#rodGradient)" strokeWidth="4" filter="url(#glow)"
          style={{ pathLength }} />

        {/* Serpent 1 — Indigo */}
        <motion.path d={serpent1} fill="none" stroke="url(#serpentBlue)" strokeWidth="2.5" strokeLinecap="round"
          style={{ pathLength }} filter="url(#glow)" />

        {/* Serpent 2 — Red */}
        <motion.path d={serpent2} fill="none" stroke="url(#serpentRed)" strokeWidth="2.5" strokeLinecap="round"
          style={{ pathLength }} filter="url(#glow)" />

        {/* Traveling pulse */}
        <motion.circle cx="200" cy="0" r="8" fill="#8b5cf6" filter="url(#softGlow)"
          style={{
            offsetPath: `path("M 200 0 L 200 1000")`,
            offsetDistance: useTransform(pathLength, [0, 1], ["0%", "100%"])
          }} />
      </svg>
    </div>
  );
};

export const HeartbeatLine: React.FC = () => null;
