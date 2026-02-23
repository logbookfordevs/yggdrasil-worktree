# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- `wt worktree-checkout`: checkout-style flow with searchable branch selection and branch-attached worktree creation (including remote-only branches).

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
