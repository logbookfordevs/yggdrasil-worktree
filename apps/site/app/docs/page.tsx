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
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '#start', label: 'Start' },
  { href: '#workflows', label: 'Choose Workflow' },
  { href: '#agents', label: 'Agents' },
  { href: '#creation', label: 'Create Worktrees' },
  { href: '#navigation', label: 'Navigate' },
  { href: '#tools', label: 'Open Tools' },
  { href: '#sandbox', label: 'Sandbox' },
  { href: '#commands', label: 'Commands' },
  { href: '#configuration', label: 'Configuration' },
  { href: '#safety', label: 'Safety' },
  { href: '#troubleshooting', label: 'Troubleshooting' },
];

type CommandFlag = {
  term: string;
  description: string;
};

type WorkflowChoice = {
  href: string;
  title: string;
  when: string;
  command: string;
  result: string;
};

const flag = (term: string, description: string): CommandFlag => ({ term, description });

const monoFaceClass = 'ygg-mono';
const kickerClass = `${monoFaceClass} text-[0.8125rem] font-medium leading-5 text-gold-rune`;
const sectionTitleClass =
  'font-display text-[clamp(1.75rem,1vw+1.35rem,2.35rem)] font-semibold leading-[1.1] tracking-[-0.006em] [text-wrap:balance]';
const sectionIntroClass = 'mt-3 max-w-[72ch] text-[1.0625rem] leading-8 text-parchment/78 [text-wrap:pretty]';
const exampleTitleClass =
  'font-display text-[clamp(1.25rem,0.35vw+1.12rem,1.45rem)] font-semibold leading-[1.16] text-frost-white [text-wrap:balance]';
const bodyPanelClass = 'text-base leading-7 text-parchment/78 [text-wrap:pretty]';
const noteClass = 'max-w-[74ch] text-[0.9375rem] leading-6 text-parchment/68 [text-wrap:pretty]';
const referenceHeadingClass =
  'mb-4 font-display text-[clamp(1.25rem,0.45vw+1.08rem,1.5rem)] font-semibold leading-[1.14] text-frost-white [text-wrap:balance]';
const commandCodeClass = `block max-w-full whitespace-normal break-words ${monoFaceClass} text-[0.875rem] leading-6 text-frost-white sm:scrollbar-none sm:overflow-x-auto sm:whitespace-nowrap sm:pb-1`;
const flagTermClass = `${monoFaceClass} text-[0.8125rem] font-medium leading-6 text-gold-rune/95`;
const flagDescriptionClass = 'text-[0.9375rem] leading-6 text-parchment/70 [text-wrap:pretty]';
const sectionClass = 'border-t border-gold-rune/12 py-14';
const exampleShellClass =
  'min-w-0 rounded-lg border border-gold-rune/16 bg-mist-green/16 p-4 transition-colors hover:border-gold-rune/28 hover:bg-mist-green/22 sm:p-5';
const referenceShellClass = 'min-w-0 rounded-lg border border-gold-rune/14 bg-deep-forest/45 p-4 sm:p-5';

const workflowChoices: WorkflowChoice[] = [
  {
    href: '#creation',
    title: 'Start planned work',
    when: 'You need a named branch, reviewable history, and normal setup.',
    command: 'yggtree create',
    result: 'Creates a managed task worktree.',
  },
  {
    href: '#navigation',
    title: 'Jump to a branch',
    when: 'You were interrupted and do not want to stash current edits.',
    command: 'yggtree wc',
    result: 'Reuses or creates the checkout, then enters the shell.',
  },
  {
    href: '#sandbox',
    title: 'Try risky edits',
    when: 'You want an experiment that may be discarded.',
    command: 'yggtree create-sandbox',
    result: 'Keeps the idea local until you apply it back.',
  },
];

const agentExamples = [
  {
    title: 'Install the full skill pack',
    command: 'npx skills add logbookfordevs/yggdrasil-worktree',
    detail:
      'Adds the consolidated Yggtree skill plus its focused references for worktree creation, checkout, lifecycle, and sandbox workflows.',
  },
  {
    title: 'Install the Yggtree skill only',
    command: 'npx skills add logbookfordevs/yggdrasil-worktree --skill yggtree',
    detail:
      'Use this when your agent runtime supports targeted skill installs and you want the compact Yggtree workflow guide.',
  },
  {
    title: 'Target Codex directly',
    command: 'npx skills add logbookfordevs/yggdrasil-worktree --agent codex',
    detail: 'Useful for Codex setups that support agent-specific skill installation.',
  },
];

const creationExamples = [
  {
    title: 'Create from the default interactive flow',
    command: 'yggtree create',
    detail:
      'Yggtree asks for the branch, base ref, optional local env-file copy, bootstrap preference, and whether to open an editor before entering the new worktree shell.',
  },
  {
    title: 'Create a named branch from a known base',
    command: 'yggtree create feat/invoice-export --base main --source remote',
    detail: 'Use this for reviewable task work when you already know the branch name.',
  },
  {
    title: 'Create and return without setup or editor launch',
    command: 'yggtree create feat/docs-pass --no-bootstrap --no-open --no-enter',
    detail: 'Useful for automation or when you want to inspect the worktree path before installing dependencies.',
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
    title: 'Open a terminal target after checkout',
    command: 'yggtree wc hotfix-auth main --tool tmux',
    detail:
      '`--tool` accepts editors, apps, and terminal targets such as `codex-app`, `cmux`, or `tmux`, then enters the worktree shell unless `--no-enter` is set.',
  },
  {
    title: 'Open one target but stay in the current shell',
    command: 'yggtree wc hotfix-auth main --open --no-enter',
    detail:
      'Use this when the command should prepare a worktree, run one open action, and return. The picker is single-select, so Enter chooses the highlighted editor, app, terminal target, or `Other command...`.',
  },
];

const openExamples = [
  {
    title: 'Pick a worktree and open tools',
    command: 'yggtree open',
    detail:
      'Pick from a type-to-filter worktree list, then choose one detected editor, app, or terminal target. Yggtree detects common tools such as Cursor, VS Code, Zed, WebStorm, Codex App, Cmux, and Tmux.',
  },
  {
    title: 'Open Codex App directly',
    command: 'yggtree open feat/new-ui --tool codex-app',
    detail: '`--tool` skips the picker. Codex App can be addressed as `codex` or `codex-app` when it is detected.',
  },
  {
    title: 'Open a terminal target directly',
    command: 'yggtree open feat/new-ui --tool cmux',
    detail: '`--tool cmux` or `--tool tmux` opens the worktree in that terminal target without showing the picker.',
  },
  {
    title: 'Open tools and continue in the shell',
    command: 'yggtree open feat/new-ui --tool code --enter',
    detail: '`open` returns by default. Add `--enter` when opening should continue into the worktree shell.',
  },
  {
    title: 'Open from the worktree list',
    command: 'yggtree list --open',
    detail: 'Switches the list command into the same pick-and-open flow without printing the table first.',
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
        description:
          'Create a branch-backed task worktree, then enter its shell by default. Interactive creation asks whether to open an editor first, while `--exec` remains the explicit startup-command override.',
        flags: [
          flag('-b, --branch <name>', 'Branch name when not passed positionally.'),
          flag('--base <ref>', 'Base ref such as main.'),
          flag('--source <type>', 'Choose local or remote base source.'),
          flag('--no-bootstrap', 'Skip setup commands.'),
          flag('--open / --no-open', 'Choose whether to open an editor after creation.'),
          flag('--enter / --no-enter', 'Choose whether to enter the worktree shell after creation.'),
          flag('--exec <command>', 'Run an explicit command after creation.'),
        ],
      },
      {
        command: 'yggtree worktree-checkout [name] [ref]',
        description:
          'Create or reuse a checkout-style worktree from an existing branch or ref. The picker shows local and `origin/*` choices separately, creates local branches for remote-only refs, reuses active worktrees, and enters the shell by default.',
        flags: [
          flag('-n, --name <slug>', 'Worktree name.'),
          flag('-r, --ref <ref>', 'Branch or ref to use without the picker.'),
          flag('--no-bootstrap', 'Skip setup commands.'),
          flag('--open / --no-open', 'Choose whether to open tools before entering.'),
          flag(
            '--tool <command>',
            'Open one editor, app, or terminal target directly, such as cursor, code, codex-app, cmux, or tmux.'
          ),
          flag('--no-enter', 'Do not enter the worktree shell after checkout.'),
          flag('--exec <command>', 'Run an explicit command after creation.'),
        ],
      },
      {
        command: 'yggtree wc [name] [ref]',
        description: 'Short alias for `worktree-checkout`.',
        flags: [flag('Same flags', 'Accepts the same flags as `worktree-checkout`.')],
      },
      {
        command: 'yggtree create-multi',
        description: 'Create multiple official task worktrees when explicitly needed.',
        flags: [
          flag('--base <ref>', 'Base ref.'),
          flag('--source <type>', 'Local or remote.'),
          flag('--no-bootstrap', 'Skip setup commands.'),
        ],
      },
    ],
  },
  {
    title: 'Move around',
    commands: [
      {
        command: 'yggtree list',
        description:
          'Show repo-linked worktrees grouped by `MAIN`, `MANAGED`, `LINKED`, and `SANDBOX`, with clean/dirty state, last activity, branch, and an optional PR column when GitHub CLI is available.',
        flags: [flag('--open', 'Switch from list output into the open-worktree flow.')],
      },
      {
        command: 'yggtree open [worktree]',
        description:
          'Open a worktree in an editor, supported desktop app, or terminal target. Without a worktree argument, pick from a type-to-filter list. The interactive picker chooses one action; the command returns by default.',
        flags: [
          flag(
            '--tool <command>',
            'Use a specific editor, app, or terminal target such as cursor, code, zed, webstorm, codex-app, cmux, or tmux.'
          ),
          flag('--enter', 'Enter the worktree shell after opening.'),
        ],
      },
      {
        command: 'yggtree exec [worktree] -- <command>',
        description: 'Run a command inside a chosen worktree without entering it.',
        flags: [
          flag('Command separator', 'Pass the command after `--`, for example `yggtree exec feat/api -- pnpm test`.'),
        ],
      },
      {
        command: 'yggtree path [worktree]',
        description: 'Print a `cd` command for a worktree.',
        flags: [flag('Output', 'Useful for shell aliases and scripts that want to resolve the selected path.')],
      },
    ],
  },
  {
    title: 'Maintain realms',
    commands: [
      {
        command: 'yggtree bootstrap',
        description: 'Run the configured setup commands again in the current worktree.',
        flags: [
          flag(
            'Config source',
            'Reads `.yggtree/worktree-setup.json` when present, then falls back to default setup behavior.'
          ),
        ],
      },
      {
        command: 'yggtree delete',
        description: 'Delete managed worktrees interactively.',
        flags: [
          flag('-a, --all', 'Include linked worktrees outside `~/.yggtree`, excluding main and current safety cases.'),
        ],
      },
      {
        command: 'yggtree prune',
        description: 'Clean stale Git worktree metadata.',
        flags: [flag('When to use', 'Use after manually deleting worktree folders or when Git reports stale entries.')],
      },
    ],
  },
  {
    title: 'Sandbox transfer',
    commands: [
      {
        command: 'yggtree create-sandbox',
        description:
          'Create a local-only sandbox for experiments. The interactive flow can name it, carry staged/unstaged/untracked edits, and ask whether to open an editor after creation.',
        flags: [
          flag('-n, --name <name>', 'Optional sandbox name.'),
          flag('--carry / --no-carry', 'Choose whether to move uncommitted changes into the sandbox.'),
          flag('--no-bootstrap', 'Skip setup commands.'),
          flag('--open / --no-open', 'Choose whether to open an editor after creation.'),
          flag('--exec <command>', 'Run an explicit command after creation.'),
        ],
      },
      {
        command: 'yggtree apply',
        description:
          'Apply sandbox file changes back to the origin checkout, backing up overwritten files and offering to delete the sandbox afterward.',
        flags: [
          flag('Run location', 'Run from inside the sandbox. Yggtree creates backups before overwriting origin files.'),
        ],
      },
      {
        command: 'yggtree unapply',
        description: 'Restore origin files from the sandbox backup created by `apply`.',
        flags: [flag('Constraint', 'Only works while the sandbox and its backup metadata still exist.')],
      },
    ],
  },
];

const troubleshooting = [
  {
    problem: 'The branch already has a worktree.',
    answer:
      '`worktree-checkout` reuses the active worktree instead of creating a duplicate. Prunable or missing paths are ignored.',
  },
  {
    problem: 'You are outside a Git repo.',
    answer:
      '`wc` can fall back to a registered repo reference and ask which repo to use. Non-interactive flows stay conservative.',
  },
  {
    problem: 'The worktree needs project-specific setup.',
    answer:
      'Put the setup commands in `.yggtree/worktree-setup.json` so every new realm runs the same bootstrap ritual.',
  },
  {
    problem: 'You need the old `enter` or `close` command.',
    answer:
      'Those public commands were removed. Use `wc` for branch-to-shell work, `open --enter` for editor-plus-shell, and normal shell exit/delete flows when you are done.',
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
      <main className="ygg-body min-h-screen w-full bg-deep-forest text-frost-white">
        <div className="border-b border-gold-rune/16 bg-deep-forest/96">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 md:px-12">
            <div className="flex min-w-0 items-center gap-3">
              <DocsMobileMenu items={navItems} />
              <Link
                href="/"
                className="flex min-h-11 items-center truncate font-display text-base font-bold text-gold-rune sm:text-xl"
              >
                Yggdrasil Worktree
              </Link>
            </div>
            <nav className="flex shrink-0 items-center gap-3 text-sm text-parchment/70 sm:gap-5">
              <Link
                href="/"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-sm px-1 hover:text-gold-rune focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-rune/55"
              >
                Home
              </Link>
              <a
                href="https://github.com/logbookfordevs/yggdrasil-worktree"
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-sm px-1 hover:text-gold-rune focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-rune/55"
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[96rem] gap-7 px-4 py-10 sm:px-6 md:px-10 md:py-10 lg:grid-cols-[220px_minmax(0,1fr)] xl:px-12 xl:pb-12">
          <aside className="hidden lg:block">
            <Sidebar collapsible="none" className="sticky top-8 h-auto w-auto bg-transparent text-parchment">
              <SidebarContent className="overflow-visible border-l border-gold-rune/16 bg-transparent pl-5">
                <SidebarGroup className="p-0">
                  <SidebarGroupLabel className="mb-4 h-auto px-0 font-mono text-xs tracking-normal text-parchment/42">
                    Docs
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-1.5">
                      {navItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <a
                            href={item.href}
                            className="-mx-1 flex min-h-11 items-center rounded-sm px-1 font-body text-sm font-normal leading-6 text-parchment/70 transition-colors hover:text-gold-rune focus-visible:text-gold-rune focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-rune/55"
                          >
                            {item.label}
                          </a>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
          </aside>

          <article className="min-w-0 max-w-none">
            <section id="start" className="pb-14">
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,30rem)] xl:items-start">
                <div className="min-w-0">
                  <p className={`mb-4 ${kickerClass}`}>Documentation</p>
                  <h1 className="mb-6 max-w-[14ch] font-display text-[clamp(2.35rem,2.35vw+1.28rem,4.05rem)] font-bold leading-[1.04] tracking-[-0.014em] [text-wrap:balance]">
                    Use worktrees without losing the plot.
                  </h1>
                  <p className="max-w-[62ch] text-[1.125rem] leading-8 text-parchment/84 sm:text-[1.22rem] sm:leading-9 [text-wrap:pretty]">
                    Yggtree helps you move to the right Git checkout without disturbing the work already in motion.
                    Install the CLI, then choose the workflow that matches what you need to protect.
                  </p>
                  <div className="mt-8 grid max-w-3xl gap-4">
                    <CommandBlock command="npm install -g yggtree" output="Install the CLI globally once." />
                    <CommandBlock
                      command="yggtree"
                      output="Open the guided menu from any Git repository. If your global install is behind npm, the menu points you to the update command."
                    />
                    <p className={noteClass}>
                      Prefer a one-off run? Use{' '}
                      <code className={`${monoFaceClass} text-[0.875rem] text-gold-rune`}>npx yggtree</code> without
                      installing.
                    </p>
                  </div>
                </div>

                <section
                  id="workflows"
                  aria-labelledby="workflows-heading"
                  className="min-w-0 scroll-mt-8 rounded-lg border border-gold-rune/18 bg-mist-green/14 p-4 sm:p-5"
                >
                  <h2
                    id="workflows-heading"
                    className="font-display text-[clamp(1.25rem,0.45vw+1.08rem,1.6rem)] font-semibold leading-[1.14] tracking-[-0.004em] text-frost-white [text-wrap:balance]"
                  >
                    Choose what to protect.
                  </h2>
                  <p className={`mt-2 ${noteClass}`}>
                    Start with the state you need to keep safe, then jump to the deeper command section when you need
                    flags.
                  </p>
                  <div className="mt-5 grid gap-3">
                    {workflowChoices.map((choice) => (
                      <a
                        key={choice.href}
                        href={choice.href}
                        className="group block rounded-md border border-gold-rune/12 bg-deep-forest/42 p-4 transition-colors hover:border-gold-rune/34 hover:bg-deep-forest/62 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-rune/55"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <h3 className={exampleTitleClass}>{choice.title}</h3>
                          <code className={`${monoFaceClass} text-[0.8125rem] leading-6 text-gold-rune`}>
                            {choice.command}
                          </code>
                        </div>
                        <p className={`mt-2 ${noteClass}`}>{choice.when}</p>
                        <p className="mt-3 text-[0.875rem] leading-6 text-parchment/74">{choice.result}</p>
                      </a>
                    ))}
                  </div>
                </section>
              </div>
            </section>

            <section id="agents" className={sectionClass}>
              <div className="mb-8">
                <h2 className={sectionTitleClass}>Use Yggtree from agent workflows</h2>
                <p className={sectionIntroClass}>
                  The consolidated Yggtree skill helps agents choose the right worktree workflow before loading the
                  smallest reference they need: create a task worktree, branch off without stashing, manage a realm, or
                  run a sandbox experiment.
                </p>
              </div>
              <div className="grid gap-5">
                {agentExamples.map((example) => (
                  <div key={example.command} className={exampleShellClass}>
                    <h3 className={exampleTitleClass}>{example.title}</h3>
                    <div className="mt-4">
                      <CommandBlock command={example.command} />
                    </div>
                    <p className={`mt-3 ${noteClass}`}>{example.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="creation" className={sectionClass}>
              <div className="mb-8">
                <h2 className={sectionTitleClass}>Create a task worktree</h2>
                <p className={sectionIntroClass}>
                  <code className={`${monoFaceClass} text-sm text-gold-rune`}>create</code> is for work you expect to
                  keep: a named branch, a reviewable diff, and a repeatable setup path. Let the prompts guide you when
                  you are exploring. Pass flags when the workflow is already clear.
                </p>
              </div>
              <div className="grid gap-5">
                {creationExamples.map((example) => (
                  <div key={example.command} className={exampleShellClass}>
                    <h3 className={exampleTitleClass}>{example.title}</h3>
                    <div className="mt-4">
                      <CommandBlock command={example.command} />
                    </div>
                    <p className={`mt-3 ${noteClass}`}>{example.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="navigation" className={sectionClass}>
              <div className="mb-8">
                <h2 className={sectionTitleClass}>Checkout and move between worktrees</h2>
                <p className={sectionIntroClass}>
                  <code className={`${monoFaceClass} text-sm text-gold-rune`}>wc</code> is the fastest path from &quot;I
                  need that branch&quot; to &quot;I am in the right shell.&quot; It is designed to avoid stashing,
                  preserve the current checkout, and reuse existing branch worktrees when possible.
                </p>
              </div>
              <div className="grid gap-5">
                {checkoutExamples.map((example) => (
                  <div key={example.command} className={exampleShellClass}>
                    <h3 className={exampleTitleClass}>{example.title}</h3>
                    <div className="mt-4">
                      <CommandBlock command={example.command} />
                    </div>
                    <p className={`mt-3 ${noteClass}`}>{example.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="tools" className={sectionClass}>
              <div className="mb-8">
                <h2 className={sectionTitleClass}>Open worktrees in editors, apps, and terminals</h2>
                <p className={sectionIntroClass}>
                  Opening targets is separate from creating or checking out a worktree. Use{' '}
                  <code className={`${monoFaceClass} text-sm text-gold-rune`}>open</code> when you want to launch
                  an editor, app, Cmux panel, or Tmux session and return. Use{' '}
                  <code className={`${monoFaceClass} text-sm text-gold-rune`}>wc --open</code> when you want the
                  checkout flow to offer one open action before entering the worktree shell.
                </p>
              </div>
              <div className="grid gap-5">
                {openExamples.map((example) => (
                  <div key={example.command} className={exampleShellClass}>
                    <h3 className={exampleTitleClass}>{example.title}</h3>
                    <div className="mt-4">
                      <CommandBlock command={example.command} />
                    </div>
                    <p className={`mt-3 ${noteClass}`}>{example.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="sandbox" className={sectionClass}>
              <div className="mb-8">
                <h2 className={sectionTitleClass}>Use sandboxes for risky edits</h2>
                <p className={sectionIntroClass}>
                  Sandboxes are local-only worktrees for experiments, refactors, and trial runs. They are useful when
                  the idea may be thrown away, but you still want a clean path to apply the result back.
                </p>
              </div>
              <div className="grid gap-5">
                {sandboxExamples.map((example) => (
                  <div key={example.command} className={exampleShellClass}>
                    <h3 className={exampleTitleClass}>{example.title}</h3>
                    <div className="mt-4">
                      <CommandBlock command={example.command} />
                    </div>
                    <p className={`mt-3 ${noteClass}`}>{example.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="commands" className={sectionClass}>
              <div className="mb-8">
                <h2 className={sectionTitleClass}>Command reference</h2>
                <p className={sectionIntroClass}>
                  Every worktree command is available directly at the top level.{' '}
                  <code className={`${monoFaceClass} text-sm text-gold-rune`}>yggtree wt ...</code> remains as a
                  compatibility alias.
                </p>
              </div>
              <div className="grid gap-5">
                {commandGroups.map((group) => (
                  <div key={group.title} className={referenceShellClass}>
                    <h3 className={referenceHeadingClass}>{group.title}</h3>
                    <div className="space-y-4">
                      {group.commands.map((item) => (
                        <div
                          key={item.command}
                          className="min-w-0 border-t border-gold-rune/10 pt-4 first:border-t-0 first:pt-0"
                        >
                          <code className={commandCodeClass}>{item.command}</code>
                          <p className={`mt-1 ${noteClass}`}>{item.description}</p>
                          <ul className="mt-3 grid gap-2 text-sm leading-6">
                            {item.flags.map((flag) => (
                              <li
                                key={`${item.command}-${flag.term}`}
                                className="grid gap-1 border-t border-gold-rune/10 pt-2 first:border-t-0 first:pt-0 sm:grid-cols-[minmax(10rem,14rem)_1fr] sm:gap-4"
                              >
                                <code className={flagTermClass}>{flag.term}</code>
                                <span className={flagDescriptionClass}>{flag.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="configuration" className={sectionClass}>
              <h2 className={sectionTitleClass}>Configuration</h2>
              <p className={sectionIntroClass}>
                If a repository needs something other than the fallback{' '}
                <code className={`${monoFaceClass} text-sm text-gold-rune`}>npm install</code>, define setup commands
                once and let every new worktree inherit them. When local env files such as{' '}
                <code className={`${monoFaceClass} text-sm text-gold-rune`}>.env</code> or{' '}
                <code className={`${monoFaceClass} text-sm text-gold-rune`}>.env.local</code> exist, interactive
                creation flows offer to copy them into the new worktree. Example and template env files are skipped, and
                CI or other non-interactive runs skip the prompt entirely.
              </p>
              <div className={`mt-6 ${referenceShellClass}`}>
                <p className={`scrollbar-none mb-4 overflow-x-auto whitespace-nowrap ${kickerClass}`}>
                  .yggtree/worktree-setup.json
                </p>
                <pre className="scrollbar-none overflow-x-auto rounded-md border border-gold-rune/10 bg-deep-forest/82 p-4 font-mono text-[0.8125rem] leading-6 text-frost-white sm:p-5 sm:text-[0.875rem]">
                  <code>{`{
          "setup-worktree": [
            "pnpm install",
            "git submodule sync --recursive",
            "git submodule update --init --recursive"
          ]
        }`}</code>
                </pre>
                <p className={`mt-4 ${noteClass}`}>
                  Bootstrap runs after worktree creation unless you pass `--no-bootstrap`. The same config is used by
                  `create`, `worktree-checkout`, `wc`, `create-multi`, and `create-sandbox`.
                </p>
              </div>
            </section>

            <section id="safety" className={sectionClass}>
              <h2 className={sectionTitleClass}>Safety notes</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <p className={`rounded-lg border border-gold-rune/14 bg-mist-green/16 p-5 ${bodyPanelClass}`}>
                  Use <code className={`${monoFaceClass} text-sm text-gold-rune`}>create</code> for task branches. Use{' '}
                  <code className={`${monoFaceClass} text-sm text-gold-rune`}>create-sandbox</code> for disposable
                  alternatives.
                </p>
                <p className={`rounded-lg border border-gold-rune/14 bg-mist-green/16 p-5 ${bodyPanelClass}`}>
                  Run <code className={`${monoFaceClass} text-sm text-gold-rune`}>unapply</code> before deleting a
                  sandbox if you may need to undo changes applied back to the origin.
                </p>
                <p className={`rounded-lg border border-gold-rune/14 bg-mist-green/16 p-5 ${bodyPanelClass}`}>
                  Prefer <code className={`${monoFaceClass} text-sm text-gold-rune`}>worktree-checkout</code> over stash
                  when the current checkout contains work you do not want to disturb.
                </p>
                <p className={`rounded-lg border border-gold-rune/14 bg-mist-green/16 p-5 ${bodyPanelClass}`}>
                  Use <code className={`${monoFaceClass} text-sm text-gold-rune`}>delete --all</code> carefully. It can
                  include linked worktrees outside{' '}
                  <code className={`${monoFaceClass} text-sm text-gold-rune`}>~/.yggtree</code>, while still protecting
                  the main and current worktree.
                </p>
              </div>
            </section>

            <section id="troubleshooting" className={sectionClass}>
              <h2 className={sectionTitleClass}>Troubleshooting</h2>
              <div className="mt-6 grid gap-4">
                {troubleshooting.map((item) => (
                  <div key={item.problem} className={exampleShellClass}>
                    <h3 className={exampleTitleClass}>{item.problem}</h3>
                    <p className={`mt-2 ${noteClass}`}>{item.answer}</p>
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
