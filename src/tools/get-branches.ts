import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit } from "../lib/git.js";

const GetBranchesArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
});

export function registerGetBranches(server: McpServer): void {
  server.registerTool(
    "get_branches",
    {
      title: "Get Branches",
      description:
        "List all local and remote branches. Shows current branch with an asterisk. " +
        "Useful for understanding branch structure before merging or switching.",
      inputSchema: GetBranchesArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      const parsed = GetBranchesArgsSchema.parse(args);
      const git = getGit(parsed.repoPath);

      const branch = await git.branch(["-a", "-v"]);
      const lines: string[] = [];

      lines.push("Local branches:");
      branch.all.forEach((b) => {
        const current = branch.current === b ? " * " : "   ";
        lines.push(`${current}${b}`);
      });

      const text = lines.join("\n");
      return {
        content: [{ type: "text" as const, text }],
        structuredContent: { content: text },
      };
    },
  );
}
