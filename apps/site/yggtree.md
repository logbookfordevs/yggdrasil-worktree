# 🌳 Yggdrasil Worktree (yggtree)

[![npm version](https://img.shields.io/npm/v/yggtree.svg)](https://www.npmjs.com/package/yggtree)
[![license](https://img.shields.io/npm/l/yggtree.svg)](https://www.npmjs.com/package/yggtree)

**Yggdrasil Worktree** (invoked as `yggtree`) is an interactive CLI designed to turn Git worktrees into a first‑class workflow.

Like the mythical world tree connecting realms, Yggdrasil lets you grow isolated, parallel environments where ideas can evolve independently without colliding.

---

## 🚀 Quick Start

### Installation

Install globally:

```bash
npm install -g yggtree
```

Or try it without installing:

```bash
npx yggtree
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
yggtree wc --ref my-feature
```

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
yggtree create feat/state-selection
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

## ⚡ Bootstrapping & Configuration

Yggdrasil automatically prepares each worktree.

Resolution order:

1. `.yggtree/worktree-setup.json` in the repo root (primary)
2. `.yggtree/worktree-setup.json` inside the worktree (per-worktree override)
3. `yggtree-worktree.json` (legacy)
4. `.cursor/worktrees.json` (legacy)
5. Fallback: `npm install` + submodules

### Example configuration

Create `.yggtree/worktree-setup.json` in your repo root:

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

* `--base <ref>`
* `--source local|remote`
* `--no-bootstrap`
* `--open / --no-open`
* `--exec "<command>"`

<details>
<summary>Example</summary>

```bash
yggtree create feat/new-ui --base main --exec "cursor ."
```

</details>

---

### `yggtree create-multi`

Create multiple worktrees at once.

<details>
<summary>Example</summary>

```bash
yggtree create-multi --base main
```

</details>

---

### `yggtree list`

List all worktrees with state.

Columns:

* TYPE (MAIN / MANAGED)
* STATE (clean / dirty)
* BRANCH
* LAST ACTIVE

---

### `yggtree exec [worktree] -- <command>`

Run a command inside a worktree without changing your current terminal.

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

Interactively delete managed worktrees.

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

* Creates a new branch if it doesn't exist (without inheriting base tracking)
* Auto-publishes to origin with correct upstream when possible
* Creates a dedicated worktree
* Runs bootstrap if enabled
* Lets you choose whether to open an editor after creation

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
* You’ll open it or use its path later if needed
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
* Keeps your current terminal where it is
* Ideal for CI-like checks, scripts, or quick validations

</details>
---

<details>
<summary>Checkout a branch and run a startup command</summary>

**Command:**

```
yggtree wc --ref test --open
```

**What happens:**

* Checks out or reuses the branch worktree
* Lets you choose an editor, supported app, or `Other command...`
* Use `--tool <command>` to skip the open prompt and launch one editor/app directly
* Starts a worktree shell unless you pass `--no-enter`

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

## 🌍 Philosophy

Branches are ideas.
Worktrees are realities.

Yggdrasil helps you grow many worlds and decide later which ones deserve to merge.

---

## 📄 License

MIT License.
