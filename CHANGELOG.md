# Changelog

All notable changes to this project will be documented in this file.

## [Next Release] - Unreleased

### Added
- **Yggtree agent skill**: Added a consolidated `yggtree` skill with focused references for creating task worktrees, checking out existing branches without stashing, managing realm lifecycle commands, and running sandbox experiments.
- **Internal site app**: Added the `apps/site` Next.js app for the Yggtree website and docs experience, with Tailwind CSS 4, Motion, responsive docs navigation, and deployment notes for Vercel.
- **GitHub Actions validation**: Added CI coverage for TypeScript checks and publish workflow support so release readiness is easier to verify from GitHub.
- **Vitest test runner**: Migrated CLI helper coverage from ad hoc `.mjs` scripts to named Vitest suites for env-file handling and worktree checkout behavior.
- **PR validation workflow**: GitHub Actions now runs the full `pnpm test` pipeline on pull requests and pushes to `main`.
- **Tag-based npm releases**: Hardened the publish workflow so `v*` tags only publish when they match `package.json`, point at the current `main` tip, pass validation, and produce the expected npm package contents.
- `yggtree wc` and `yggtree wt wc` now provide short aliases for the checkout-style `worktree-checkout` flow.
- `open` now detects Codex App on macOS and supports `--tool codex-app` / `--tool codex` to launch the selected worktree with the desktop app.

### Changed
- Worktree commands are now available directly at the top level, so users can run `yggtree list`, `yggtree create`, `yggtree worktree-checkout`, `yggtree delete`, and the rest of the worktree command set without the `wt` prefix.
- The older `yggtree wt ...` command shape remains available as a compatibility alias for existing scripts and muscle memory.
- Updated README and skill references to teach the direct command surface first, with `wt` documented as legacy-compatible behavior rather than the primary path.
- Moved the repository toward pnpm-managed project metadata, including a root `pnpm-lock.yaml` and package manager declaration.
- `worktree-checkout` now defaults to ending inside the worktree shell; use `--no-enter` to keep the command fire-and-forget.
- `worktree-checkout` / `wc` now accepts `--tool <command>` to open a specific editor/app after checkout while skipping the open prompt.
- `open` stays editor-focused and returns by default; use `--enter` when opening should continue into the worktree shell.
- Interactive open flows now use a grouped multi-action picker for editor/app launches, and `Other command...` is available when the flow will enter the normal Yggtree sub-shell.
- Interactive mode now checks npm for a newer `yggtree` release and points users to `npm install -g yggtree` when their installed CLI is behind.
- The open picker now uses a calmer Yggtree-styled left-rail layout with accent section headers, command labels, and clearer shell/no-action choices.
- Agent CLIs are no longer first-class `open` options; use `Other command...` for custom foreground commands until the dedicated agent workflow lands.
- `wc` / `worktree-checkout` is now the primary path for branch-to-shell navigation, including non-interactive `--ref --name --no-open --no-enter` automation.
- Worktree creation flows now offer to copy local `.env` files into the new worktree before bootstrap runs. The copy is opt-in, skips example/template env files, and covers `create`, `worktree-checkout`, `create-multi`, and `create-sandbox`.
- README and website docs now lead with global installation, keep `npx yggtree` as a secondary option, and align examples with the current `wc` and `open` flows.
- Expanded the website docs page with scenario-based workflows, current command flags, sandbox guidance, configuration notes, and troubleshooting.
- Added Impeccable project context and live-mode configuration for the public website and docs.
- Refined the website docs typography with stronger heading hierarchy, controlled prose measure, and a more scannable command flag reference.
- Tightened the docs page type system with clearer text roles, improved command-reference rhythm, and site-wide font rendering refinements.
- Reduced the docs hero headline scale so the page opens with a calmer documentation rhythm.
- Aligned the website docs page with the upcoming CLI release by covering agent-skill installation, Codex App tool aliases, update notices, and local env-file copy behavior.
- Updated README and website docs install examples to use the `logbookfordevs/yggdrasil-worktree` repository slug.
- Expanded the website docs command reference so it covers the latest open-tool flow, checkout behavior, list metadata, and sandbox transfer details from the README.
- Widened docs prose measures so card notes and section intros use the available desktop reading column more naturally.
- Documented the website design system in `DESIGN.md` and `.impeccable/design.json` so future Impeccable work can preserve the existing visual identity.
- Polished the website docs touch targets for mobile navigation and command-copy controls.

### Removed
- Removed the public `enter` and `close` commands from the CLI, menus, and current docs. The shell-entry primitive remains internal for checkout and open flows.

### Fixed
- Worktree creation commands no longer prompt for local `.env` copying in CI or other non-interactive runs, so scripted flows such as `--exec` continue without hanging when root `.env` files exist.
- `yggtree help` and `yggtree help <command>` now reach Commander’s help renderer instead of being rejected by the removed-command guard.
- `worktree-checkout` now shows both local and `origin/*` choices when a branch exists in both places, so users can explicitly choose the local branch or the remote tip.
- `worktree-checkout` now falls back to registered Yggtree repos when run outside a git repo, matching the shell-entry flow instead of failing immediately.
- `worktree-checkout` now exits with an actionable error instead of prompting when a non-interactive caller runs outside a repo with multiple registered repos.
- `worktree-checkout` now reuses any existing worktree for the selected branch, including linked worktrees outside the managed `~/.yggtree` directory, instead of trying to create a duplicate checkout.
- `worktree-checkout` now ignores prunable or missing-path worktree entries when deciding whether an existing checkout can be reused.

## [1.4.2] - 2026-03-15

### Changed
- `wt list` now shows a **PR** column with the pull request status for each worktree branch (e.g. `OPEN`, `IN REVIEW`, `APPROVED`, `MERGED`, `DRAFT`, `CHANGES`). Requires [GitHub CLI](https://cli.github.com/) — the column is silently omitted when `gh` is not installed.

### Fixed
- Interactive create flows now use `--open / --no-open` for post-create IDE/agent launching. `--enter / --no-enter` still works as a deprecated alias for backward compatibility.

## [1.4.1] - 2026-03-08

### Added
- Easter egg commands `bifrost` and `thor`.

## [1.4.0] - 2026-03-02

### Added
- `wt worktree-checkout`: checkout-style flow with searchable branch selection and branch-attached worktree creation (including remote-only branches).
- `wt open`: open a selected worktree in an IDE or agent CLI, with tool detection and interactive selection.
- `wt create-sandbox --name <name>`: optional explicit sandbox naming for CLI/scripted usage.

### Changed
- `wt list` now groups entries by `TYPE` for easier scanning.
- `wt list` and `wt delete` now share consistent type rules: only worktrees inside `~/.yggtree` are `MANAGED`/`SANDBOX`; external worktrees are labeled `LINKED` (with `MAIN` reserved for the primary repo worktree in `wt list`).
- Added `--all` support to `wt delete` so repo-linked worktrees outside `~/.yggtree` can be included when needed (with safety exclusions for main/current worktree).
- Interactive `wt delete` now asks whether to include external linked worktrees, so the menu flow can reach non-yggtree worktrees too.
- Increased `wt delete` menu pagination to show more options per page for better scanning.
- `wt worktree-checkout` now reuses an active managed yggtree worktree when the selected branch already has one.
- Core interactive menu now prioritizes `apply`/`unapply` when running inside a sandbox worktree.
- `wt list` now supports `--open` as a shortcut to the worktree tool-open flow.
- Interactive create flows (`wt create`, `wt worktree-checkout`, `wt create-sandbox`) now ask whether to open a tool after creation instead of asking for a free-form `exec` command by default.
- `wt create-sandbox` now prompts for an optional sandbox name; leaving it blank preserves the existing auto-generated naming behavior.
- `wt open` interactive selection now includes worktree type labels (`MAIN`, `MANAGED`, `SANDBOX`, `LINKED`) for consistency with `wt list` and `wt delete`.
- Worktree metadata helpers (`type` detection, colored type label, display path formatting, branch-name fallback, and name lookup) are now centralized in `lib/worktree` and reused across `list`, `delete`, `open`, `exec`, and `path`.
- `wt open` now supports type-to-filter worktree selection, similar to `wt worktree-checkout`.

## [1.3.0] - 2026-02-18

### Added
- **Activity Tracking**: Added a `LAST ACTIVE` column to `wt list` showing relative time (e.g., "2 hours ago") based on last commit and git index activity.
- Parallelized fetching for worktree states and activity in the `list` command for improved performance.
- **`.yggtree/` config directory**: Bootstrap configuration is now read from `.yggtree/worktree-setup.json` (same `setup-worktree` schema). Legacy `yggtree-worktree.json` and `.cursor/worktrees.json` remain supported as fallbacks.
- **Sandbox metadata moved**: `.sandbox-meta.json` is now stored inside `.yggtree/sandbox-meta.json`. The `.yggtree/` directory is auto-created on first write.

### Changed
- Prefixed generated sandbox branch names with `sandbox-<hash>_` for better sorting and visibility (e.g., `sandbox-a3f2_feature`).
- Simplified `wt list` by removing the `PATH` column, as it typically duplicates the branch name in managed worktrees.
- Improved `wt delete` interactive selection by showing branch names and activity timestamps in a cleaner, standardized format.
- **Safer branch creation** (`wt create` / `wt create-multi`): Branches are now created with `git branch --no-track` before attaching the worktree, preventing Git from auto-tracking the base branch (e.g. `origin/main`). The branch is then auto-published to `origin` with correct upstream tracking. This fixes the root cause of accidental pushes to base branches while keeping the same convenient DX.
- **Config search order**: `repoRoot` is now checked before `wtPath` when resolving bootstrap config. This means edits to `.yggtree/worktree-setup.json` in your main repo take effect immediately on new worktrees, without needing to commit first. A worktree can still override by having its own `.yggtree/worktree-setup.json`.

### Fixed
- `wt apply` now excludes the entire `.yggtree/` directory from the changeset (previously only `.sandbox-meta.json` was excluded), preventing config and metadata files from leaking into the origin during sandbox apply.

## [1.2.1] - 2026-02-08

### Fixed
- Excluded `.sandbox-meta.json` from being applied to origin directory (internal metadata file should not be copied).

## [1.2.0] - 2026-02-08

### Added
- **🧪 Sandbox Worktrees**: A new workflow for local experimentation and prototyping.
- `wt create-sandbox`: Create a temporary worktree with a random name from the current local branch.
- `wt apply`: Apply differences from a sandbox worktree back to the origin directory with automatic backups.
- `wt unapply`: Revert changes applied to the origin using the sandbox's history.
- **Carry Support**: Option to carry over uncommitted (staged, unstaged, and untracked) changes when creating a sandbox.

## [1.1.1] - 2026-01-28

### Added
- **Strong Safety Mode**: New logic for worktree creation that prevents accidental pushes to base branches (like `main` or `development`).
- Automatic publishing: Newly created branches were automatically published to `origin` and set to track `origin/<branch-name>` instead of the base remote branch. *(In [1.3.0], branch creation was updated to use `--no-track` first, then publish explicitly to keep tracking safe.)*
- Upstream auditing: The tool now checks and unsets incorrect upstreams (e.g. tracking `origin/main` when it should track its own remote) upon creation.

### Changed
- Improved worktree creation workflow in both `wt create-branch` and `wt create-multi` to incorporate safety checks.

## [1.1.0] - 2026-01-27

### Added
- Improved list state column for clearer status visualization.
- Multi-deletion support: delete multiple worktrees at once.
- Post-creation hooks: run custom commands automatically using `exec`.
- Sub-shell integration: automatically enter the worktree environment upon creation.

## [1.0.0] - 2026-01-27

### Added
- Initial interactive TUI for worktree management (Yggdrasil Worktree).
- Core commands: `create`, `delete`, `list`, `bootstrap`, and `prune`.
- Support for bulk worktree creation (`create-multi`).
