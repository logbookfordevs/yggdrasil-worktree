'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface TerminalLine {
  type: 'command' | 'output';
  content: string;
  delay: number;
}

interface AnimatedTerminalProps {
  lines: TerminalLine[];
  className?: string;
}

export function AnimatedTerminal({ lines, className = '' }: AnimatedTerminalProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    if (visibleLines >= lines.length) return;

    const timer = setTimeout(() => {
      setVisibleLines(prev => prev + 1);
    }, lines[visibleLines].delay);

    return () => clearTimeout(timer);
  }, [visibleLines, lines]);

  return (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-gold-rune to-cosmic-purple rounded-lg opacity-20 blur"></div>
      <div className="relative bg-deep-forest/95 backdrop-blur-sm rounded-lg border border-gold-rune/30 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gold-rune/20 bg-mist-green/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
          </div>
          <span className="text-xs font-mono text-parchment/60 ml-2">yggtree</span>
        </div>
        <div className="p-6 font-mono text-sm min-h-[200px]">
          {lines.slice(0, visibleLines).map((line, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`mb-2 ${line.type === 'command' ? 'flex items-start gap-2' : 'pl-4'}`}
            >
              {line.type === 'command' ? (
                <>
                  <span className="text-gold-rune select-none">$</span>
                  <span className="text-frost-white">{line.content}</span>
                </>
              ) : (
                <span className="text-parchment/70">{line.content}</span>
              )}
            </motion.div>
          ))}
          {visibleLines < lines.length && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-2 h-4 bg-gold-rune ml-1"
            />
          )}
        </div>
      </div>
    </div>
  );
}
