# Branch Off Without Stashing

Use `worktree-checkout` or its short alias `wc` when the user does not want a
brand-new branch. This workflow preserves the current realm exactly as-is and
opens a separate worktree for an existing branch or ref.

```bash
yggtree wc --ref main --no-open
```

## Core Patterns

Leave current work alone and jump into another branch:

```bash
yggtree wc --ref hotfix/payment-timeout
```

By default, checkout enters the worktree shell after checkout/opening. Add
`--no-enter` when automation should create or reuse the worktree and then
return to the caller:

```bash
yggtree wc --ref hotfix/payment-timeout --no-open --no-enter
```

Branch off cleanly from a base branch without stash pressure:

```bash
yggtree wc --ref main --name fresh-main
```

Checkout and open a specific editor/app without the open prompt:

```bash
yggtree wc --ref main --name fresh-main --tool codex-app
```

When local `.env` files exist, interactive checkout can offer to copy them into
the new worktree before bootstrap. Treat that as opt-in local state, and avoid it
for scripted runs unless the user explicitly asks to carry environment files.

Reuse an existing worktree if the branch is already active, including linked
worktrees outside `~/.yggtree`:

```bash
yggtree list
yggtree open main
```

Use `list --open` when the user wants to pick a worktree and launch an editor/app
from the list flow:

```bash
yggtree list --open
```

## Common Mistakes

### HIGH Reaching for stash when the workflow wants a new realm

Wrong:

```bash
git stash
git checkout hotfix/payment-timeout
```

Correct:

```bash
yggtree wc --ref hotfix/payment-timeout
```

The point of this flow is to preserve current in-progress work without stash
pressure or rushed commits.

Source: `README.md`

### HIGH Passing the wrong ref shape

Wrong:

```bash
yggtree worktree-checkout --ref refs/heads/main
```

Correct:

```bash
yggtree wc --ref main
```

Checkout-style resolution expects a local branch name or `origin/<branch>`, so
full ref-path strings do not resolve the way users expect.

When a branch exists both locally and on `origin`, choose the local branch for a
normal branch-attached worktree or `origin/<branch>` for the detached remote tip.

Source: `src/commands/wt/create.ts`

### HIGH Expecting the same branch to be available in two worktrees

Wrong:

```bash
yggtree worktree-checkout --ref main
```

Correct:

```bash
yggtree list
yggtree open main
```

Git refuses to check out the same branch in two worktrees. `wc` reuses existing
valid worktrees for the branch, including linked worktrees outside Yggtree's
managed directory, while ignoring prunable or missing-path worktree records.

Source: `src/commands/wt/create.ts`

### MEDIUM Assuming checkout always starts inside a git repo

Wrong:

```bash
yggtree wc --ref main --no-open --no-enter
```

Correct:

```bash
yggtree wc --ref main --name fresh-main --no-open --no-enter
```

When run outside a git repo, interactive checkout can fall back to registered
Yggtree repos and ask which repo to use. Non-interactive callers stay
conservative: if multiple registered repos match, pass enough flags or run from
the intended repo.

Source: `src/commands/wt/create.ts`

### MEDIUM Using this flow for a disposable alternative approach

Wrong:

```bash
yggtree worktree-checkout --ref main --name try-another-approach
```

Correct:

```bash
yggtree create-sandbox
```

If the user is already in the middle of a task and wants alternate
implementations, sandbox is the better mental model than branch checkout.

Source: `README.md`
