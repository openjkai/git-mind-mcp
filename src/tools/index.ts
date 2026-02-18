import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetStatus } from "./get-status";
import { registerGetCommitHistory } from "./get-commit-history";
import { registerGetDiff } from "./get-diff";
import { registerGetBlame } from "./get-blame";
import { registerGetBranches } from "./get-branches";
import { registerSuggestCommitMessage } from "./suggest-commit-message";

export function registerAllTools(server: McpServer): void {
  registerGetStatus(server);
  registerGetCommitHistory(server);
  registerGetDiff(server);
  registerGetBlame(server);
  registerGetBranches(server);
  registerSuggestCommitMessage(server);
}
