import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetStatus } from "./get-status.js";
import { registerGetCommitHistory } from "./get-commit-history.js";
import { registerGetDiff } from "./get-diff.js";
import { registerGetBlame } from "./get-blame.js";
import { registerGetBranches } from "./get-branches.js";
import { registerSuggestCommitMessage } from "./suggest-commit-message.js";

export function registerAllTools(server: McpServer): void {
  registerGetStatus(server);
  registerGetCommitHistory(server);
  registerGetDiff(server);
  registerGetBlame(server);
  registerGetBranches(server);
  registerSuggestCommitMessage(server);
}
