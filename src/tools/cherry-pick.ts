import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, toLocalBranchName, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed, isProtectedBranch } from "../lib/guard";

const CherryPickArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  commit: z.string().describe("Commit to cherry-pick (hash, HEAD~n, or ref)"),
});

export function registerCherryPick(server: McpServer): void {
  server.registerTool(
    "cherry_pick",
    {
      title: "Cherry-pick",
      description:
        "Apply a commit onto the current branch. Cannot cherry-pick into protected branches (main, master). " +
        "Equivalent to git cherry-pick <commit>.",
      inputSchema: CherryPickArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("cherry_pick");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = CherryPickArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const status = await git.status();
        const currentBranch = status.current;
        if (!currentBranch) {
          return textResponse("Cannot cherry-pick in detached HEAD state.");
        }

        const currentNameForCheck = currentBranch.startsWith("remotes/")
          ? toLocalBranchName(currentBranch)
          : currentBranch;
        if (isProtectedBranch(currentNameForCheck)) {
          return textResponse(
            `Cannot cherry-pick into protected branch '${currentBranch}'. ` +
              "Checkout a different branch first, or adjust GIT_MIND_PROTECTED_BRANCHES.",
          );
        }

        try {
          await git.raw(["cherry-pick", parsed.commit]);
        } catch (err) {
          try {
            await git.raw(["cherry-pick", "--abort"]);
          } catch {
            /* best-effort cleanup */
          }
          throw err;
        }
        return textResponse(`Cherry-picked ${parsed.commit} onto ${currentBranch}.`);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
