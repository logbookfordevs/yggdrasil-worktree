"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CommandBlock } from "./CommandBlock";

interface AccordionCommandProps {
  command: string;
  description: string;
  thematicLabel?: string;
  options?: { flag: string; description: string }[];
  example?: { command: string; explanation: string };
}

export function AccordionCommand({
  command,
  description,
  thematicLabel,
  options,
  example,
}: AccordionCommandProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gold-rune/20 rounded-lg overflow-hidden bg-mist-green/30 backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-mist-green/50 transition-colors"
      >
        <div className="flex-1">
          <code className="font-mono text-gold-rune font-semibold">
            {command}
          </code>
          {thematicLabel && (
            <p className="text-frost-white/90 text-sm font-medium mt-1">
              {thematicLabel}
              <span className="text-parchment/50 font-normal"> · </span>
              <span className="text-parchment/60 font-normal">
                {description}
              </span>
            </p>
          )}
          {!thematicLabel && (
            <p className="text-parchment/70 text-sm mt-1">{description}</p>
          )}
        </div>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5 text-gold-rune flex-shrink-0 ml-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pt-6 pb-6 space-y-4 border-t border-gold-rune/10">
              {options && options.length > 0 && (
                <div className="pt-4">
                  <h4 className="text-frost-white font-semibold mb-2 text-sm">
                    Options:
                  </h4>
                  <ul className="space-y-2">
                    {options.map((opt, idx) => (
                      <li key={idx} className="flex gap-3 text-sm">
                        <code className="text-gold-rune font-mono flex-shrink-0">
                          {opt.flag}
                        </code>
                        <span className="text-parchment/70">
                          {opt.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {example && (
                <div>
                  <h4 className="text-frost-white font-semibold mb-2 text-sm">
                    Example:
                  </h4>
                  <CommandBlock command={example.command} />
                  <p className="text-parchment/60 text-sm mt-2 italic">
                    {example.explanation}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
