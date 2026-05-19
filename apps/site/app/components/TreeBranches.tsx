'use client';

import { motion } from 'motion/react';

export function TreeBranches() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
      <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        {/* Main trunk */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          d="M500,1000 L500,0"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-gold-rune"
        />
        
        {/* Left branches */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }}
          d="M500,800 Q450,700 400,600 Q350,500 300,400"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gold-rune"
        />
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.4, ease: "easeInOut" }}
          d="M500,600 Q450,550 400,500 Q350,450 250,400"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gold-rune"
        />
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
          d="M500,400 Q450,350 350,300"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gold-rune"
        />
        
        {/* Right branches */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }}
          d="M500,800 Q550,700 600,600 Q650,500 700,400"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gold-rune"
        />
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.4, ease: "easeInOut" }}
          d="M500,600 Q550,550 600,500 Q650,450 750,400"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gold-rune"
        />
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
          d="M500,400 Q550,350 650,300"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gold-rune"
        />
        
        {/* Small branches */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
          d="M400,600 L350,550"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-gold-rune"
        />
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.9, ease: "easeInOut" }}
          d="M600,600 L650,550"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-gold-rune"
        />
      </svg>
    </div>
  );
}
