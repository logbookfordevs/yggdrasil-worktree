# 🌳 Yggdrasil Worktree (yggtree)

[![npm version](https://img.shields.io/npm/v/yggtree.svg)](https://www.npmjs.com/package/yggtree)
[![license](https://img.shields.io/npm/l/yggtree.svg)](https://www.npmjs.com/package/yggtree)

**Yggdrasil Worktree** (invoked as `yggtree`) is an interactive CLI designed to turn Git worktrees into a first‑class workflow.

Like the mythical world tree connecting realms, Yggdrasil lets you grow isolated, parallel environments where ideas can evolve independently without colliding.

---

## 🚀 Quick Start

### Installation

Run without installing:

```bash
npx yggtree
```

Or install globally:

```bash
npm install -g yggtree
```

### Agent Skills

Skills are now available for your favorite agents.

`yggtree` now ships a set of agent skills focused on the workflows that matter
most when working with Git worktrees:

* **Create a task worktree**: start a brand-new branch-backed task in parallel.
* **Branch off without stashing**: jump into another branch without disturbing
  the work already in progress.
* **Bootstrap and enter a realm**: prepare a worktree, open it in your IDE, or
  orchestrate non-interactive sub-agents inside it.
* **Run sandbox experiments**: try alternative approaches locally and
  apply/unapply the winner safely.
* **Orchestrate sub-agents in worktrees**: let one main agent create or choose
  isolated realms, delegate work to other agents non-interactively, and review
  the result before asking for another iteration.

These skills are especially useful with agents like **Claude Code**,
**Codex**, **Cursor**, **Gemini CLI**, and other tools that support the open
Skills ecosystem.

Install them with the Skills CLI:

```bash
npx skills add leoreisdias/yggdrasil-worktree
```

Install them globally for your user:

```bash
npx skills add leoreisdias/yggdrasil-worktree --global
```

Install only specific `yggtree` skills:

```bash
npx skills add leoreisdias/yggdrasil-worktree \
  --skill create-task-worktree \
  --skill branch-off-without-stashing \
  --skill bootstrap-and-enter-a-realm \
  --skill run-sandbox-experiments \
  --skill orchestrate-sub-agents-in-worktrees
```

If your agent supports targeted installs, you can also point the install to a
specific agent runtime, for example:

```bash
npx skills add leoreisdias/yggdrasil-worktree --agent claude-code
```

### Basic Usage

Run with no arguments to open the interactive menu:

```bash
yggtree
```

Or use commands directly:

```bash
yggtree create
yggtree list
yggtree enter my-feature
```

The older `yggtree wt ...` form still works for compatibility, but direct commands are the preferred shape.

---

## 🧠 Mental Model

Yggdrasil is built around a few core ideas:

* **Branches are ideas**
* **Worktrees are realities**
* **Each task deserves its own realm**

Instead of constantly switching branches in one working directory, Yggdrasil creates **isolated worktrees**, each mapped to a branch, living outside your main repo.

All managed worktrees live under:

```
~/.yggtree/<repo-name>/<worktree-slug>
```

This keeps your main repository clean while enabling true parallelism.

---

## 🤔 Why Yggdrasil Worktree?

Git worktrees are powerful, but once you start doing **parallel work**, they become tedious to manage manually.

Modern development looks like this:

* Fixing a bug
* Reviewing a PR
* Prototyping a feature
* Letting AI agents explore refactors
* Running tests in isolation

All at the same time.

Yggdrasil exists to solve three problems together:

1. Parallel work without context collision
2. Fast, repeatable environment setup
3. Agent‑friendly isolation for AI workflows

Each worktree becomes its own **small realm**, safe to explore and easy to discard.

---

## ✨ Key Features

🌳 **First-class worktree workflow**
Create, manage, and navigate Git worktrees as a primary workflow, not an afterthought.

🧠 **Parallel development by default**
Work on multiple branches at the same time, each in its own isolated environment.

🧪 **Sandbox worktrees for experimentation**
Prototyping something risky? Create a sandbox with a random name, try different strategies, and apply the winner back to your origin branch.

🤖 **AI-friendly isolation**
One worktree per agent, per experiment, per idea. No shared state, no collisions.

⚡ **Automatic bootstrapping**
Run installs, submodules, and setup scripts automatically for each worktree.

🚪 **Enter, exec, and exit with ease**
Enter worktrees, execute commands, or run tasks without changing directories.

📍 **Predictable structure**
All managed worktrees live under `~/.yggtree`, keeping your repository clean.

🧭 **Interactive or scriptable**
Use the interactive UI or drive everything through commands and flags.

---

## 🧠 Parallel Development, Done Right

```bash
yggtree create feat/city-selection
yggtree create fix/validation
yggtree create chore/cleanup-api
```

Each command creates:

* A clean folder
* A dedicated branch
* A bootstrapped environment

No stash juggling.
No branch confusion.
No shared state accidents.

---

## 🤖 Built for AI‑Assisted Workflows

Yggdrasil shines when paired with AI agents.

Instead of running agents against the same directory, you can assign **one worktree per agent**.

```bash
yggtree create feat/ai-refactor-a --exec "cursor ."
yggtree create feat/ai-refactor-b --exec "codex"
```

Each agent operates in its own realm:

* Model A refactors architecture
* Model B focuses on tests
* Model C explores performance

All in parallel. All reviewable. All isolated.

---

## 🧪 Sandbox Worktrees

Sometimes you don't want to "commit to a branch" yet. You just want to try something out—or perhaps try three different ways of solving the same problem.

**Sandboxes** are temporary, local-only worktrees designed for this:

1.  **Create**: `yggtree create-sandbox` (creates something like `sandbox-a3f2_feature-branch`).
2.  **Experiment**: Change files, run tests, try that risky refactor.
3.  **Apply**: `yggtree apply` to "push" those file changes back to your origin directory.
4.  **Unapply**: Don't like it? `yggtree unapply` restores your origin to exactly how it was before.

Sandboxes are **not pushed to remote** and their names are randomly generated because they are meant to be temporary playgrounds.

---

## ⚡ Bootstrapping & Configuration

Yggdrasil automatically prepares each worktree.

Resolution order:

1. `.yggtree/worktree-setup.json` in the repo root
2. `yggtree-worktree.json` in the repo root (legacy fallback)
3. `.cursor/worktrees.json` in the repo root (legacy fallback)
4. `.yggtree/worktree-setup.json` inside the worktree (per-worktree fallback)
5. `yggtree-worktree.json` inside the worktree (legacy fallback)
6. `.cursor/worktrees.json` inside the worktree (legacy fallback)
7. Fallback: `npm install` + submodules

### Example configuration

```json
{
  "setup-worktree": [
    "npm install",
    "git submodule sync --recursive",
    "git submodule update --init --recursive",
    "echo \"🌳 Realm ready\""
  ]
}
```

---

## 🛠️ Command Reference

### `yggtree`

Open the interactive menu.

---

### `yggtree create [branch]`

Create a worktree from a branch.

Options:

* `-b, --branch <name>`
* `--base <ref>`
* `--source local|remote`
* `--no-bootstrap`
* `--open / --no-open`
* `--exec "<command>"`

Interactive flow:

* Instead of asking for a free-form `exec` command, yggtree now asks if you want to open a tool after creation (IDE or agent CLI).
* `--exec` remains available as an advanced explicit override.

<details>
<summary>Example</summary>

```bash
yggtree create feat/new-ui --base main --exec "cursor ."
```

</details>

---

### `yggtree worktree-checkout [name] [ref]`

Create a checkout-style worktree from an existing branch.

Behavior:

* Prompts a searchable branch picker (type to filter in real time).
* Attaches the new worktree directly to the selected branch (checkout-style).
* If you select a remote-only branch (`origin/*`), yggtree creates the local branch in the new worktree automatically.
* If that branch already has an active yggtree-managed worktree, yggtree falls back to entering that worktree instead of creating a duplicate.

Options:

* `-n, --name <slug>`
* `-r, --ref <ref>`: skip picker and use a specific branch (`feature/x` or `origin/feature/x`)
* `--no-bootstrap`
* `--open / --no-open`
* `--exec "<command>"`

Interactive flow:

* Instead of asking for a free-form `exec` command, yggtree now asks if you want to open a tool after creation (IDE or agent CLI).
* `--exec` remains available as an advanced explicit override.

<details>
<summary>Example</summary>

```bash
yggtree worktree-checkout -n hotfix-auth -r main --no-open
```

</details>

---

### `yggtree create-sandbox`

Create a temporary sandbox from your current local branch.

Options:

*   `-n, --name <name>`: Optional sandbox name (auto-generated if omitted).
*   `--carry / --no-carry`: Bring uncommitted changes (staged/unstaged/untracked) with you.
*   `--no-bootstrap`
*   `--open / --no-open`
*   `--exec "<command>"`

Interactive flow:

* Prompts for an optional sandbox name (leave empty to auto-generate one from current branch).
* Instead of asking for a free-form `exec` command, yggtree now asks if you want to open a tool after creation (IDE or agent CLI).
* `--exec` remains available as an advanced explicit override.

---

### `yggtree apply`

Apply changes from the current sandbox back to the origin repository. 
*   **Backs up** origin files before overwriting.
*   **Offers to delete** the sandbox after applying.

---

### `yggtree unapply`

Undo a previous `apply` operation.
*   Restores origin files from the sandbox's backup.
*   *Note: Only works if the sandbox worktree still exists.*

---

### `yggtree create-multi`

Create multiple worktrees at once.

Options:

* `--base <ref>`
* `--source local|remote`
* `--no-bootstrap`

<details>
<summary>Example</summary>

```bash
yggtree create-multi --base main
```

</details>

---

### `yggtree list`

List all repo-linked worktrees with state.

Columns:

* TYPE (`MAIN`, `MANAGED`, `LINKED`, `SANDBOX`)
* STATE (clean / dirty)
* LAST ACTIVE
* PR (optional — requires [GitHub CLI](https://cli.github.com/))
* BRANCH

Notes:

* Entries are grouped by `TYPE`.
* `SANDBOX` and `MANAGED` are worktrees inside `~/.yggtree`.
* External worktrees are labeled `LINKED`.
* Use `--open` to switch this flow into "pick and open in tool" mode.
* The **PR** column shows the pull request status for each branch (e.g. `OPEN`, `IN REVIEW`, `APPROVED`, `MERGED`, `DRAFT`, `CHANGES`). It only appears when `gh` CLI is installed and authenticated — otherwise it's silently omitted.

---

### `yggtree enter [worktree]`

Enter a worktree using a sub‑shell.

* Uses your default shell
* Type `exit` to return

Optional:

* `--exec "<command>"`

<details>
<summary>Example</summary>

```bash
yggtree enter feat/new-ui --exec "npm test"
```

</details>

---

### `yggtree close`

Gracefully exit a worktree sub-shell with an option to delete it.

Behavior:

* Only works inside an Yggdrasil sub-shell (entered via `yggtree enter` or post-creation).
* Asks whether you want to delete the worktree before leaving.
* Includes double-confirmation for safety.
* Main worktree is never offered for deletion.

<details>
<summary>Example</summary>

```bash
# Inside a worktree sub-shell:
yggtree close
# → "Delete this worktree before leaving? (y/N)"
# → If yes: removes the worktree, then exits
# → If no: exits normally
```

</details>

---

### `yggtree open [worktree]`

Open a worktree in an IDE or agent CLI.

Behavior:

* If `[worktree]` is omitted, you can pick from the worktree list with type-to-filter search.
* Detects available tool commands in your `PATH` (for example: IDEs like `cursor`, `code`, `zed`; agents like `claude`, `codex`, `gemini`, `opencode`).
* Lets you choose one interactively, or pass `--tool`.
* If an agent CLI is selected, yggtree opens a sub-shell and launches it there.

Options:

* `--tool <command>`

<details>
<summary>Examples</summary>

```bash
yggtree open
yggtree open feat/new-ui --tool cursor
yggtree open feat/new-ui --tool claude
yggtree list --open
```

</details>

---

### `yggtree exec [worktree] -- <command>`

Run a command inside a worktree **without entering**.

<details>
<summary>Example</summary>

```bash
yggtree exec feat/new-ui -- npm test
```

</details>

---

### `yggtree path [worktree]`

Print a `cd` command for a worktree.

Useful for scripting and shell aliases.

---

### `yggtree bootstrap`

Re‑run bootstrap commands for a worktree.

---

### `yggtree delete`

Interactively delete worktrees.

Behavior:

* Default flow targets managed worktrees.
* In interactive mode, yggtree asks whether to include external linked worktrees.
* In direct CLI usage, `--all` includes external linked worktrees (main/current are still excluded for safety).
* The delete selector shows 6 items per page.

Optional:

* `--all` includes linked worktrees outside `~/.yggtree` (main/current worktree is excluded for safety)

---

### `yggtree prune`

Clean up stale git worktree metadata.

---

## 🌱 When Should You Use Yggdrasil?

Yggdrasil is ideal when:

* You work on multiple tasks in parallel
* You use AI agents for exploration
* You want isolation without duplication
* You value scripted, repeatable setups
* `git checkout` no longer scales

---

## 📝 Practical Examples

<details>
<summary>Create a worktree with the guided post-create flow</summary>

**Command:**

```
yggtree create feat/login-flow
```

**What happens:**

* Creates a new branch if it doesn’t exist (without inheriting base tracking), then publishes it to `origin` when possible
* Creates a dedicated worktree
* Runs bootstrap if enabled
* Lets you choose whether to open an IDE or agent after creation


</details>
---

<details>
<summary>Create a worktree without bootstrap and without opening a tool</summary>

**Command:**

```
yggtree create feat/cleanup-api --no-bootstrap --no-open
```

**When to use:**

* You just want the folder ready
* You’ll open or enter it later if needed
* You don’t want installs running automatically

</details>
---

<details>
<summary>Create a worktree and open it in your IDE</summary>

**Command:**

```
yggtree create feat/ui-refactor --exec "cursor ."
```

Works with:

* `cursor .`
* `code .`
* `codex`
* Any custom command available in your shell

</details>
---

<details>
<summary>Execute a command inside an existing worktree (no shell)</summary>

**Command:**

```
yggtree exec test -- npm test
```

**What this does:**

* Runs the command inside the selected worktree
* Does not enter a sub-shell
* Ideal for CI-like checks, scripts, or quick validations

</details>
---

<details>
<summary>Enter a worktree and run a command before entering</summary>

**Command:**

```
yggtree enter test --exec "codex"
```

**What happens:**

* Executes the command inside the worktree
* Then drops you into a sub-shell
* Type `exit` to return to your original directory

</details>
---

<details>
<summary>Get the path to a worktree</summary>

**Command:**

```
yggtree path test
```

**Output:**

```
cd ~/.yggtree/your-repo-name/test
```

Useful when you want to manually navigate or copy the path into scripts.

</details>

---

<details>
<summary>Try a risky refactor in a Sandbox</summary>

**Command:**

```bash
yggtree create-sandbox --carry
```

**Scenario:**

1.  You have 5 files changed in your main repo but aren't sure about the direction.
2.  Run `create-sandbox --carry` to move those changes into an isolated `sandbox-a3f2_feature-branch` folder.
3.  Experiment freely.
4.  If it works: `yggtree apply`.
5.  If it fails: Just delete the sandbox or `unapply`.

</details>

---

## 🌍 Philosophy

Branches are ideas.
Worktrees are realities.

Yggdrasil helps you grow many worlds and decide later which ones deserve to merge.

---

## 📄 License

MIT License.
