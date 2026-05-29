'use client';

import Image from 'next/image';
import { Hero } from './components/Hero';
import { Section } from './components/Section';
import { FeatureCard } from './components/FeatureCard';
import { CommandBlock } from './components/CommandBlock';
import { AnimatedTerminal } from './components/AnimatedTerminal';
import { AudioExperience } from './components/AudioExperience';
import { BuyMeACoffee } from './components/BuyMeACoffee';

import { motion } from 'motion/react';

export default function Home() {
  return (
    <main className="min-h-screen">
      <AudioExperience audioSrc="/sound.mp3" />
      <Hero />

      {/* Philosophy Section */}
      <Section id="philosophy" className="bg-mist-green/20 mt-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-frost-white mb-6">Mental Model</h2>
          <p className="text-parchment/80 text-lg max-w-2xl mx-auto">
            Yggdrasil is built around a few core ideas that transform how you think about parallel development.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Branches are ideas',
              description: 'Each branch represents a concept, a possibility, a direction your code could take.',
              icon: (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              delay: 0,
            },
            {
              title: 'Worktrees are realms',
              description: 'Each worktree is a complete, isolated reality where that idea can fully manifest.',
              icon: (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
              delay: 0.1,
            },
            {
              title: 'Each task deserves its own world',
              description: 'No more context switching. No more stashing. Each task lives in its own space.',
              icon: (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              ),
              delay: 0.2,
            },
          ].map((item, idx) => (
            <FeatureCard key={idx} {...item} />
          ))}
        </div>
      </Section>

      {/* Quick Start Section */}
      <Section id="quick-start">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-frost-white mb-6">Quick Start</h2>
          <p className="text-parchment/80 text-lg max-w-2xl mx-auto">
            Install once, then open the guided workflow from any Git repository.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-display font-semibold text-frost-white mb-4">Installation</h3>
            <div className="space-y-4">
              <div>
                <p className="text-parchment/70 mb-2">Install globally:</p>
                <CommandBlock command="npm install -g yggtree" />
              </div>
              <div>
                <p className="text-parchment/70 mb-2">Or try it without installing:</p>
                <CommandBlock command="npx yggtree" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-2xl font-display font-semibold text-frost-white mb-4">Basic Usage</h3>
            <AnimatedTerminal
              lines={[
                { type: 'command', content: 'yggtree', delay: 500 },
                {
                  type: 'output',
                  content: '✓ Opening interactive menu...',
                  delay: 800,
                },
                {
                  type: 'command',
                  content: 'yggtree create feat/new-feature',
                  delay: 1500,
                },
                {
                  type: 'output',
                  content: '✓ Created worktree for feat/new-feature',
                  delay: 800,
                },
                {
                  type: 'output',
                  content: '✓ Bootstrapping environment...',
                  delay: 600,
                },
                { type: 'command', content: 'yggtree list', delay: 1200 },
                {
                  type: 'output',
                  content: 'TYPE     STATE   BRANCH              LAST ACTIVE',
                  delay: 600,
                },
                {
                  type: 'output',
                  content: 'MANAGED  clean   feat/new-feature    just now',
                  delay: 400,
                },
              ]}
            />
          </motion.div>
        </div>
      </Section>

      {/* Features Section */}
      <Section id="features" className="bg-mist-green/20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-frost-white mb-6">Key Features</h2>
          <p className="text-parchment/80 text-lg max-w-2xl mx-auto">
            Everything you need for modern parallel development workflows.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: 'True Parallel Tasks',
              description:
                'Run completely independent tasks at the same time — implement a new page while fixing a bug in a totally different flow. No stashing, no conflicts.',
              icon: (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              ),
              delay: 0,
            },
            {
              title: 'First-class Worktree Workflow',
              description: 'Create, manage, and navigate Git worktrees as a primary workflow, not an afterthought.',
              icon: (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              ),
              delay: 0.1,
            },
            {
              title: 'AI-Friendly Isolation',
              description: 'Assign each AI agent its own worktree — every task gets a dedicated, isolated environment.',
              icon: (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              ),
              delay: 0.2,
            },
            {
              title: 'Automatic Bootstrapping',
              description: 'Run installs, submodules, and setup scripts automatically for each worktree.',
              icon: (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ),
              delay: 0.3,
            },
            {
              title: 'Enter, Exec, and Exit',
              description: 'Enter worktrees, execute commands, or run tasks without changing directories.',
              icon: (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              ),
              delay: 0.4,
            },
            {
              title: 'Interactive or Scriptable',
              description: 'Use the interactive UI or drive everything through commands and flags.',
              icon: (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              ),
              delay: 0.5,
            },
          ].map((item, idx) => (
            <FeatureCard key={idx} {...item} />
          ))}
        </div>
      </Section>

      {/* The Core — Parallel Tasks Section */}
      <Section id="parallel-tasks">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-gold-rune/10 border border-gold-rune/30 rounded-full px-5 py-2 mb-6">
            <span className="text-gold-rune text-sm font-semibold tracking-wide uppercase">The Core</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-frost-white mb-6">
            Run Independent Tasks in Parallel
          </h2>
          <p className="text-parchment/80 text-lg max-w-3xl mx-auto">
            This is the heart of Yggdrasil. Each worktree is a{' '}
            <strong className="text-frost-white">completely independent task</strong> — with its own branch, its own
            remote, its own environment. Implement a new page while fixing an unrelated bug in a different flow.
            Simultaneously.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Visual: Parallel Task Lanes */}
            <div className="bg-mist-green/30 backdrop-blur-sm border border-gold-rune/20 rounded-xl p-8">
              <h3 className="text-2xl font-display font-semibold text-frost-white mb-6">
                Multiple Tasks, Zero Conflicts
              </h3>
              <div className="space-y-4 mb-8">
                <CommandBlock command="yggtree create feat/new-dashboard --exec 'cursor .'" />
                <CommandBlock command="yggtree create fix/auth-bug --exec 'code .'" />
                <CommandBlock command="yggtree create chore/update-deps --exec 'aider'" />
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="bg-deep-forest/50 border border-gold-rune/40 rounded-lg p-5">
                  <div className="text-gold-rune font-semibold mb-2">Task 1</div>
                  <div className="text-frost-white text-sm font-medium">feat/new-dashboard</div>
                  <div className="text-parchment/60 text-xs mt-1">Building the new analytics page</div>
                </div>
                <div className="bg-deep-forest/50 border border-gold-rune/40 rounded-lg p-5">
                  <div className="text-gold-rune font-semibold mb-2">Task 2</div>
                  <div className="text-frost-white text-sm font-medium">fix/auth-bug</div>
                  <div className="text-parchment/60 text-xs mt-1">Fixing a login edge case</div>
                </div>
                <div className="bg-deep-forest/50 border border-gold-rune/40 rounded-lg p-5">
                  <div className="text-gold-rune font-semibold mb-2">Task 3</div>
                  <div className="text-frost-white text-sm font-medium">chore/update-deps</div>
                  <div className="text-parchment/60 text-xs mt-1">Upgrading outdated dependencies</div>
                </div>
              </div>
              <p className="text-parchment/60 text-sm mt-6 italic text-center">
                Three unrelated tasks. Three isolated environments. All running at the same time.
              </p>
            </div>

            {/* AI Workflow Sub-section */}
            <div className="bg-mist-green/20 backdrop-blur-sm border border-cosmic-purple/30 rounded-xl p-8">
              <h3 className="text-2xl font-display font-semibold text-frost-white mb-4">
                🤖 Even Better with AI Agents
              </h3>
              <p className="text-parchment/80 mb-6">
                Assign each agent its own worktree. Different tasks, different agents, all in parallel — no collisions.
              </p>
              <div className="space-y-4 mb-6">
                <CommandBlock command="yggtree create feat/ai-refactor --exec 'cursor .'" />
                <CommandBlock command="yggtree create feat/ai-tests --exec 'codex'" />
                <CommandBlock command="yggtree create fix/ai-perf --exec 'aider'" />
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="bg-deep-forest/50 border border-cosmic-purple/50 rounded-lg p-4">
                  <div className="text-cosmic-purple font-semibold mb-2">Agent A · Cursor</div>
                  <div className="text-parchment/70 text-sm">Refactors architecture</div>
                </div>
                <div className="bg-deep-forest/50 border border-cosmic-purple/50 rounded-lg p-4">
                  <div className="text-cosmic-purple font-semibold mb-2">Agent B · Codex</div>
                  <div className="text-parchment/70 text-sm">Writes test suite</div>
                </div>
                <div className="bg-deep-forest/50 border border-cosmic-purple/50 rounded-lg p-4">
                  <div className="text-cosmic-purple font-semibold mb-2">Agent C · Aider</div>
                  <div className="text-parchment/70 text-sm">Optimizes performance</div>
                </div>
              </div>
              <p className="text-parchment/60 text-sm mt-6 italic text-center">
                All in parallel. All reviewable. All isolated.
              </p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Sandbox Worktrees Section — positioned as an additional option */}
      <Section id="sandbox" className="bg-mist-green/20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-cosmic-purple/15 border border-cosmic-purple/30 rounded-full px-5 py-2 mb-6">
            <span className="text-cosmic-purple text-sm font-semibold tracking-wide uppercase">Extra Mode</span>
          </div>
          <h2 className="font-display text-4xl font-bold text-frost-white mb-6">🧪 Sandbox Mode</h2>
          <p className="text-parchment/80 text-lg max-w-3xl mx-auto">
            Not every worktree needs to be a live task with its own remote branch. Sometimes you just need a{' '}
            <strong className="text-frost-white">local playground</strong> — a temporary, disposable space to experiment
            freely and bring back only what works.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* When to Use */}
            <div className="bg-deep-forest/50 backdrop-blur-sm border border-gold-rune/20 rounded-xl p-6">
              <h3 className="text-xl font-display font-semibold text-frost-white mb-3">When to Use Sandbox</h3>
              <p className="text-parchment/80">
                The core workflow creates <strong className="text-frost-white">real, managed worktrees</strong> — each
                with its own branch and remote, perfect for independent tasks. But sometimes you don&apos;t need all
                that. You just want a quick, <em>local-only</em> space to try something without any Git footprint.
                That&apos;s where Sandbox comes in.
              </p>
            </div>

            {/* Use Cases — expanded */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-mist-green/30 border border-cosmic-purple/30 rounded-lg p-5">
                <div className="text-cosmic-purple font-semibold mb-2">🔬 A/B Testing Approaches</div>
                <div className="text-parchment/70 text-sm">
                  Create 3 sandboxes. Try 3 completely different architectures for the same problem. Keep the winner,
                  discard the rest. No branches left behind.
                </div>
              </div>
              <div className="bg-mist-green/30 border border-cosmic-purple/30 rounded-lg p-5">
                <div className="text-cosmic-purple font-semibold mb-2">🚀 Risky Refactors</div>
                <div className="text-parchment/70 text-sm">
                  That massive refactor you&apos;re not sure about? Do it in a sandbox. If it breaks everything, just
                  delete it — your main code is untouched.
                </div>
              </div>
              <div className="bg-mist-green/30 border border-cosmic-purple/30 rounded-lg p-5">
                <div className="text-cosmic-purple font-semibold mb-2">🤖 Multi-Agent Experiments</div>
                <div className="text-parchment/70 text-sm">
                  Give the same task to <em>different AI agents</em> — Cursor in one sandbox, Codex in another, Aider in
                  a third. Compare the results side by side. Pick the best one.
                </div>
              </div>
              <div className="bg-mist-green/30 border border-cosmic-purple/30 rounded-lg p-5">
                <div className="text-cosmic-purple font-semibold mb-2">📝 Multi-Prompt Testing</div>
                <div className="text-parchment/70 text-sm">
                  Same agent, <em>different prompts</em>. Spin up sandboxes to test how different instructions produce
                  different outcomes for the very same task. Iterate faster.
                </div>
              </div>
            </div>

            {/* The Solution */}
            <div className="bg-mist-green/30 backdrop-blur-sm border border-gold-rune/20 rounded-xl p-6">
              <h3 className="text-xl font-display font-semibold text-frost-white mb-4">The Workflow</h3>
              <div className="space-y-4">
                <CommandBlock command="yggtree create-sandbox --carry" />
                <p className="text-parchment/60 text-sm">
                  Creates a temporary, <strong className="text-parchment/80">local-only</strong> worktree with a random
                  name. Carries your uncommitted changes. Never pushes to remote.
                </p>

                <CommandBlock command="yggtree apply" />
                <p className="text-parchment/60 text-sm">
                  Liked the result? Apply the file changes back to your origin directory.
                </p>

                <CommandBlock command="yggtree unapply" />
                <p className="text-parchment/60 text-sm">Didn&apos;t work out? Revert to exactly how it was before.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Docs Preview Section */}
      <Section id="commands" className="bg-mist-green/20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-frost-white mb-6">Choose the right realm</h2>
          <p className="text-parchment/80 text-lg max-w-2xl mx-auto">
            The full docs now carry the command reference. Here are the three choices that matter most.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Official task',
              command: 'yggtree create feat/new-flow',
              description: 'Create a branch-backed worktree for real implementation work.',
            },
            {
              title: 'Existing branch',
              command: 'yggtree wc --ref main',
              description: 'Review or fix another branch without stashing your current work.',
            },
            {
              title: 'Disposable experiment',
              command: 'yggtree create-sandbox --carry',
              description: 'Try a local-only approach and apply it back only if it wins.',
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="rounded-xl border border-gold-rune/20 bg-deep-forest/55 p-6"
            >
              <h3 className="font-display text-xl font-semibold text-gold-rune mb-3">{item.title}</h3>
              <code className="block rounded-md bg-mist-green/50 px-3 py-2 font-mono text-sm text-frost-white">
                {item.command}
              </code>
              <p className="mt-4 text-sm leading-relaxed text-parchment/70">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="pt-10 flex justify-center"
        >
          <a
            href="/docs"
            className="group inline-flex items-center gap-3 bg-deep-forest/60 border border-gold-rune/25 hover:border-gold-rune/60 rounded-xl px-6 py-4 transition-all duration-300 hover:bg-deep-forest/80 hover:shadow-lg hover:shadow-gold-rune/10"
          >
            <span className="text-parchment/70 group-hover:text-frost-white text-sm font-medium transition-colors duration-300">
              Read the guided docs and full command reference
            </span>
            <svg
              className="w-4 h-4 text-parchment/40 group-hover:text-gold-rune group-hover:translate-x-0.5 transition-all duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>
      </Section>

      {/* Configuration Section */}
      <Section id="configuration">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-frost-white mb-6">Configuration</h2>
          <p className="text-parchment/80 text-lg max-w-2xl mx-auto">
            Customize how Yggdrasil bootstraps each worktree with automatic setup scripts.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-mist-green/30 backdrop-blur-sm border border-gold-rune/20 rounded-xl p-8">
              <h3 className="text-xl font-display font-semibold text-frost-white mb-4">.yggtree/worktree-setup.json</h3>
              <p className="text-parchment/70 mb-6">
                Create a{' '}
                <code className="text-gold-rune/80 bg-deep-forest/60 px-1.5 py-0.5 rounded text-xs">.yggtree</code>{' '}
                folder in your repo root with a{' '}
                <code className="text-gold-rune/80 bg-deep-forest/60 px-1.5 py-0.5 rounded text-xs">
                  worktree-setup.json
                </code>{' '}
                file to define custom bootstrap commands:
              </p>
              <div className="relative group">
                <div className="relative bg-deep-forest/95 backdrop-blur-sm rounded-lg border border-gold-rune/30 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gold-rune/20 bg-mist-green/30">
                    <span className="text-xs font-mono text-parchment/60">.yggtree/worktree-setup.json</span>
                  </div>
                  <pre className="p-6 overflow-x-auto">
                    <code className="font-mono text-sm text-frost-white">
                      {`{
  "setup-worktree": [
    "npm install",
    "git submodule sync --recursive",
    "git submodule update --init --recursive",
    "echo \\"🌳 Realm ready\\""
  ]
}`}
                    </code>
                  </pre>
                </div>
              </div>
              <div className="mt-6 text-parchment/60 text-sm space-y-2">
                <p>
                  <strong className="text-parchment">Resolution order:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>
                    .yggtree/worktree-setup.json in the repo root <span className="text-gold-rune/60">(primary)</span>
                  </li>
                  <li>
                    .yggtree/worktree-setup.json inside the worktree{' '}
                    <span className="text-parchment/40">(per-worktree override)</span>
                  </li>
                  <li>
                    yggtree-worktree.json <span className="text-parchment/40">(legacy)</span>
                  </li>
                  <li>
                    .cursor/worktrees.json <span className="text-parchment/40">(legacy)</span>
                  </li>
                  <li>Fallback: npm install + submodules</li>
                </ol>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Video Showcase Section */}
      <Section id="video-showcase" className="bg-mist-green/20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gold-rune/10 border border-gold-rune/30 rounded-full px-5 py-2 mb-6">
            <svg className="w-4 h-4 text-gold-rune" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="text-gold-rune text-sm font-semibold tracking-wide uppercase">See it in Action</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-frost-white mb-6">
            Watch Yggdrasil in Action
          </h2>
          <p className="text-parchment/80 text-lg max-w-2xl mx-auto">
            The story behind the tool + the real CLI running live.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Story Video */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div className="relative group h-full">
              <div className="absolute -inset-1 bg-linear-to-r from-cosmic-purple/30 via-gold-rune/20 to-cosmic-purple/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-700" />

              <div className="relative bg-deep-forest/80 backdrop-blur-sm border border-gold-rune/30 rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gold-rune/20 bg-mist-green/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs font-mono text-parchment/50 ml-2">The Yggdrasil Story</span>
                </div>

                <video className="w-full aspect-video flex-1" controls preload="metadata" poster="">
                  <source src="/Yggdrasil__Grow_Your_Worlds.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <p className="text-parchment/50 text-sm text-center mt-4 italic">
              🌳 The core idea — how growing parallel worlds changes the way you develop.
            </p>
          </motion.div>

          {/* Live CLI Demo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          >
            <div className="relative group h-full">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-linear-to-r from-gold-rune/20 via-mist-green/15 to-gold-rune/20 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-700" />

              <div className="relative bg-deep-forest/80 backdrop-blur-sm border border-gold-rune/30 rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col">
                {/* Terminal header bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gold-rune/20 bg-mist-green/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs font-mono text-parchment/50 ml-2">yggtree — Live CLI Demo</span>
                </div>

                {/* Video player */}
                <video className="w-full aspect-video flex-1" controls preload="metadata" poster="">
                  <source src="/demo.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <p className="text-parchment/50 text-sm text-center mt-4 italic">🌿 The real CLI in action.</p>
          </motion.div>
        </div>
      </Section>

      {/* Buy Me a Coffee Section */}
      <BuyMeACoffee />

      {/* Footer */}
      <footer className="bg-mist-green/30 border-t border-gold-rune/20">
        <Section className="py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-parchment/80 mb-2">
                A tool from the{' '}
                <a
                  href="https://logbookfordevs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-rune hover:underline font-semibold"
                >
                  LogBook for Devs
                </a>
              </p>
              <p className="text-parchment/60 text-sm">Charting the technical seas, one commit at a time.</p>
            </div>

            <div className="flex flex-col items-center">
              <a
                href="https://www.producthunt.com/products/yggdrasil-worktree?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-yggdrasil-worktree"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-40 hover:opacity-100 transition-opacity duration-500"
              >
                <Image
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1093107&theme=neutral&t=1773019479231"
                  alt="Yggdrasil Worktree on Product Hunt"
                  width="150"
                  height="32"
                  unoptimized
                />
              </a>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="https://github.com/logbookfordevs/yggdrasil-worktree"
                target="_blank"
                rel="noopener noreferrer"
                className="text-parchment/70 hover:text-gold-rune transition-colors"
                title="GitHub"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://www.npmjs.com/package/yggtree"
                target="_blank"
                rel="noopener noreferrer"
                className="text-parchment/70 hover:text-gold-rune transition-colors"
                title="npm"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
                </svg>
              </a>
              <a
                href="https://github.com/logbookfordevs/yggdrasil-worktree/blob/main/CHANGELOG.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-parchment/70 hover:text-gold-rune transition-colors"
                title="Changelog"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gold-rune/10 text-center space-y-4">
            <p className="text-parchment/50 text-sm">
              MIT License © 2025 | <span className="text-gold-rune/70">Grow many worlds. Merge what matters.</span>
            </p>
            <div className="text-parchment/30 text-[10px] font-mono uppercase tracking-[0.2em] max-w-2xl mx-auto">
              Music: Peaceful Village by Arthur Vyncke | arthurvost • Promoted by free-stock-music.com • CC BY-SA 3.0
            </div>
          </div>
        </Section>
      </footer>
    </main>
  );
}
