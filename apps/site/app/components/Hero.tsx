'use client';

import { motion } from 'motion/react';
import { CopyButton } from './CopyButton';
import { TreeBranches } from './TreeBranches';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 aurora-gradient opacity-10"></div>

      {/* Decorative tree branches */}
      <TreeBranches />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Logo/Title */}
          <h1 className="font-display text-6xl md:text-8xl font-bold mb-6">
            <span className="text-gradient">Yggdrasil</span>
            <br />
            <span className="text-frost-white">Worktree</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-2xl md:text-3xl font-display text-parchment mb-4 italic"
        >
          Grow many worlds. Merge what matters.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-xl text-parchment/80 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Like the mythical world tree connecting realms, Yggdrasil lets you grow isolated, parallel environments where
          ideas can evolve independently without colliding.
        </motion.p>

        {/* Changelog */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-12"
        >
          <a
            href="https://github.com/logbookfordevs/yggdrasil-worktree/blob/main/CHANGELOG.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-mist-green/60 border border-gold-rune/30 hover:border-gold-rune/60 rounded-full px-3 py-1 text-xs font-mono text-gold-rune/80 hover:text-gold-rune transition-all duration-300"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Changelog
          </a>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mx-auto flex w-full max-w-[27rem] flex-col items-stretch justify-center gap-2 sm:flex-row"
        >
          <div className="flex min-h-12 flex-1 items-center justify-between gap-3 rounded-lg border border-gold-rune/30 bg-mist-green/50 px-4 text-left backdrop-blur-sm">
            <code className="min-w-0 font-mono text-base text-frost-white sm:text-lg">npx yggtree</code>
            <CopyButton
              text="npx yggtree"
              className="shrink-0 rounded-md border-0 bg-transparent px-2.5 text-parchment/75 hover:bg-gold-rune/10 hover:text-gold-rune"
            />
          </div>

          <a
            href="/docs"
            className="group inline-flex min-h-12 items-center justify-center rounded-lg border border-gold-rune/55 bg-gold-rune/5 px-5 font-semibold text-gold-rune transition-all duration-300 hover:bg-gold-rune hover:text-deep-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-rune/55"
          >
            Read the docs
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="pointer-events-none mt-8 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-gold-rune/50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
