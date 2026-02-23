import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed, isProtectedBranch } from "../lib/guard";

const DeleteBranchArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  branch: z.string().min(1).describe("Branch name to delete"),
  force: z.boolean().optional().default(false).describe("Force delete even if not merged"),
});

export function registerDeleteBranch(server: McpServer): void {
  server.registerTool(
    "delete_branch",
    {
      title: "Delete Branch",
      description:
        "Delete a local branch. Cannot delete protected branches (main, master). " +
        "Use force to delete unmerged branches.",
      inputSchema: DeleteBranchArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("delete_branch");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = DeleteBranchArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        if (isProtectedBranch(parsed.branch)) {
          return textResponse(
            `Cannot delete protected branch '${parsed.branch}'. ` +
              "Protected branches are configured in GIT_MIND_PROTECTED_BRANCHES.",
          );
        }

        const status = await git.status();
        if (status.current === parsed.branch) {
          return textResponse(
            `Cannot delete current branch '${parsed.branch}'. Checkout another branch first.`,
          );
        }

        await git.deleteLocalBranch(parsed.branch, parsed.force);
        return textResponse(`Deleted branch: ${parsed.branch}`);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
