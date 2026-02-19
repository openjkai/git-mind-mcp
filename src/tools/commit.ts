import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit } from "../lib/git";

const CommitArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository (defaults to current directory)"),
  message: z.string().min(1).describe("Commit message"),
});

export function registerCommit(server: McpServer): void {
  server.registerTool(
    "commit",
    {
      title: "Commit",
      description:
        "Create a commit with the staged changes. Stage files first with the stage tool. " +
        "Use a clear, descriptive commit message (conventional commits style recommended).",
      inputSchema: CommitArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      const parsed = CommitArgsSchema.parse(args);
      const git = getGit(parsed.repoPath);

      const result = await git.commit(parsed.message);

      if (!result.commit) {
        const text =
          "Nothing to commit. Stage changes first with the stage tool, then commit.";
        return {
          content: [{ type: "text" as const, text }],
          structuredContent: { content: text },
        };
      }

      const text = `Committed: ${result.commit}\n${parsed.message}`;
      return {
        content: [{ type: "text" as const, text }],
        structuredContent: { content: text },
      };
    },
  );
}
