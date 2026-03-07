import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import * as fmt from "../lib/format-response";

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
      try {
        const parsed = GetBranchesArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const branch = await git.branch(["-a", "-v"]);
        const lines = branch.all.map((b) => {
          const marker = branch.current === b ? "📍 " : "   ";
          return `${marker}${fmt.code(b)}`;
        });

        const text =
          lines.length > 0
            ? fmt.section("Branches", "🌿") + fmt.kv("Current", fmt.code(branch.current ?? "(detached)")) + "\n\n" + lines.join("\n")
            : fmt.emptyState("No branches found.", "🌿");
        return textResponse(text);
      } catch (e) {
        return textResponse(fmt.error(formatGitError(e)));
      }
    },
  );
}
