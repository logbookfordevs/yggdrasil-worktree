# Sandbox Experiments

Choose sandbox when the user is already in the middle of a task and wants to
try alternate approaches locally. Sandbox creates a local-only branch, writes
`.yggtree/sandbox-meta.json`, and can later apply or unapply file changes back
to the origin realm. Interactive sandbox creation can also offer opt-in copying
of local `.env` files before bootstrap.

```bash
yggtree create-sandbox
```

## Core Patterns

Create a local-only experimental realm from current work:

```bash
yggtree create-sandbox
```

When prompted, keep `Carry uncommitted changes to sandbox?` enabled if the
experiment should begin from the current working state.

When prompted about local env files, copy them only if the experiment needs the
same machine-local secrets/configuration as the origin realm.

Apply the winner back to the origin realm:

```bash
yggtree apply
```

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
submodule paths and is not a full Git-history transfer.

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
