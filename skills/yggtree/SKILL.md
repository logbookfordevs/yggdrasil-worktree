---
name: yggtree
description: >
  Guides agents through Yggtree worktree workflows for branch-backed tasks,
  checkout-style interruptions, realm lifecycle commands, sandbox experiments,
  dirty-work handoffs, and sandbox transfer/restore. Use when the user asks to
  create, open, bootstrap, enter, manage, or transfer work between Yggtree
  worktrees, sandboxes, or realms.
---

# Yggtree

Yggtree helps a developer move between isolated Git worktree "realms" without
disturbing the current checkout. Pick the workflow by intent first, then load
only the reference file for that path.

## Pick The Realm

- **New official task:** use `yggtree create` when the work should get a new
  branch-backed worktree and a remote-tracked branch. Read
  `references/create-task-worktree.md`.
- **Existing branch or clean interruption:** use `yggtree worktree-checkout`
  or `yggtree wc` when current work must stay untouched and the user needs
  another existing ref. Read `references/branch-off-without-stashing.md`.
- **Dirty-work handoff:** use `yggtree handoff` when the user started in an
  origin checkout and wants to carry staged, unstaged, or untracked work into a
  named sandbox worktree to continue there. Read
  `references/sandbox-experiments.md`.
- **Local experiment:** use `yggtree create-sandbox` when the user wants to
  try alternative approaches locally, then maybe copy the winner back. Read
  `references/sandbox-experiments.md`.
- **Prepare or act inside a realm:** use `bootstrap`, `open`, or `exec` only
  after the target worktree is known. Read `references/realm-lifecycle.md`.

## Default Decision Rules

- Prefer a sandbox for disposable alternatives inside an active task.
- Prefer `handoff --name <task>` over `create-sandbox --carry` when the user
  describes moving current dirty work into a worktree to continue.
- Treat `create-sandbox --carry` as an explicit advanced/compatibility path,
  not the taught default for dirty-work continuation.
- Treat `apply` / `unapply` as sandbox-backed file transfer and restore, not as
  Git merge, rebase, patch, or cherry-pick flows.
- Prefer `create` for real new scopes that deserve their own branch and
  remote tracking.
- Prefer `worktree-checkout` over stash or temporary commits when the user is
  interrupted by work on another branch.
- Prefer `create` and `wc` / `worktree-checkout` when the user wants to land in
  a worktree shell; both enter by default unless `--no-enter` is set.
- Prefer `open` for IDE-style opening that returns by default; add `--enter`
  only when editor/app launch should continue into a worktree shell.
- Prefer `exec` for simple non-interactive process launch inside a chosen realm.
- Expect interactive creation flows to offer opt-in local `.env` file copying
  before bootstrap; skip or disable it for scripted/non-interactive runs unless
  the user explicitly asks to carry local environment files.
- For automation or fire-and-forget setup, pass both `--no-open` and
  `--no-enter` when a create/checkout command should prepare the worktree and
  return to the caller.
- Keep `create-multi` out of the default path unless the user explicitly asks
  for multiple official worktrees; it does not share `create`'s open/enter/exec
  lifecycle.

## Quick Commands

```bash
yggtree create feat/new-checkout-flow --base main --source remote
yggtree create feat/background-task --base main --source remote --no-open --no-enter
yggtree wc --ref hotfix/payment-timeout
yggtree wc --ref hotfix/payment-timeout --tool codex-app --no-enter
yggtree handoff --name continue-auth-refactor
yggtree create-sandbox
yggtree bootstrap
yggtree open my-feature --tool cursor
yggtree open my-feature --tool codex
yggtree open my-feature --tool codex-app
yggtree list --open
yggtree exec my-feature codex --approval-mode auto
```

## Common Mistakes

- Do not use `create` for throwaway experimentation; it is the official
  branch-backed workflow and may publish to `origin`.
- Do not reach for `git stash` when the user really needs a second realm.
- Do not describe `apply` as landing a branch; it copies changed sandbox files
  into the origin checkout and stores undo data in sandbox metadata.
- Do not delete a sandbox before running `unapply` if the user may need to
  undo an applied sandbox result.
- Do not treat `open` as the nested-agent workflow; the dedicated orchestration
  skill covers multi-agent patterns separately.
