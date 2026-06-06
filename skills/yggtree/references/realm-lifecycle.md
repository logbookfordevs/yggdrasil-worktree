# Realm Lifecycle

Use these commands after the target worktree or realm is known.

## Bootstrap

Bootstrap resolves setup commands in this order:

1. `.yggtree/worktree-setup.json` in the repo root
2. `yggtree-worktree.json` in the repo root
3. `.cursor/worktrees.json` in the repo root
4. the same three locations inside the worktree
5. fallback: `npm install` plus submodule sync

```bash
yggtree bootstrap
```

Define setup explicitly if the repo does not want the fallback `npm install`.

```json
{
  "setup-worktree": [
    "pnpm install",
    "git submodule sync --recursive",
    "git submodule update --init --recursive"
  ]
}
```

## Shell Entry, Open, Exec

Use `worktree-checkout` when you want to land in a branch worktree shell:

```bash
yggtree wc --ref my-feature
```

Add `--no-enter` when the checkout flow should prepare or open the worktree and
then return:

```bash
yggtree wc --ref my-feature --tool codex-app --no-enter
```

Use `open --enter` when the worktree is already known and editor launch should
continue into a shell:

```bash
yggtree open my-feature --tool cursor --enter
```

Use `open` for IDE-style opening:

```bash
yggtree open my-feature --tool cursor
```

By default, `open` launches the selected editor/app and returns. Its interactive
tool picker is single-selection; run another `open` command later for additional
tools.

Use `codex` or `codex-app` to open the Codex desktop app on macOS:

```bash
yggtree open my-feature --tool codex
yggtree open my-feature --tool codex-app
```

Use `list --open` when the user wants to choose from the worktree list before
launching tools:

```bash
yggtree list --open
```

Use `exec` for simple non-interactive commands inside a chosen worktree:

```bash
yggtree exec orchestrator-branch codex --approval-mode auto
```

## Common Mistakes

### HIGH Letting fallback bootstrap pick the wrong package manager

Wrong:

```bash
yggtree bootstrap
```

Correct:

```json
{
  "setup-worktree": [
    "pnpm install",
    "git submodule sync --recursive",
    "git submodule update --init --recursive"
  ]
}
```

Without config, bootstrap falls back to `npm install`, which is wrong for repos
standardized on another package manager.

Source: `src/lib/config.ts`

### HIGH Treating SSH-auth setup failures like generic install failures

Wrong:

```bash
yggtree bootstrap
```

Correct:

```bash
ssh -T git@github.com
git submodule sync --recursive
git submodule update --init --recursive
```

The most painful bootstrap failures come from submodule auth or setup commands
that require SSH credentials or interactive authentication.

Source: `src/lib/config.ts`

### HIGH Treating desktop app openers like agent orchestration

Wrong:

```bash
yggtree open orchestrator-branch --tool "codex --approval-mode auto"
```

Correct:

```bash
yggtree exec orchestrator-branch codex --approval-mode auto
```

Treat `open` as editor/app-oriented. `codex` and `codex-app` open the desktop
app with the worktree folder; use `exec` or the separate orchestration skill when
a main agent needs to coordinate non-interactive agents across worktrees.

Source: `src/commands/wt/open.ts`

### MEDIUM Using `exec` for complex shell wrappers

Wrong:

```bash
yggtree exec my-branch infisical run --env=local npm run dev
```

Correct:

```bash
yggtree open my-branch --tool cursor
infisical run --env=local npm run dev
```

`exec` is strongest for simple or non-interactive process launch; compound
shell-style commands break easily because interactive input parsing is naive.

Source: `src/commands/wt/exec.ts`
