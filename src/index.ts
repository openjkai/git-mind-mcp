#!/usr/bin/env node

/**
 * Git Mind MCP - Local Git intelligence for AI assistants
 * Exposes: status, commits, diffs, blame, branches, commit message suggestions
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index";

// Optional: repo path from first CLI arg (for LibreChat: args in librechat.yaml)
const repoPathArg = process.argv[2];
if (repoPathArg) {
  process.chdir(repoPathArg);
}

const server = new McpServer({
  name: "git-mind-mcp",
  version: "1.0.0",
});

registerAllTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Git Mind MCP server running on stdio");
  if (repoPathArg) {
    console.error(`Repository: ${repoPathArg}`);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
