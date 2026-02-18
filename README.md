# Git Mind MCP

**MCP server for Git intelligence** — status, commits, diffs, blame, branches, and commit message suggestions. Integrates with [LibreChat](https://librechat.ai) and any MCP-compatible AI client.

## Features

- `get_status` — Working tree and staged changes
- `get_commit_history` — Recent commits with author, date, message
- `get_diff` — Diffs for working tree, staged, or between refs
- `get_blame` — Who last modified each line of a file
- `get_branches` — Local and remote branches
- `suggest_commit_message` — Staged diff for AI to suggest commit messages

## Installation

```bash
npm install -g git-mind-mcp
# or
npx git-mind-mcp
```

## Usage

### Standalone (stdio)

```bash
# Use current directory as repo
npx git-mind-mcp

# Specify repo path
npx git-mind-mcp /path/to/your/repo
```

### LibreChat

See [LibreChat Integration](docs/integrations/librechat.md) for detailed setup. Quick start — add to `librechat.yaml`:

```yaml
mcpServers:
  git-mind:
    type: stdio
    command: npx
    args:
      - -y
      - git-mind-mcp
      - /path/to/your/repo   # optional; omit to use process cwd
    timeout: 30000
```

For submodule or local development setup, see [LibreChat Integration](docs/integrations/librechat.md).

## Development

```bash
npm install
npm run build
npm run dev    # Run with tsx (no build needed)
npm test
```

## License

MIT
