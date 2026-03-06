import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import * as fmt from "../lib/format-response";

const GetStatusArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository (defaults to current directory)"),
});

export function registerGetStatus(server: McpServer): void {
  server.registerTool(
    "get_status",
    {
      title: "Get Git Status",
      description:
        "Get the working tree status including staged and unstaged changes. " +
        "Returns a summary of modified, added, deleted, and untracked files.",
      inputSchema: GetStatusArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const parsed = GetStatusArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const status = await git.status();
        const parts: string[] = [];

        if (status.current) {
          parts.push(fmt.section("Branch", "🌿") + fmt.kv("Current", fmt.code(status.current)));
        }

        if (status.staged.length > 0) {
          parts.push(fmt.section("Staged", "🟢") + fmt.list(status.staged.map((f) => fmt.code(f))));
        }
        if (status.modified.length > 0) {
          parts.push(fmt.section("Modified (not staged)", "🟡") + fmt.list(status.modified.map((f) => fmt.code(f))));
        }
        if (status.not_added.length > 0) {
          parts.push(fmt.section("Untracked", "⚪") + fmt.list(status.not_added.map((f) => fmt.code(f))));
        }
        if (status.deleted.length > 0) {
          parts.push(fmt.section("Deleted", "🔴") + fmt.list(status.deleted.map((f) => fmt.code(f))));
        }
        if (status.conflicted.length > 0) {
          parts.push(fmt.section("Conflicted", "🔶") + fmt.list(status.conflicted.map((f) => fmt.code(f))));
        }

        const text =
          parts.length > 0 ? parts.join("\n") : fmt.success("Working tree clean", "No changes to commit.");
        return textResponse(text);
      } catch (e) {
        return textResponse(fmt.error(formatGitError(e)));
      }
    },
  );
}
