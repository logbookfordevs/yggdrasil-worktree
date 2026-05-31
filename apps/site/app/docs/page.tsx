import Link from 'next/link';
import type { CSSProperties } from 'react';
import { CommandBlock } from '@/app/components/CommandBlock';
import { DocsMobileMenu } from '@/app/docs/DocsMobileMenu';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '#start', label: 'Start' },
  { href: '#workflows', label: 'Workflows' },
  { href: '#creation', label: 'Create Worktrees' },
  { href: '#navigation', label: 'Navigate' },
  { href: '#sandbox', label: 'Sandbox' },
  { href: '#commands', label: 'Commands' },
  { href: '#configuration', label: 'Configuration' },
  { href: '#safety', label: 'Safety' },
  { href: '#troubleshooting', label: 'Troubleshooting' },
];

const workflows = [
  {
    title: 'Start a real task',
    description: 'Use this when the work deserves a branch, review, and normal Git history.',
    command: 'yggtree create feat/billing-export --base main --source remote',
    note: 'Creates a branch-backed managed worktree, copies opted-in local env files, and bootstraps the environment.',
  },
  {
    title: 'Jump to an existing branch',
    description: 'Use this when you are interrupted and do not want to stash current work.',
    command: 'yggtree wc --ref hotfix/payment-timeout',
    note: 'Leaves your current checkout alone, reuses an existing branch worktree when one exists, then enters the shell.',
  },
  {
    title: 'Try a disposable idea',
    description: 'Use this when you want a local experiment that may never become a branch.',
    command: 'yggtree create-sandbox --carry',
    note: 'Carries changed files into a sandbox, then lets you apply or discard the result.',
  },
];

const creationExamples = [
  {
    title: 'Create from the default interactive flow',
    command: 'yggtree create',
    detail: 'Yggtree asks for the branch, base ref, bootstrap preference, and whether to open an editor.',
  },
  {
    title: 'Create a named branch from a known base',
    command: 'yggtree create feat/invoice-export --base main --source remote',
    detail: 'Use this for reviewable task work when you already know the branch name.',
  },
  {
    title: 'Create without setup or editor launch',
    command: 'yggtree create feat/docs-pass --no-bootstrap --no-open',
    detail: 'Useful for automation or when you want to inspect the worktree before installing dependencies.',
  },
  {
    title: 'Run an explicit startup command',
    command: 'yggtree create feat/ui-polish --exec "code ."',
    detail: '`--exec` is the advanced escape hatch when the normal editor picker is not specific enough.',
  },
];

const checkoutExamples = [
  {
    title: 'Pick from searchable branches',
    command: 'yggtree wc',
    detail: 'The picker shows local branches, remote branches, and duplicate local/origin choices explicitly.',
  },
  {
    title: 'Checkout a known ref non-interactively',
    command: 'yggtree wc hotfix-auth main --no-open --no-enter',
    detail: 'Good for scripts: create or reuse the checkout, skip tools, and return to the caller.',
  },
  {
    title: 'Open a specific tool after checkout',
    command: 'yggtree wc hotfix-auth main --tool codex-app',
    detail: '`--tool` implies opening, skips the picker, and still enters the worktree shell unless `--no-enter` is set.',
  },
  {
    title: 'Open editors but stay in the current shell',
    command: 'yggtree wc hotfix-auth main --open --no-enter',
    detail: 'Use this when the command should prepare a worktree and return.',
  },
];

const sandboxExamples = [
  {
    title: 'Start a throwaway experiment',
    command: 'yggtree create-sandbox',
    detail: 'Creates a sandbox from the current local branch with an auto-generated name.',
  },
  {
    title: 'Carry current edits into a sandbox',
    command: 'yggtree create-sandbox --carry',
    detail: 'Moves staged, unstaged, and untracked work into the sandbox path for isolated exploration.',
  },
  {
    title: 'Apply sandbox changes back',
    command: 'yggtree apply',
    detail: 'Run inside the sandbox. Yggtree backs up overwritten origin files before applying changes.',
  },
  {
    title: 'Undo an apply while the sandbox still exists',
    command: 'yggtree unapply',
    detail: 'Restores the origin files from the sandbox backup created by `apply`.',
  },
];

const commandGroups = [
  {
    title: 'Create realms',
    commands: [
      {
        command: 'yggtree create [branch]',
        description: 'Create a branch-backed task worktree.',
        flags: [
          '-b, --branch <name>: branch name when not passed positionally',
          '--base <ref>: base ref such as main',
          '--source <type>: choose local or remote base source',
          '--no-bootstrap: skip setup commands',
          '--open / --no-open: choose whether to open an editor after creation',
          '--exec <command>: run an explicit command after creation',
        ],
      },
      {
        command: 'yggtree worktree-checkout [name] [ref]',
        description: 'Create or reuse a checkout-style worktree from an existing branch or ref.',
        flags: [
          '-n, --name <slug>: worktree name',
          '-r, --ref <ref>: branch or ref to use without the picker',
          '--no-bootstrap: skip setup commands',
          '--open / --no-open: choose whether to open tools before entering',
          '--tool <command>: open one editor/app directly, such as cursor, code, or codex-app',
          '--no-enter: do not enter the worktree shell after checkout',
          '--exec <command>: run an explicit command after creation',
        ],
      },
      {
        command: 'yggtree wc [name] [ref]',
        description: 'Short alias for `worktree-checkout`.',
        flags: ['Accepts the same flags as `worktree-checkout`.'],
      },
      {
        command: 'yggtree create-multi',
        description: 'Create multiple official task worktrees when explicitly needed.',
        flags: ['--base <ref>: base ref', '--source <type>: local or remote', '--no-bootstrap: skip setup commands'],
      },
    ],
  },
  {
    title: 'Move around',
    commands: [
      {
        command: 'yggtree list',
        description: 'Show repo-linked worktrees, grouped by type, with state and activity.',
        flags: ['--open: switch from list output into the open-worktree flow'],
      },
      {
        command: 'yggtree open [worktree]',
        description: 'Open a worktree in an editor or supported desktop app.',
        flags: [
          '--tool <command>: use a specific editor/app such as cursor, code, zed, webstorm, or codex-app',
          '--enter: enter the worktree shell after opening',
        ],
      },
      {
        command: 'yggtree exec [worktree] -- <command>',
        description: 'Run a command inside a chosen worktree without entering it.',
        flags: ['Pass the command after `--`, for example `yggtree exec feat/api -- pnpm test`.'],
      },
      {
        command: 'yggtree path [worktree]',
        description: 'Print a `cd` command for a worktree.',
        flags: ['Useful for shell aliases and scripts that want to resolve the selected path.'],
      },
    ],
  },
  {
    title: 'Maintain realms',
    commands: [
      {
        command: 'yggtree bootstrap',
        description: 'Run the configured setup commands again in the current worktree.',
        flags: ['Reads `.yggtree/worktree-setup.json` when present, then falls back to default setup behavior.'],
      },
      {
        command: 'yggtree delete',
        description: 'Delete managed worktrees interactively.',
        flags: ['-a, --all: include linked worktrees outside `~/.yggtree`, excluding main/current safety cases'],
      },
      {
        command: 'yggtree prune',
        description: 'Clean stale Git worktree metadata.',
        flags: ['Use after manually deleting worktree folders or when Git reports stale entries.'],
      },
    ],
  },
  {
    title: 'Sandbox transfer',
    commands: [
      {
        command: 'yggtree create-sandbox',
        description: 'Create a local-only sandbox for experiments.',
        flags: [
          '-n, --name <name>: optional sandbox name',
          '--carry / --no-carry: choose whether to move uncommitted changes into the sandbox',
          '--no-bootstrap: skip setup commands',
          '--open / --no-open: choose whether to open an editor after creation',
          '--exec <command>: run an explicit command after creation',
        ],
      },
      {
        command: 'yggtree apply',
        description: 'Apply sandbox file changes back to the origin checkout.',
        flags: ['Run from inside the sandbox. Yggtree creates backups before overwriting origin files.'],
      },
      {
        command: 'yggtree unapply',
        description: 'Restore origin files from the sandbox backup.',
        flags: ['Only works while the sandbox and its backup metadata still exist.'],
      },
    ],
  },
];

const troubleshooting = [
  {
    problem: 'The branch already has a worktree.',
    answer: '`worktree-checkout` reuses the active worktree instead of creating a duplicate. Prunable or missing paths are ignored.',
  },
  {
    problem: 'You are outside a Git repo.',
    answer: '`wc` can fall back to a registered repo reference and ask which repo to use. Non-interactive flows stay conservative.',
  },
  {
    problem: 'The worktree needs project-specific setup.',
    answer: 'Put the setup commands in `.yggtree/worktree-setup.json` so every new realm runs the same bootstrap ritual.',
  },
  {
    problem: 'You need the old `enter` or `close` command.',
    answer: 'Those public commands were removed. Use `wc` for branch-to-shell work, `open --enter` for editor-plus-shell, and normal shell exit/delete flows when you are done.',
  },
];

export default function DocsPage() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '220px',
        } as CSSProperties
      }
    >
      <main className="min-h-screen w-full bg-deep-forest text-frost-white">
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
          <Sidebar collapsible="none" className="sticky top-8 h-auto w-auto bg-transparent text-parchment">
            <SidebarContent className="overflow-visible border-l border-gold-rune/20 bg-transparent pl-5">
              <SidebarGroup className="p-0">
                <SidebarGroupLabel className="mb-4 h-auto px-0 font-mono text-xs uppercase tracking-normal text-parchment/40">
                  Docs
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1.5">
                    {navItems.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          className="h-auto justify-start rounded-none border-0 bg-transparent px-0 py-1 font-body text-sm font-normal text-parchment/70 shadow-none hover:bg-transparent hover:text-gold-rune focus-visible:bg-transparent active:bg-transparent data-active:bg-transparent data-[active=true]:bg-transparent"
                        >
                          <a href={item.href}>{item.label}</a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </aside>

        <article className="min-w-0 max-w-4xl">
          <section id="start" className="pb-12 sm:pb-16">
            <p className="mb-4 font-mono text-sm text-gold-rune">Documentation</p>
            <h1 className="mb-5 font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              Use worktrees without losing the plot.
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-parchment/80 sm:text-xl">
              Yggtree is small enough to learn quickly, but it changes a habit that is easy to get wrong: switching
              contexts while work is already in motion. Install the CLI first, then pick the workflow that
              matches what you are trying to protect.
            </p>
            <div className="mt-8 grid max-w-2xl gap-4">
              <CommandBlock command="npm install -g yggtree" output="Install the CLI globally once." />
              <CommandBlock command="yggtree" output="Open the guided menu from any Git repository." />
              <p className="text-sm text-parchment/60">
                Prefer a one-off run? Use <code className="text-gold-rune">npx yggtree</code> without installing.
              </p>
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

          <section id="creation" className="border-t border-gold-rune/15 py-10 sm:py-14">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-semibold">Create a task worktree</h2>
              <p className="mt-3 max-w-3xl text-parchment/70">
                `create` is for work you expect to keep: a named branch, a reviewable diff, and a repeatable setup path.
                Let the prompts guide you when you are exploring. Pass flags when the workflow is already clear.
              </p>
            </div>
            <div className="grid gap-5">
              {creationExamples.map((example) => (
                <div key={example.command} className="min-w-0 border-l border-gold-rune/30 bg-mist-green/15 p-4 sm:p-5">
                  <h3 className="font-display text-xl font-semibold text-frost-white">{example.title}</h3>
                  <div className="mt-4">
                    <CommandBlock command={example.command} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-parchment/65">{example.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="navigation" className="border-t border-gold-rune/15 py-10 sm:py-14">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-semibold">Checkout and move between worktrees</h2>
              <p className="mt-3 max-w-3xl text-parchment/70">
                `wc` is the fastest path from &quot;I need that branch&quot; to &quot;I am in the right shell.&quot; It is designed to avoid
                stashing, preserve the current checkout, and reuse existing branch worktrees when possible.
              </p>
            </div>
            <div className="grid gap-5">
              {checkoutExamples.map((example) => (
                <div key={example.command} className="min-w-0 border-l border-gold-rune/30 bg-mist-green/15 p-4 sm:p-5">
                  <h3 className="font-display text-xl font-semibold text-frost-white">{example.title}</h3>
                  <div className="mt-4">
                    <CommandBlock command={example.command} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-parchment/65">{example.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="sandbox" className="border-t border-gold-rune/15 py-10 sm:py-14">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-semibold">Use sandboxes for risky edits</h2>
              <p className="mt-3 max-w-3xl text-parchment/70">
                Sandboxes are local-only worktrees for experiments, refactors, and trial runs. They are useful when the
                idea may be thrown away, but you still want a clean path to apply the result back.
              </p>
            </div>
            <div className="grid gap-5">
              {sandboxExamples.map((example) => (
                <div key={example.command} className="min-w-0 border-l border-gold-rune/30 bg-mist-green/15 p-4 sm:p-5">
                  <h3 className="font-display text-xl font-semibold text-frost-white">{example.title}</h3>
                  <div className="mt-4">
                    <CommandBlock command={example.command} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-parchment/65">{example.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="commands" className="border-t border-gold-rune/15 py-10 sm:py-14">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-semibold">Command reference</h2>
              <p className="mt-3 text-parchment/70">
                Every worktree command is available directly at the top level. `yggtree wt ...` remains as a compatibility
                alias for older scripts.
              </p>
            </div>
            <div className="grid gap-5">
              {commandGroups.map((group) => (
                <div key={group.title} className="min-w-0 rounded-lg border border-gold-rune/15 bg-deep-forest/50 p-4 sm:p-5">
                  <h3 className="mb-4 font-display text-xl font-semibold text-gold-rune">{group.title}</h3>
                  <div className="space-y-4">
                    {group.commands.map((item) => (
                      <div key={item.command} className="min-w-0 border-t border-gold-rune/10 pt-4 first:border-t-0 first:pt-0">
                        <code className="block max-w-full whitespace-normal break-words font-mono text-sm text-frost-white sm:scrollbar-none sm:overflow-x-auto sm:whitespace-nowrap sm:pb-1">
                          {item.command}
                        </code>
                        <p className="mt-1 text-sm text-parchment/65">{item.description}</p>
                        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-parchment/55">
                          {item.flags.map((flag) => (
                            <li key={flag}>{flag}</li>
                          ))}
                        </ul>
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
              <p className="mt-4 text-sm leading-relaxed text-parchment/65">
                Bootstrap runs after worktree creation unless you pass `--no-bootstrap`. The same config is used by
                `create`, `worktree-checkout`, `wc`, `create-multi`, and `create-sandbox`.
              </p>
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
              <p className="rounded-lg border border-gold-rune/15 bg-mist-green/20 p-5 text-parchment/75">
                Use `delete --all` carefully. It can include linked worktrees outside `~/.yggtree`, while still protecting
                the main and current worktree.
              </p>
            </div>
          </section>

          <section id="troubleshooting" className="border-t border-gold-rune/15 py-10 sm:py-14">
            <h2 className="font-display text-3xl font-semibold">Troubleshooting</h2>
            <div className="mt-6 grid gap-4">
              {troubleshooting.map((item) => (
                <div key={item.problem} className="rounded-lg border border-gold-rune/15 bg-mist-green/20 p-5">
                  <h3 className="font-display text-xl font-semibold text-frost-white">{item.problem}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-parchment/70">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </article>
      </div>
      </main>
    </SidebarProvider>
  );
}
