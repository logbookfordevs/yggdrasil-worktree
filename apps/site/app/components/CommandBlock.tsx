'use client';

import { CopyButton } from '@/app/components/CopyButton';

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
        <div className="flex items-center justify-between gap-3 border-b border-gold-rune/20 bg-deep-forest/50 px-3 py-2 sm:px-4">
          <span className="ygg-mono text-[0.75rem] font-medium leading-5 text-parchment/60">
            Terminal
          </span>
          <CopyButton text={command} />
        </div>
        <div className="ygg-mono p-3 text-[0.875rem] leading-6 sm:p-4">
          <div className="flex min-w-0 items-start gap-2">
            <span className="select-none text-gold-rune">$</span>
            <code className="ygg-mono min-w-0 flex-1 whitespace-pre-wrap break-words text-frost-white sm:scrollbar-none sm:overflow-x-auto sm:whitespace-nowrap sm:pb-1">
              {command}
            </code>
          </div>
          {output && (
            <div className="ygg-mono mt-3 rounded-md bg-deep-forest/45 px-3 py-2 text-[0.8125rem] leading-6 text-parchment/70">
              {output}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
