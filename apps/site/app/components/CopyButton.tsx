'use client';

import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`min-h-11 rounded border border-gold-rune/30 px-3 py-2 text-sm font-mono transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-rune/55 ${
        copied ? 'bg-gold-rune text-deep-forest' : 'bg-mist-green text-parchment hover:bg-surface hover:text-gold-rune'
      } ${className}`}
      aria-label="Copy to clipboard"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}
