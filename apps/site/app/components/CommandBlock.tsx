'use client';

import { CopyButton } from './CopyButton';

interface CommandBlockProps {
  command: string;
  output?: string;
  className?: string;
}

export function CommandBlock({ command, output, className = '' }: CommandBlockProps) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-gold-rune to-cosmic-purple rounded-lg opacity-20 group-hover:opacity-40 transition-opacity blur"></div>
      <div className="relative bg-mist-green/90 backdrop-blur-sm rounded-lg border border-gold-rune/20 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gold-rune/20 bg-deep-forest/50">
          <span className="text-xs font-mono text-parchment/60">Terminal</span>
          <CopyButton text={command} />
        </div>
        <div className="p-4 font-mono text-sm">
          <div className="flex items-start gap-2">
            <span className="text-gold-rune select-none">$</span>
            <code className="text-frost-white flex-1">{command}</code>
          </div>
          {output && (
            <div className="mt-2 text-parchment/70 pl-4 border-l-2 border-cosmic-purple/30">
              {output}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
