import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

/* ─── Easing constants ─── */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;

/* ─── Shared variants ─── */
export const fadeUp = {
  hidden: { opacity: 0, y: 60, filter: 'blur(8px)' },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { delay: i * 0.1, duration: 0.9, ease: EASE_OUT_EXPO }
  })
};

export const fadeIn = {
  hidden: { opacity: 0, filter: 'blur(4px)' },
  visible: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE_OUT_EXPO } }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.85, filter: 'blur(6px)' },
  visible: (i: number = 0) => ({
    opacity: 1, scale: 1, filter: 'blur(0px)',
    transition: { delay: i * 0.08, duration: 0.7, ease: EASE_OUT_QUINT }
  })
};

export const slideFromLeft = {
  hidden: { opacity: 0, x: -80, filter: 'blur(6px)' },
  visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE_OUT_EXPO } }
};

export const slideFromRight = {
  hidden: { opacity: 0, x: 80, filter: 'blur(6px)' },
  visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE_OUT_EXPO } }
};

/* ─── Reveal on scroll wrapper ─── */
interface RevealProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fadeUp' | 'fadeIn' | 'scaleIn' | 'slideLeft' | 'slideRight';
  delay?: number;
  once?: boolean;
  margin?: string;
}

const variantMap = {
  fadeUp, fadeIn, scaleIn, slideLeft: slideFromLeft, slideRight: slideFromRight
};

export const Reveal: React.FC<RevealProps> = ({
  children, className = '', variant = 'fadeUp', delay = 0, once = true, margin = '-80px'
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: margin as any });
  const v = variantMap[variant];

  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'}
      custom={delay} variants={v} className={className}>
      {children}
    </motion.div>
  );
};

/* ─── Parallax wrapper ─── */
interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  offset?: [string, string];
}

export const Parallax: React.FC<ParallaxProps> = ({
  children, className = '', speed = 0.3, offset = ["start end", "end start"]
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: offset as any });
  const y = useTransform(scrollYProgress, [0, 1], [speed * -100, speed * 100]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
};

/* ─── Stagger container ─── */
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

/* ─── Magnetic hover button ─── */
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ children, className = '', onClick, disabled }) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.04 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.button>
  );
};

/* ─── Counter animation component ─── */
export const AnimatedCounter: React.FC<{
  value: string;
  className?: string;
}> = ({ value, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {value}
    </motion.div>
  );
};

export default Reveal;
