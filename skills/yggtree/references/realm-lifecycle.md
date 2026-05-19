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
yggtree wt bootstrap
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

## Enter, Open, Exec

Use `enter` for an interactive shell:

```bash
yggtree wt enter
```

Use `open` for IDE-style opening:

```bash
yggtree wt open my-feature --tool cursor
```

Use `exec` for simple non-interactive commands inside a chosen worktree:

```bash
yggtree wt exec orchestrator-branch codex --approval-mode auto
```

## Common Mistakes

### HIGH Letting fallback bootstrap pick the wrong package manager

Wrong:

```bash
yggtree wt bootstrap
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
yggtree wt bootstrap
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

### HIGH Opening another interactive agent with `open`

Wrong:

```bash
yggtree wt open orchestrator-branch --tool codex
```

Correct:

```bash
yggtree wt exec orchestrator-branch codex --approval-mode auto
```

Treat `open` as IDE-oriented. Use the separate orchestration skill when a main
agent needs to coordinate non-interactive agents across worktrees.

Source: `src/commands/wt/open.ts`

### MEDIUM Using `exec` for complex shell wrappers

Wrong:

```bash
yggtree wt exec my-branch infisical run --env=local npm run dev
```

Correct:

```bash
yggtree wt open my-branch --tool cursor
cd ~/.yggtree/<repo>/<worktree>
infisical run --env=local npm run dev
```

`exec` is strongest for simple or non-interactive process launch; compound
shell-style commands break easily because interactive input parsing is naive.

Source: `src/commands/wt/exec.ts`
