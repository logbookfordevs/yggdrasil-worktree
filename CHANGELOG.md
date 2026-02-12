# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - (Next Release)

### Added
- **Activity Tracking**: Added a `LAST ACTIVE` column to `wt list` showing relative time (e.g., "2 hours ago") based on last commit and git index activity.
- Parallelized fetching for worktree states and activity in the `list` command for improved performance.

### Changed
- Prefixed generated sandbox branch names with `sandbox-` for better visibility (e.g., `sandbox-feature_a3f2`).
- Simplified `wt list` by removing the `PATH` column, as it typically duplicates the branch name in managed worktrees.

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
- Automatic publishing: Newly created branches are now automatically published to `origin` and set to track `origin/<branch-name>` instead of the base remote branch.
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
