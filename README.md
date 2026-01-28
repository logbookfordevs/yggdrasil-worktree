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

### Basic Usage

Run with no arguments to open the interactive menu:

```bash
yggtree
```

Or use commands directly:

```bash
yggtree wt create
yggtree wt list
yggtree wt enter my-feature
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
yggtree wt create feat/eng-2581-state-selection
yggtree wt create fix/eng-2610-validation
yggtree wt create chore/cleanup-api
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
yggtree wt create feat/ai-refactor-a --exec "cursor ."
yggtree wt create feat/ai-refactor-b --exec "codex"
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

1. `yggtree-worktree.json` inside the worktree
2. `yggtree-worktree.json` in the repo root
3. `.cursor/worktrees.json`
4. Fallback: `npm install` + submodules

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

### `yggtree wt create [branch]`

Create a worktree from a branch.

Options:

* `--base <ref>`
* `--source local|remote`
* `--no-bootstrap`
* `--enter / --no-enter`
* `--exec "<command>"`

<details>
<summary>Example</summary>

```bash
yggtree wt create feat/new-ui --base main --exec "cursor ."
```

</details>

---

### `yggtree wt create-multi`

Create multiple worktrees at once.

<details>
<summary>Example</summary>

```bash
yggtree wt create-multi --base main
```

</details>

---

### `yggtree wt list`

List all worktrees with state.

Columns:

* TYPE (MAIN / MANAGED)
* STATE (clean / dirty)
* BRANCH
* PATH

---

### `yggtree wt enter [worktree]`

Enter a worktree using a sub‑shell.

* Uses your default shell
* Type `exit` to return

Optional:

* `--exec "<command>"`

<details>
<summary>Example</summary>

```bash
yggtree wt enter feat/new-ui --exec "npm test"
```

</details>

---

### `yggtree wt exec [worktree] -- <command>`

Run a command inside a worktree **without entering**.

<details>
<summary>Example</summary>

```bash
yggtree wt exec feat/new-ui -- npm test
```

</details>

---

### `yggtree wt path [worktree]`

Print a `cd` command for a worktree.

Useful for scripting and shell aliases.

---

### `yggtree wt bootstrap`

Re‑run bootstrap commands for a worktree.

---

### `yggtree wt delete`

Interactively delete managed worktrees.

---

### `yggtree wt prune`

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
<summary>Create a worktree and enter it immediately</summary>

**Command:**

```
yggtree wt create feat/login-flow
```

**What happens:**

* Creates a new branch if it doesn’t exist
* Creates a dedicated worktree
* Runs bootstrap if enabled
* Drops you into a sub-shell inside the worktree

</details>
---

<details>
<summary>Create a worktree without bootstrap and without entering</summary>

**Command:**

```
yggtree wt create feat/cleanup-api --no-bootstrap --no-enter
```

**When to use:**

* You just want the folder ready
* You’ll enter it later
* You don’t want installs running automatically

</details>
---

<details>
<summary>Create a worktree and open it in your IDE</summary>

**Command:**

```
yggtree wt create feat/ui-refactor --exec "cursor ."
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
yggtree wt exec test -- npm test
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
yggtree wt enter test --exec "codex"
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
yggtree wt path test
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
