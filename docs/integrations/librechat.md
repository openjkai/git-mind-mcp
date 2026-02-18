# LibreChat Integration

Configure Git Mind MCP as an MCP server in [LibreChat](https://librechat.ai) for AI-assisted Git operations.

## Prerequisites

- LibreChat installed and running
- Node.js 18+
- Git repository you want the AI to inspect

## Configuration

Add the `git-mind` server under `mcpServers` in your `librechat.yaml` (create from `librechat.example.yaml` if needed).

### Option 1: From npm (recommended)

Use once published, or for local testing with `npx`:

```yaml
mcpServers:
  git-mind:
    type: stdio
    command: npx
    args:
      - -y
      - git-mind-mcp
      - /path/to/your/repo    # omit to use LibreChat's working directory
    timeout: 30000
```

### Option 2: Local submodule

Add as a git submodule for development or self-hosted setups:

```bash
cd /path/to/LibreChat
git submodule add https://github.com/your-username/git-mind-mcp.git mcp-servers/git-mind
cd mcp-servers/git-mind && npm install && npm run build
```

Then in `librechat.yaml`:

```yaml
mcpServers:
  git-mind:
    type: stdio
    command: node
    args:
      - mcp-servers/git-mind/dist/index.js
      - /path/to/your/repo
    timeout: 30000
```

### Option 3: Local path (development)

When developing git-mind-mcp alongside LibreChat:

1. Build git-mind-mcp: `npm run build`
2. Add to `librechat.yaml`:

```yaml
mcpServers:
  git-mind:
    type: stdio
    command: node
    args:
      - /absolute/path/to/git-mind-mcp/dist/index.js
      - /path/to/repo
    timeout: 30000
```

Use absolute paths so LibreChat can locate the binary regardless of its working directory.

## Docker

When LibreChat runs in Docker, the MCP server runs inside the container. Choose one:

| Approach | When to use |
|----------|-------------|
| **npm** | Mount your repo into the container; use `npx git-mind-mcp /mounted/repo` |
| **Submodule** | Add git-mind as submodule and mount it; use `node mcp-servers/git-mind/dist/index.js` |

Ensure the repo path passed to the server exists inside the container (e.g. via volume mount).

## Troubleshooting

- **Server not appearing**: Restart LibreChat after editing `librechat.yaml`.
- **Permission denied**: Ensure `dist/index.js` is executable: `chmod +x dist/index.js` (or rebuild with `npm run build`).
- **Wrong repo**: The second `args` value is the Git repo path; use an absolute path to avoid ambiguity.
