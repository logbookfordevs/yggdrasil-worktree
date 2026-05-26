# Branch Off Without Stashing

Use `worktree-checkout` when the user does not want a brand-new branch. This
workflow preserves the current realm exactly as-is and opens a separate worktree
for an existing branch or ref.

```bash
yggtree worktree-checkout --ref main --no-open
```

## Core Patterns

Leave current work alone and jump into another branch:

```bash
yggtree worktree-checkout --ref hotfix/payment-timeout
```

Branch off cleanly from a base branch without stash pressure:

```bash
yggtree worktree-checkout --ref main --name fresh-main
```

Reuse an existing managed worktree if the branch is already active:

```bash
yggtree list
yggtree open main
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
yggtree worktree-checkout --ref hotfix/payment-timeout
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
yggtree worktree-checkout --ref main
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

Git refuses to check out the same branch in two worktrees; if it already
exists, reuse that realm.

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
