# Changelog

All notable changes to this project will be documented in this file.

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
