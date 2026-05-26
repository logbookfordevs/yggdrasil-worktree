'use client';

import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay }}
      className="group relative"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-br from-gold-rune/20 to-cosmic-purple/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
      <div className="relative h-full bg-mist-green/50 backdrop-blur-sm border border-gold-rune/20 rounded-xl p-6 hover:border-gold-rune/40 transition-all duration-300">
        <div className="text-gold-rune mb-4 transform group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="font-display text-xl font-semibold text-frost-white mb-2">
          {title}
        </h3>
        <p className="text-parchment/80 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
