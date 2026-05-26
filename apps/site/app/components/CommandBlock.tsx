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
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-gold-rune/20 bg-deep-forest/50 sm:px-4">
          <span className="text-xs font-mono text-parchment/60">Terminal</span>
          <CopyButton text={command} />
        </div>
        <div className="p-3 font-mono text-sm sm:p-4">
          <div className="flex min-w-0 items-start gap-2">
            <span className="text-gold-rune select-none">$</span>
            <code className="min-w-0 flex-1 whitespace-pre-wrap break-words text-frost-white sm:scrollbar-none sm:overflow-x-auto sm:whitespace-nowrap sm:pb-1">
              {command}
            </code>
          </div>
          {output && (
            <div className="mt-2 border-l-2 border-cosmic-purple/30 pl-3 text-parchment/70 sm:pl-4">
              {output}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
