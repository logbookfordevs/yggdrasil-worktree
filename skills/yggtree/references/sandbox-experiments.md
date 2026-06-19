# Sandbox Experiments

Choose `create-sandbox` when the user wants a disposable local experiment, and
choose `handoff` when they already have staged, unstaged, or untracked work in
the origin checkout and want to continue that dirty work in a named sandbox.
Sandboxes create local-only branches, write `.yggtree/sandbox-meta.json`, and can
later copy file changes back to the origin realm with `apply`.

`apply` and `unapply` are file transfer and restore commands backed by sandbox
metadata. They are not Git merge, rebase, patch, or cherry-pick flows.

```bash
yggtree create-sandbox
yggtree handoff --name continue-auth-refactor
```

## Core Patterns

Create a local-only experimental realm from current work:

```bash
yggtree create-sandbox
```

Use this for a clean disposable experiment. If the user is specifically moving
current dirty work into a sandbox to continue, prefer `handoff` instead of
teaching `create-sandbox --carry`.

Hand off staged, unstaged, and untracked files into a named sandbox:

```bash
yggtree handoff --name continue-auth-refactor
```

`handoff` defaults to carrying current uncommitted work, but it does not delete
those files from the origin checkout.

When prompted about local env files, copy them only if the experiment needs the
same machine-local secrets/configuration as the origin realm.

Apply the winner back to the origin realm:

```bash
yggtree apply
```

Run `apply` from inside the sandbox. It detects changed sandbox files, backs up
the corresponding origin files in sandbox metadata, then copies sandbox files
over the origin checkout. Deleted sandbox files are not a complete Git-style
delete propagation model, so review the origin diff after applying.

Undo a previous apply:

```bash
yggtree unapply
```

Run `unapply` only from inside the sandbox that recorded the apply backups.

## Common Mistakes

### HIGH Choosing a branch-backed worktree for an alternate approach

Wrong:

```bash
yggtree create feat/try-different-ui --base main --source remote
```

Correct:

```bash
yggtree handoff --name try-alternate-ui
```

Or:

```bash
yggtree create-sandbox
```

If the user wants to try different approaches inside an active task, sandbox is
the safer default because it stays local and disposable.

Source: `src/commands/wt/create-sandbox.ts`

### HIGH Assuming `unapply` will still work after deleting the sandbox

Wrong:

```bash
yggtree apply
yggtree delete
```

Correct:

```bash
yggtree apply
yggtree unapply
```

Apply stores backups in sandbox metadata, so deleting the sandbox removes the
history needed to undo the transfer.

For automation that intentionally deletes a known sandbox or worktree, pass the
target and `--yes`:

```bash
yggtree delete sandbox-my-test --yes
```

Source: `src/commands/wt/apply.ts`

### HIGH Expecting sandbox carry to include everything automatically

Wrong:

```bash
yggtree create-sandbox
```

Correct:

```bash
yggtree create-sandbox
git diff --name-only
```

Carry copies changed files that still exist on disk, but it intentionally skips
submodule paths and is not a full Git-history transfer. For current dirty work,
prefer `handoff --name <task>` so the intent is explicit.

Source: `src/commands/wt/create-sandbox.ts`

### MEDIUM Treating sandbox names like free-form labels

Wrong:

```bash
yggtree create-sandbox --name "UI option A"
```

Correct:

```bash
yggtree create-sandbox --name ui-option-a
```

Sandbox names are normalized into branch-safe `sandbox-*` slugs, so custom
labels should still be chosen like branch names.

Source: `src/lib/sandbox.ts`
