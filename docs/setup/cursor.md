# Git Mind MCP — Cursor Setup

Configure Git Mind MCP as an MCP server in [Cursor](https://cursor.com) for AI-assisted Git operations inside your editor.

## Prerequisites

- Cursor IDE v0.40 or later
- Node.js 22+ (Git Mind requires Node 22)
- A Git repository (your project)

## Configuration

### Option 1: UI Settings

1. Open **Cursor Settings** → **Tools & MCP** (`Cmd+,` on macOS, `Ctrl+,` on Windows)
2. Click **Add new MCP server**
3. Fill in:
   - **Name**: `git-mind`
   - **Type**: `command`
   - **Command**: `npx`
   - **Args**: `-y`, `git-mind-mcp`, `/path/to/your/repo`
     - Use your project path (or omit the repo path to use Cursor’s current working directory)
4. Click **Install** and restart Cursor

### Option 2: Project Config (`.cursor/mcp.json`)

Create `.cursor/mcp.json` in your project root for team-wide setup:

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

With a specific repo path:

```json
{
  "mcpServers": {
    "git-mind": {
      "command": "npx",
      "args": ["-y", "git-mind-mcp", "/home/user/my-project"],
      "env": {}
    }
  }
}
```

### Optional: Enable More Operations

By default only `stage`, `unstage`, and `commit` are allowed. To enable push, pull, merge, etc., add env vars:

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

After restart, the Cursor AI agent can use Git Mind tools for status, diffs, staging, commits, push, pull, and more. Ask it to “show git status” or “stage my changes” to confirm.

## See Also

- [Safety Model](../safety.md) — Config, protected branches, guardrails
- [LibreChat Integration](../integrations/librechat.md) — Alternative MCP host
