# ⚒️ Anvil CLI

**Anvil** is a powerful, interactive CLI designed to streamline your Git worktree workflow. It simplifies creating, managing, and bootstrapping isolated development environments, allowing you to work on multiple branches simultaneously without the overhead of multiple clones or messy `git stash` cycles.

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/leoreisdias/anvil-cli.git
cd anvil-cli

# Install dependencies and build
npm install
npm run build

# Link the CLI globally
npm link
```

### Usage

Simply run `anvil` to open the interactive menu:

```bash
anvil
```

Or use specific commands:

```bash
anvil wt create      # Smart branch-based creation
anvil wt list        # View all managed worktrees
anvil wt prune       # Clean up stale worktree data
```

---

## ✨ Key Features

### 🌿 Smart Branch Creation (`wt create`)
The primary way to start working. Instead of worrying about folder names, just tell Anvil which branch you want to work on.
- **Auto-Slug**: Converts `feat/eng-123-ui` to a clean folder name like `feat-eng-123-ui`.
- **Auto-Branching**: If the branch doesn't exist, Anvil creates it for you from a base branch (defaulting to your current one).
- **Remote Awareness**: Seamlessly base your work on `origin/main` or local refs.

### 🌳 Batch Creation (`wt create-multi`)
Need to spin up three features at once? Provide multiple branch names separated by spaces, and Anvil will provision all of them in one go.

### 🚀 Custom Bootstrapping
Tired of running `npm install` and `git submodule update` manually? Anvil handles it automatically. You can even customize the setup per project.

---

## ⚙️ Configuration

Anvil can be customized for your project using an `anvil-worktree.json` file in your repository root (or `.cursor/worktrees.json`).

### Example `anvil-worktree.json`

```json
{
  "setup-worktree": [
    "npm install",
    "git submodule sync --recursive",
    "git submodule update --init --recursive",
    "npm run build",
    "echo '🔥 Ready to code!'"
  ]
}
```

If no configuration file is found, Anvil falls back to a standard `npm install` + recursive submodule update.

---

## 🛠️ Commands Reference

| Command | Description |
| :--- | :--- |
| `anvil` | Open the interactive main menu. |
| `wt create` | Create a worktree by branch name (Recommended). |
| `wt create-multi` | Create multiple worktrees in a single command. |
| `wt create-slug` | Manually specify both folder name and branch ref. |
| `wt list` | List all managed worktrees and their status. |
| `wt delete` | Interactively select and remove a worktree. |
| `wt bootstrap` | Re-run the setup commands for an existing worktree. |
| `wt prune` | Clean up Git's internal data for worktrees deleted from disk. |

---

## 🐚 Sub-shell Integration

When you create a worktree, Anvil asks if you want to **jump in immediately**. If you say yes, it spawns a new shell inside the worktree directory. When you're done, just type `exit` to return to your original terminal context.

---

## 📄 License

ISC License.
