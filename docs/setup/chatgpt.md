# Git Mind MCP — ChatGPT Setup

ChatGPT supports MCP through **ChatGPT Apps** (workspace feature) and the **OpenAI Agents SDK**. Git Mind MCP works with both.

## Prerequisites

- ChatGPT Business, Enterprise, or Edu (for workspace Apps)
- Node.js 22+ (for running Git Mind)
- A Git repository (your project)

## Option 1: ChatGPT Apps (Workspace Admins)

ChatGPT Apps let workspace admins add MCP servers for the whole workspace.

### Requirements

- Workspace admin access
- Developer mode enabled: **Workspace Settings** → **Permissions & Roles** → **Developer mode**
- MCP server reachable (see below)

### Making Git Mind Reachable

Git Mind runs as a local stdio server. To use it with ChatGPT Apps you need to expose it over HTTP. Options:

1. **Streamable HTTP** — Run a bridge that speaks MCP over HTTP (e.g. [mcp-http-bridge](https://github.com/modelcontextprotocol/servers) or similar)
2. **Self-hosted MCP over HTTP** — Wrap Git Mind in an HTTP transport

ChatGPT Apps expect an HTTP endpoint. For local stdio servers like Git Mind, you typically run a local HTTP proxy that spawns the stdio process and forwards requests.

### Setup Steps (once HTTP endpoint exists)

1. Go to **Workspace Settings** → **Apps** → **Create**
2. Configure the app with:
   - MCP server URL (your HTTP endpoint)
   - Authentication (if required)
3. Publish the app for the workspace

See [OpenAI’s MCP documentation](https://developers.openai.com/api/docs/mcp) for current details.

## Option 2: OpenAI Agents SDK

The [OpenAI Agents SDK](https://github.com/openai/openai-agents) supports MCP servers, including stdio-based ones like Git Mind.

### Quick Example (Node.js)

```javascript
import { McpClient } from "@openai/agents";

const client = await McpClient.fromProcess({
  command: "npx",
  args: ["-y", "git-mind-mcp", "/path/to/repo"],
});

// Use client to call Git Mind tools
const result = await client.callTool("get_status", {});
```

Use the SDK when building custom agent applications that need Git operations.

## Option 3: Use Cursor or Claude Desktop

For the simplest setup, use **Cursor** or **Claude Desktop** with Git Mind:

- [Cursor Setup](./cursor.md) — `.cursor/mcp.json` or UI settings
- [Claude Desktop Setup](./claude-desktop.md) — `claude_desktop_config.json`

Both support local stdio MCP servers directly, with no HTTP bridge.

## See Also

- [Safety Model](../safety.md) — Config, protected branches, guardrails
- [OpenAI MCP Docs](https://developers.openai.com/api/docs/mcp)
