import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, toLocalBranchName, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed, isProtectedBranch } from "../lib/guard";

const RevertArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  commit: z.string().describe("Commit to revert (hash, HEAD~n, or ref)"),
});

export function registerRevert(server: McpServer): void {
  server.registerTool(
    "revert",
    {
      title: "Revert",
      description:
        "Create a new commit that undoes a previous commit. Cannot revert on protected branches (main, master). " +
        "Equivalent to git revert <commit>.",
      inputSchema: RevertArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("revert");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = RevertArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const status = await git.status();
        const currentBranch = status.current;
        if (!currentBranch) {
          return textResponse("Cannot revert in detached HEAD state.");
        }

        const currentNameForCheck = currentBranch.startsWith("remotes/")
          ? toLocalBranchName(currentBranch)
          : currentBranch;
        if (isProtectedBranch(currentNameForCheck)) {
          return textResponse(
            `Cannot revert on protected branch '${currentBranch}'. ` +
              "Checkout a different branch first, or adjust GIT_MIND_PROTECTED_BRANCHES.",
          );
        }

        await git.revert(parsed.commit);
        return textResponse(`Reverted ${parsed.commit} on ${currentBranch}.`);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
