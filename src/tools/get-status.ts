import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit } from "../lib/git";

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
      const parsed = GetStatusArgsSchema.parse(args);
      const git = getGit(parsed.repoPath);

      const status = await git.status();
      const lines: string[] = [];

      if (status.current) {
        lines.push(`Current branch: ${status.current}`);
      }

      if (status.staged.length > 0) {
        lines.push("\nStaged changes:");
        status.staged.forEach((f) => lines.push(`  + ${f}`));
      }
      if (status.modified.length > 0) {
        lines.push("\nModified (not staged):");
        status.modified.forEach((f) => lines.push(`  M ${f}`));
      }
      if (status.not_added.length > 0) {
        lines.push("\nUntracked:");
        status.not_added.forEach((f) => lines.push(`  ? ${f}`));
      }
      if (status.deleted.length > 0) {
        lines.push("\nDeleted:");
        status.deleted.forEach((f) => lines.push(`  - ${f}`));
      }
      if (status.conflicted.length > 0) {
        lines.push("\nConflicted:");
        status.conflicted.forEach((f) => lines.push(`  ! ${f}`));
      }

      const text = lines.length > 0 ? lines.join("\n") : "Working tree clean. No changes.";
      return {
        content: [{ type: "text" as const, text }],
        structuredContent: { content: text },
      };
    },
  );
}
