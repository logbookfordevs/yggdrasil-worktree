---
name: new-release
description: >
  Use this skill when preparing and publishing a new yggtree release from main:
  convert the current CHANGELOG.md "Next Release - TBD" notes into the next
  patch, minor, or major version dated today, create a fresh empty
  "Next Release - TBD" section, run npm version, and push main with tags.
---

# New Release

Prepare yggtree releases from the repository root. The release level must be
one of `patch`, `minor`, or `major`.

## Workflow

1. Confirm the checkout is on `main` and the intended release level is known.
2. Review `CHANGELOG.md` and make sure `## Next Release - TBD` contains the
   notes intended for this release.
3. Run the bundled helper:

   ```bash
   node skills/new-release/scripts/new-release.mjs patch
   ```

   Replace `patch` with `minor` or `major` when appropriate.

4. The helper will:
   - compute the next version from `package.json`;
   - change the current `## Next Release - TBD` heading to
     `## [vX.Y.Z] - YYYY-MM-DD`;
   - insert a new empty `## Next Release - TBD` section above it;
   - run `npm version patch|minor|major --no-git-tag-version`;
   - commit the changelog and version bump;
   - create the `vX.Y.Z` tag;
   - run `git push origin main --follow-tags`.

## Validation And Safety

- Use `--dry-run` to preview the computed version and changelog rewrite without
  changing files or running git/npm commands:

  ```bash
  node skills/new-release/scripts/new-release.mjs minor --dry-run
  ```

- The helper requires a clean `main` checkout before it edits files.
- If the helper stops before `npm version`, fix the reported issue and rerun.
- If `npm version` succeeds but the push fails, inspect the tag and commit before
  retrying `git push origin main --follow-tags`.
- Do not manually create the version commit or tag unless recovering from a
  failed release command.
