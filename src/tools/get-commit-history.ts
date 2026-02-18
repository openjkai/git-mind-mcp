import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit } from "../lib/git.js";

const GetCommitHistoryArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  limit: z.number().optional().default(10).describe("Number of commits to return (default: 10)"),
});

export function registerGetCommitHistory(server: McpServer): void {
  server.registerTool(
    "get_commit_history",
    {
      title: "Get Commit History",
      description:
        "Get recent commit history with hash, author, date, and message. " +
        "Useful for understanding what changed recently or summarizing project history.",
      inputSchema: GetCommitHistoryArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      const parsed = GetCommitHistoryArgsSchema.parse(args);
      const git = getGit(parsed.repoPath);

      const log = await git.log({ maxCount: parsed.limit });
      const lines = log.all.map(
        (c) => `${c.hash.substring(0, 7)} | ${c.author_name} | ${c.date} | ${c.message}`,
      );
      const text = lines.length > 0 ? lines.join("\n") : "No commits found.";
      return {
        content: [{ type: "text" as const, text }],
        structuredContent: { content: text },
      };
    },
  );
}
