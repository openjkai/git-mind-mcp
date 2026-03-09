import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { section, kv, emptyState, error } from "../lib/format-response";

const GetCurrentBranchArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
});

export function registerGetCurrentBranch(server: McpServer): void {
  server.registerTool(
    "get_current_branch",
    {
      title: "Get Current Branch",
      description:
        "Get the current branch name. Returns HEAD branch (e.g. main, develop). " +
        "Useful before checkout or commit. Equivalent to git branch --show-current.",
      inputSchema: GetCurrentBranchArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const parsed = GetCurrentBranchArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const branch = await git.raw(["rev-parse", "--abbrev-ref", "HEAD"]);
        const trimmed = branch?.trim();

        if (!trimmed || trimmed === "HEAD") {
          return textResponse(section("Current Branch", "🌿") + "  " + emptyState("Detached HEAD (no branch)", "📌"));
        }

        return textResponse(section("Current Branch", "🌿") + kv("branch", trimmed));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
