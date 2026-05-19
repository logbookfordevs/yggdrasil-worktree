# Create Task Worktree

Use `create` when the user is starting a brand-new official task that should
live in an isolated, branch-backed worktree.

## Setup

`create` makes a new branch, creates a worktree under
`~/.yggtree/<repo>/<slug>`, and tries to publish that branch to `origin`.

```bash
yggtree create feat/new-checkout-flow --base main --source remote --no-open
```

## Core Patterns

Start from the remote default branch:

```bash
yggtree create feat/new-checkout-flow --base main --source remote
```

Start from a local-only base branch:

```bash
yggtree create feat/follow-up-fix --base feat/current-local-branch --source local
```

Create the worktree without opening a tool:

```bash
yggtree create feat/background-task --base main --source remote --no-open
```

Prefer single-worktree creation unless the user explicitly asks for multiple
parallel task worktrees.

## Common Mistakes

### HIGH Using `create` for a throwaway experiment

Wrong:

```bash
yggtree create feat/try-two-approaches --base main --source remote
```

Correct:

```bash
yggtree create-sandbox
```

`create` is the official-branch workflow and attempts `git push -u origin
HEAD`, so disposable local experimentation belongs in a sandbox.

Source: `src/commands/wt/create-branch.ts`

### HIGH Treating an existing branch as if it were new

Wrong:

```bash
yggtree create feat/existing-branch --base main --source remote
```

Correct:

```bash
yggtree worktree-checkout --ref feat/existing-branch
```

If the branch already exists, `create` attaches to that branch instead of
creating a fresh one from the requested base ref.

Source: `src/commands/wt/create-branch.ts`

### HIGH Picking the wrong base-source mode

Wrong:

```bash
yggtree create feat/new-ui --base my-local-base --source remote
```

Correct:

```bash
yggtree create feat/new-ui --base my-local-base --source local
```

Remote mode prepends `origin/` when needed, so a local-only base branch fails
verification if it is treated as remote.

Source: `src/commands/wt/create-branch.ts`

### MEDIUM Using `create-multi` without explicit user intent

Wrong:

```bash
yggtree create-multi --base main
```

Correct:

```bash
yggtree create feat/single-task --base main --source remote
```

`create-multi` creates multiple official worktrees and branches; use it only
when the user explicitly asks for multi-task creation.

Source: `src/commands/wt/create-multi.ts`
