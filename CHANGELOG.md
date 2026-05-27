# Changelog

All notable changes to this project will be documented in this file.

## [Next Release] - Unreleased

### Added
- **Yggtree agent skill**: Added a consolidated `yggtree` skill with focused references for creating task worktrees, checking out existing branches without stashing, managing realm lifecycle commands, and running sandbox experiments.
- **Internal site app**: Added the `apps/site` Next.js app for the Yggtree website and docs experience, with Tailwind CSS 4, Motion, responsive docs navigation, and deployment notes for Vercel.
- **GitHub Actions validation**: Added CI coverage for TypeScript checks and publish workflow support so release readiness is easier to verify from GitHub.
- `yggtree wc` and `yggtree wt wc` now provide short aliases for the checkout-style `worktree-checkout` flow.
- `yggtree open` now includes an interactive `Other command...` option for custom IDE or opener commands such as `zed .`, `droid .`, or `open -a Cursor .`.

### Changed
- Open-tool detection now treats `agy` / Antigravity CLI as an agent CLI and no longer lists deprecated Gemini CLI as a built-in open option.
- Worktree commands are now available directly at the top level, so users can run `yggtree list`, `yggtree create`, `yggtree worktree-checkout`, `yggtree delete`, and the rest of the worktree command set without the `wt` prefix.
- The older `yggtree wt ...` command shape remains available as a compatibility alias for existing scripts and muscle memory.
- Updated README and skill references to teach the direct command surface first, with `wt` documented as legacy-compatible behavior rather than the primary path.
- Moved the repository toward pnpm-managed project metadata, including a root `pnpm-lock.yaml` and package manager declaration.
- `worktree-checkout` now treats opening a tool and entering the worktree shell as independent post-checkout choices, with `--open/--no-open` and `--enter/--no-enter` controlling each path explicitly.
- Interactive `worktree-checkout` now asks whether to enter the worktree shell even when the user chooses not to open an IDE or agent tool; agent CLI selections skip the extra shell question because they already launch through the enter flow.
- Worktree creation flows now offer to copy local `.env` files into the new worktree before bootstrap runs. The copy is opt-in, skips example/template env files, and covers `create`, `worktree-checkout`, `create-multi`, and `create-sandbox`.

### Fixed
- Worktree creation commands no longer prompt for local `.env` copying in CI or other non-interactive runs, so scripted flows such as `--exec` continue without hanging when root `.env` files exist.
- `worktree-checkout` now shows both local and `origin/*` choices when a branch exists in both places, so users can explicitly choose the local branch or the remote tip.

## [1.4.2] - 2026-03-15

### Added
- `wt close`: Gracefully exit a worktree sub-shell with an option to delete the worktree on the way out. Includes double-confirmation for safety; main worktree is never offered for deletion.

### Changed
- `wt enter` now allows entering realms from anywhere: if run outside a git repository, it presents an interactive menu of previously visited realms. Realms are automatically registered whenever `yggtree` commands are used within them.
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
- Improved `wt enter` interactive menu readability by color-coding branch names and folder paths separately.
- `wt list` now groups entries by `TYPE` for easier scanning.
- `wt list` and `wt delete` now share consistent type rules: only worktrees inside `~/.yggtree` are `MANAGED`/`SANDBOX`; external worktrees are labeled `LINKED` (with `MAIN` reserved for the primary repo worktree in `wt list`).
- Added `--all` support to `wt delete` so repo-linked worktrees outside `~/.yggtree` can be included when needed (with safety exclusions for main/current worktree).
- Interactive `wt delete` now asks whether to include external linked worktrees, so the menu flow can reach non-yggtree worktrees too.
- Increased `wt delete` menu pagination to show more options per page for better scanning.
- `wt worktree-checkout` now falls back to `wt enter` when the selected branch already has an active managed yggtree worktree.
- Improved `wt enter` list readability in narrow terminals by truncating branch/path labels to avoid line wrapping noise.
- Core interactive menu now prioritizes `apply`/`unapply` when running inside a sandbox worktree.
- `wt list` now supports `--open` as a shortcut to the worktree tool-open flow.
- Interactive create flows (`wt create`, `wt worktree-checkout`, `wt create-sandbox`) now ask whether to open a tool after creation instead of asking for a free-form `exec` command by default.
- `wt create-sandbox` now prompts for an optional sandbox name; leaving it blank preserves the existing auto-generated naming behavior.
- `wt enter` interactive selection now includes worktree type labels (`MAIN`, `MANAGED`, `SANDBOX`, `LINKED`) for consistency with `wt list` and `wt delete`.
- `wt open` interactive selection now includes worktree type labels (`MAIN`, `MANAGED`, `SANDBOX`, `LINKED`) for consistency with `wt list`, `wt delete`, and `wt enter`.
- Worktree metadata helpers (`type` detection, colored type label, display path formatting, branch-name fallback, and name lookup) are now centralized in `lib/worktree` and reused across `list`, `delete`, `enter`, `open`, `exec`, and `path`.
- `wt enter` no longer asks for an interactive pre-enter command; use `--exec "<command>"` when needed.
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
