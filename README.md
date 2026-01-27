# 🌳 Yggdrasil CLI (ygg-cli)

**Yggdrasil** (invoked as `ygg-cli`) is a powerful, interactive CLI designed to streamline your Git worktree workflow. Like the mythical world tree connecting the realms, Yggdrasil connects your branches into isolated, manageable worktrees.

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/leoreisdias/ygg-cli.git
cd ygg-cli

# Install dependencies and build
npm install
npm run build

# Link the CLI globally
npm link
```

### Usage

Simply run `ygg-cli` to open the interactive menu:

```bash
ygg-cli
```

Or use specific commands:

```bash
ygg-cli wt create      # Smart branch-based creation
ygg-cli wt list        # View all managed worktrees
ygg-cli wt prune       # Clean up stale worktree data
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
Configure your environment automatically using an `anvil-worktree.json` (also compatible with `.cursor/worktrees.json`) file in your project root.

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
| `ygg-cli` | Open the interactive main menu. |
| `ygg-cli wt create` | Create a worktree by branch name (Recommended). |
| `ygg-cli wt create-multi` | Create multiple worktrees in a single command. |
| `ygg-cli wt create-slug` | Manually specify both folder name and branch ref. |
| `ygg-cli wt list` | List all managed worktrees and their status. |
| `ygg-cli wt delete` | Interactively select and remove a worktree. |
| `ygg-cli wt bootstrap` | Re-run the setup commands for an existing worktree. |
| `ygg-cli wt prune` | Clean up Git's internal data for worktrees. |

---

## 📄 License

ISC License.
