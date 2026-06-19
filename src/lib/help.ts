export const intentRouterHelp = `
Choose by intent:
  New official task branch      yggtree create feat/name --base main --source remote
  Existing branch/interruption  yggtree wc --ref branch-name
  Continue dirty current work   yggtree handoff --name task-name
  Disposable local experiment   yggtree create-sandbox
  Copy sandbox files to origin  yggtree apply   # from inside sandbox, not a Git merge
  Bulk official worktrees       yggtree create-multi
  Agent-native path layout      yggtree config use claude   # or codex
  Delete without prompts        yggtree delete branch-name --yes

More detail: run yggtree help <command>, for example yggtree help handoff.
`;

const agentPathTip = `
Agent-native paths:
  Add --config claude for Claude Code's repo-local .claude/worktrees layout.
  Add --config codex for Codex's ~/.codex/worktrees layout.
`;

export const createHelp = `
Behavior:
  Creates an official branch-backed worktree, publishes the branch to origin, and enters the shell by default.
  Use for real task branches. For disposable experiments, use create-sandbox.

${agentPathTip}

Examples:
  yggtree create feat/new-flow --base main --source remote
  yggtree create feat/background-task --base main --source remote --no-open --no-enter
  yggtree create feat/claude-layout --base main --source remote --config claude
`;

export const createMultiHelp = `
Behavior:
  Bulk-creates official branch-backed worktrees.
  This does not share create's open/enter/exec lifecycle. Use create for one task branch.

${agentPathTip}

Example:
  yggtree create-multi --base main --source remote
  yggtree create-multi --base main --source remote --config codex
`;

export const checkoutHelp = `
Behavior:
  Creates or reuses a worktree for an existing branch or ref without disturbing current work.
  Use for interruptions and branch review. Use create for a new official task branch.
  Enters the worktree shell by default; add --no-enter when automation should return.

${agentPathTip}

Examples:
  yggtree wc --ref hotfix/payment-timeout
  yggtree wc --ref main --name fresh-main --no-open --no-enter
  yggtree wc --ref main --name fresh-main --config yggtree
`;

export const openHelp = `
Behavior:
  Opens an existing worktree in an editor, desktop app, or terminal target.
  Returns by default after opening. Add --enter only when the shell should continue inside the worktree.

Examples:
  yggtree open my-feature --tool cursor
  yggtree open my-feature --tool codex-app
  yggtree list --open
`;

export const deleteHelp = `
Behavior:
  Deletes selected worktrees. Main and current worktrees are always protected.
  Without arguments, delete stays interactive. For automation, pass explicit targets and --yes.
  Add --all only when the target is outside Yggtree's managed root and appears as LINKED in list.

Examples:
  yggtree delete my-feature --yes
  yggtree delete my-feature other-feature --yes
  yggtree delete --all --yes
  yggtree delete external-feature --all --yes
`;

export const createSandboxHelp = `
Behavior:
  Creates a local-only disposable experiment from the current branch.
  For continuing current dirty work, prefer handoff instead of teaching create-sandbox --carry.

${agentPathTip}

Examples:
  yggtree create-sandbox
  yggtree create-sandbox --name ui-option-a --no-open
  yggtree create-sandbox --name claude-scratch --config claude

Related:
  handoff carries current dirty work into a named sandbox.
  apply copies changed sandbox files back to origin.
`;

export const handoffHelp = `
Behavior:
  Carry staged, unstaged, and untracked work into a named sandbox so you can continue there.
  The origin checkout is not cleaned; review or reset it separately if needed.

${agentPathTip}

Example:
  yggtree handoff --name continue-auth-refactor
  yggtree handoff --name continue-auth-refactor --config codex

Related:
  create-sandbox starts a disposable local experiment.
  apply copies changed sandbox files back to origin.
`;

export const applyHelp = `
Behavior:
  Copies changed files from the current sandbox back to the origin checkout.
  Stores backups in sandbox metadata before overwriting origin files.
  Not a Git merge, rebase, patch, or cherry-pick. Review the origin diff afterward.

Example:
  yggtree apply

Related:
  unapply restores from the sandbox backup metadata while the sandbox still exists.
`;

export const unapplyHelp = `
Behavior:
  Restores origin files from sandbox metadata created by apply.
  Only works while the sandbox still exists.

Example:
  yggtree unapply
`;
