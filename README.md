# 🌳 Yggdrasil Worktree (yggtree)

[![npm version](https://img.shields.io/npm/v/yggtree.svg)](https://www.npmjs.com/package/yggtree)
[![license](https://img.shields.io/npm/l/yggtree.svg)](https://www.npmjs.com/package/yggtree)

**Yggdrasil Worktree** (invoked as `yggtree`) is a powerful, interactive CLI designed to streamline your Git worktree workflow. Like the mythical world tree connecting the realms, Yggdrasil connects your branches into isolated, manageable worktrees.

---

## 🚀 Quick Start

### Installation

You can run it directly without installing:

```bash
npx yggtree
```

Or install it globally for convenience:

```bash
npm install -g yggtree
```

### Usage

Simply run `yggtree` to open the interactive menu:

```bash
yggtree
```

Or use specific commands:

```bash
yggtree wt create      # Smart branch-based creation
yggtree wt list        # View all managed worktrees
yggtree wt prune       # Clean up stale worktree data
```

---

## ✨ Key Features

### 🌿 Smart Branch Creation (`wt create`)
The primary way to start working. Instead of worrying about folder names, just tell Yggdrasil which branch you want to work on.
- **Auto-Slug**: Converts `feat/eng-123-ui` to a clean folder name like `feat-eng-123-ui`.
- **Auto-Branching**: If the branch doesn't exist, Yggdrasil creates it for you from a base branch.
- **Remote Awareness**: Seamlessly base your work on `origin/main` or local refs.

### 🌳 Batch Creation (`wt create-multi`)
Need to spin up multiple features? Provide branch names separated by spaces, and Yggdrasil will provision all of them in one go.

### 🚀 Custom Bootstrapping
Configure your environment automatically using a `yggtree-worktree.json` (also compatible with `.cursor/worktrees.json`) file in your project root.

---

## 🤔 Why Yggdrasil Worktree?

Git worktrees are incredibly powerful, but they are also **painfully manual** once you go beyond a single task.

Modern development isn’t sequential anymore. You’re constantly switching contexts, juggling experiments, fixes, reviews, and now **AI agents running in parallel**.

Yggdrasil exists to solve three modern problems at once:

1. **Parallel work without context collision**
2. **Fast environment setup per task**
3. **Agent-friendly isolation for AI workflows**

Instead of juggling branches, folders, and bootstrap scripts by hand, Yggdrasil gives you a repeatable, intentional workflow.
Each worktree becomes its own **small realm** — isolated, focused, and safe to explore.

---

## 🧠 Parallel Development, Done Right

Traditional branching assumes *sequential* work.

Reality looks more like this:

* You’re fixing a bug
* Reviewing a PR
* Prototyping a feature
* Letting an AI agent explore refactors
* Letting another agent generate tests

All at the same time.

Yggdrasil lets each task live in its **own isolated worktree** — a separate realm where ideas can evolve without colliding.

```bash
yggtree wt create feat/eng-2581-state-selection
yggtree wt create fix/eng-2610-validation
yggtree wt create chore/cleanup-api
```

Each command spins up:

* A clean folder
* A dedicated branch
* A fully bootstrapped environment

No context bleeding.
No stash juggling.
No “what branch am I on?” moments.

---

## 🤖 Built for AI-Assisted Workflows

Yggdrasil shines when combined with AI agents.

Instead of running agents against the same working directory, you can:

* Assign one worktree per agent
* Let each agent explore independently
* Compare results safely
* Merge only what makes sense

Example workflow:

```bash
# Prepare isolated worktrees
yggtree wt create feat/ai-refactor-a
yggtree wt create feat/ai-refactor-b
```

Each agent operates in its own realm, free to experiment without side effects.

This enables patterns like:

* Model A refactors architecture
* Model B focuses on tests
* Model C explores performance improvements

All in parallel.
All reviewable.
All under your control.

---

## ⚡ Zero-Friction Bootstrapping

Every worktree can auto-configure itself.

Yggdrasil reads your project’s setup file and prepares the realm immediately:

```json
{
  "setup-worktree": [
    "npm install",
    "git submodule sync --recursive",
    "git submodule update --init --recursive"
  ]
}
```

That means:

* No manual installs
* No forgotten submodules
* No “works on main but not here” surprises

You enter a worktree and it’s ready to work.

---

## 🌱 When Should You Use Yggdrasil?

Yggdrasil is ideal when:

* You work on multiple tasks in parallel
* You use AI agents for exploration or execution
* You want isolation without duplication
* You value repeatable, scripted setup
* You’re tired of fighting your own repo

If your workflow has outgrown `git checkout`, Yggdrasil is the missing layer.

---

## 🌍 Philosophy

Branches are ideas.
Worktrees are realities.

Yggdrasil helps you keep each idea grounded in its own world — until you decide which ones deserve to merge.


---

## ⚙️ Configuration

Yggdrasil looks for setup instructions in your project root:

```json
{
  "setup-worktree": [
    "npm install",
    "git submodule sync --recursive",
    "git submodule update --init --recursive",
    "npm run build",
    "echo '🌳 The realm is ready!'"
  ]
}
```

---

## 🛠️ Commands Reference

| Command | Description |
| :--- | :--- |
| `yggtree` | Open the interactive main menu. |
| `yggtree wt create` | Create a worktree by branch name (Recommended). |
| `yggtree wt create-multi` | Create multiple worktrees in a single command. |
| `yggtree wt create-slug` | Manually specify both folder name and branch ref. |
| `yggtree wt list` | List all managed worktrees and their status. |
| `yggtree wt delete` | Interactively select and remove a worktree. |
| `yggtree wt bootstrap` | Re-run the setup commands for an existing worktree. |
| `yggtree wt prune` | Clean up Git's internal data for worktrees. |

---

## 🛠️ Development

If you'd like to contribute or run the latest development version:

```bash
# Clone the repository
git clone https://github.com/leoreisdias/yggdrasil-cli.git
cd yggdrasil-cli

# Install dependencies and build
npm install
npm run build

# Link the CLI locally
npm link
```

## 📄 License

MIT License.
