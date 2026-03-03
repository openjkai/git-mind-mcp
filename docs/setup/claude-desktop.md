# Git Mind MCP — Claude Desktop Setup

Configure Git Mind MCP as an MCP server in [Claude Desktop](https://claude.ai/download) for AI-assisted Git operations in the desktop app.

## Prerequisites

- Claude Desktop (latest version)
- Node.js 22+ (Git Mind requires Node 22)
- A Git repository (your project)

## Configuration

1. Open **Claude Desktop** → **Settings** (gear icon) → **Developer** → **Edit Config**
2. Add `git-mind` under `mcpServers` in the JSON config
3. Save, **fully quit** Claude Desktop, and restart

### Config File Locations

| OS | Path |
|----|------|
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |

### Example Config

```json
{
  "mcpServers": {
    "git-mind": {
      "command": "npx",
      "args": ["-y", "git-mind-mcp", "/path/to/your/repo"],
      "env": {}
    }
  }
}
```

Omit the repo path to use Claude Desktop’s working directory:

```json
{
  "mcpServers": {
    "git-mind": {
      "command": "npx",
      "args": ["-y", "git-mind-mcp"],
      "env": {}
    }
  }
}
```

### Optional: Enable More Operations

By default only `stage`, `unstage`, and `commit` are allowed. To enable push, pull, merge, etc.:

```json
{
  "mcpServers": {
    "git-mind": {
      "command": "npx",
      "args": ["-y", "git-mind-mcp"],
      "env": {
        "GIT_MIND_ALLOWED_ACTIONS": "stage,unstage,commit,push,pull,checkout,create_branch,delete_branch,merge,stash,fetch,reset,cherry_pick,revert,tag"
      }
    }
  }
}
```

### Optional: Dry-Run Mode

Use dry-run to preview critical operations without executing:

```json
{
  "env": {
    "GIT_MIND_DRY_RUN": "1"
  }
}
```

## Verifying

After restart, look for the **hammer (🔨)** icon; it indicates MCP tools are loaded. You can ask Claude to “show git status” or “stage my changes” to confirm.

## Troubleshooting

- **Tools not appearing**: Ensure you fully quit and restart Claude Desktop, not just close the window
- **Command not found**: Ensure Node.js 22+ is installed and `npx` is on your PATH
- **Wrong repo**: Use an absolute path for the repo in `args`

## See Also

- [Safety Model](../safety.md) — Config, protected branches, guardrails
- [Cursor Setup](./cursor.md) — Alternative MCP host
