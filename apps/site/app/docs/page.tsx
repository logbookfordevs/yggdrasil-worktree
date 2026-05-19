import Link from 'next/link';
import { CommandBlock } from '@/app/components/CommandBlock';
import { DocsMobileMenu } from '@/app/docs/DocsMobileMenu';

const navItems = [
  { href: '#start', label: 'Start' },
  { href: '#workflows', label: 'Workflows' },
  { href: '#commands', label: 'Commands' },
  { href: '#configuration', label: 'Configuration' },
  { href: '#safety', label: 'Safety' },
];

const workflows = [
  {
    title: 'Start a real task',
    description: 'Use this when the work deserves a branch, review, and normal Git history.',
    command: 'yggtree create feat/billing-export --base main --source remote',
    note: 'Creates a branch-backed worktree and bootstraps the environment.',
  },
  {
    title: 'Jump to an existing branch',
    description: 'Use this when you are interrupted and do not want to stash current work.',
    command: 'yggtree worktree-checkout --ref hotfix/payment-timeout',
    note: 'Leaves your current checkout alone and opens the selected ref in another realm.',
  },
  {
    title: 'Try a disposable idea',
    description: 'Use this when you want a local experiment that may never become a branch.',
    command: 'yggtree create-sandbox --carry',
    note: 'Carries changed files into a sandbox, then lets you apply or discard the result.',
  },
];

const commandGroups = [
  {
    title: 'Create realms',
    commands: [
      ['yggtree create [branch]', 'Create a branch-backed task worktree.'],
      ['yggtree worktree-checkout [name] [ref]', 'Create a worktree from an existing branch or ref.'],
      ['yggtree create-sandbox', 'Create a local-only sandbox for experiments.'],
      ['yggtree create-multi', 'Create multiple official task worktrees when explicitly needed.'],
    ],
  },
  {
    title: 'Move around',
    commands: [
      ['yggtree list', 'Show repo-linked worktrees and their current state.'],
      ['yggtree open [worktree]', 'Open a worktree in an IDE or agent CLI.'],
      ['yggtree enter [worktree]', 'Enter a worktree sub-shell.'],
      ['yggtree path [worktree]', 'Print the cd command for a worktree.'],
    ],
  },
  {
    title: 'Maintain realms',
    commands: [
      ['yggtree exec [worktree] -- <command>', 'Run a command inside a chosen worktree.'],
      ['yggtree bootstrap', 'Run the configured setup commands again.'],
      ['yggtree close', 'Exit an Yggdrasil sub-shell and optionally delete the worktree.'],
      ['yggtree delete', 'Delete managed worktrees interactively.'],
      ['yggtree prune', 'Clean stale Git worktree metadata.'],
    ],
  },
  {
    title: 'Sandbox transfer',
    commands: [
      ['yggtree apply', 'Apply sandbox file changes back to the origin checkout.'],
      ['yggtree unapply', 'Restore origin files from the sandbox backup.'],
    ],
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-deep-forest text-frost-white">
        <div className="border-b border-gold-rune/20 bg-deep-forest/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 md:px-12">
            <div className="flex min-w-0 items-center gap-3">
              <DocsMobileMenu items={navItems} />
              <Link href="/" className="truncate font-display text-base font-bold text-gold-rune sm:text-xl">
                Yggdrasil Worktree
              </Link>
            </div>
            <nav className="flex shrink-0 items-center gap-3 text-sm text-parchment/70 sm:gap-5">
              <Link href="/" className="hover:text-gold-rune">
                Home
              </Link>
              <a
                href="https://github.com/logbookfordevs/yggdrasil-worktree"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold-rune"
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:px-12 md:py-12 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-8 border-l border-gold-rune/20 pl-5">
            <p className="mb-4 text-xs font-mono uppercase text-parchment/40">Docs</p>
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="block text-sm text-parchment/70 hover:text-gold-rune">
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        </aside>

        <article className="min-w-0 max-w-4xl">
          <section id="start" className="pb-12 sm:pb-16">
            <p className="mb-4 font-mono text-sm text-gold-rune">Documentation</p>
            <h1 className="mb-5 font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              Use worktrees without losing the plot.
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-parchment/80 sm:text-xl">
              Yggtree is small enough to learn quickly, but it changes a habit that is easy to get wrong: switching
              contexts while work is already in motion. Start with the command below, then pick the workflow that
              matches what you are trying to protect.
            </p>
            <div className="mt-8 max-w-2xl">
              <CommandBlock command="npx yggtree" output="Open the guided menu from any Git repository." />
            </div>
          </section>

          <section id="workflows" className="border-t border-gold-rune/15 py-10 sm:py-14">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-semibold">Common workflows</h2>
              <p className="mt-3 text-parchment/70">
                Choose by intent first. The command is the easy part once the workflow is clear.
              </p>
            </div>
            <div className="grid gap-6">
              {workflows.map((workflow) => (
                <div key={workflow.title} className="min-w-0 rounded-lg border border-gold-rune/20 bg-mist-green/25 p-4 sm:p-6">
                  <h3 className="font-display text-2xl font-semibold leading-tight text-frost-white">
                    {workflow.title}
                  </h3>
                  <p className="mt-2 text-parchment/70">{workflow.description}</p>
                  <div className="mt-5">
                    <CommandBlock command={workflow.command} />
                  </div>
                  <p className="mt-4 text-sm text-parchment/60">{workflow.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="commands" className="border-t border-gold-rune/15 py-10 sm:py-14">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-semibold">Command reference</h2>
              <p className="mt-3 text-parchment/70">
                This is the compact map. Use `yggtree` with no arguments when you want the guided version.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {commandGroups.map((group) => (
                <div key={group.title} className="min-w-0 rounded-lg border border-gold-rune/15 bg-deep-forest/50 p-4 sm:p-5">
                  <h3 className="mb-4 font-display text-xl font-semibold text-gold-rune">{group.title}</h3>
                  <div className="space-y-4">
                    {group.commands.map(([command, description]) => (
                      <div key={command} className="min-w-0">
                        <code className="block max-w-full whitespace-normal break-words font-mono text-sm text-frost-white sm:scrollbar-none sm:overflow-x-auto sm:whitespace-nowrap sm:pb-1">
                          {command}
                        </code>
                        <p className="mt-1 text-sm text-parchment/60">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="configuration" className="border-t border-gold-rune/15 py-10 sm:py-14">
            <h2 className="font-display text-3xl font-semibold">Configuration</h2>
            <p className="mt-3 max-w-3xl text-parchment/70">
              If a repository needs something other than the fallback `npm install`, define setup commands once and let
              every new realm inherit the same ritual.
            </p>
            <div className="mt-6 min-w-0 rounded-lg border border-gold-rune/20 bg-mist-green/25 p-4 sm:p-6">
              <p className="scrollbar-none mb-4 overflow-x-auto whitespace-nowrap font-mono text-sm text-gold-rune">
                .yggtree/worktree-setup.json
              </p>
              <pre className="scrollbar-none overflow-x-auto rounded-md bg-deep-forest/90 p-4 text-xs text-frost-white sm:p-5 sm:text-sm">
                <code>{`{
  "setup-worktree": [
    "pnpm install",
    "git submodule sync --recursive",
    "git submodule update --init --recursive"
  ]
}`}</code>
              </pre>
            </div>
          </section>

          <section id="safety" className="border-t border-gold-rune/15 py-10 sm:py-14">
            <h2 className="font-display text-3xl font-semibold">Safety notes</h2>
            <div className="mt-6 grid gap-4">
              <p className="rounded-lg border border-gold-rune/15 bg-mist-green/20 p-5 text-parchment/75">
                Use `create` for official task branches. Use `create-sandbox` for disposable alternatives.
              </p>
              <p className="rounded-lg border border-gold-rune/15 bg-mist-green/20 p-5 text-parchment/75">
                Run `unapply` before deleting a sandbox if you may need to undo changes applied back to the origin.
              </p>
              <p className="rounded-lg border border-gold-rune/15 bg-mist-green/20 p-5 text-parchment/75">
                Prefer `worktree-checkout` over stash when the current checkout contains work you do not want to disturb.
              </p>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
