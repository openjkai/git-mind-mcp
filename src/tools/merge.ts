import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, toLocalBranchName, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed, isProtectedBranch } from "../lib/guard";

const MergeArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  branch: z.string().describe("Branch or ref to merge into the current branch"),
});

export function registerMerge(server: McpServer): void {
  server.registerTool(
    "merge",
    {
      title: "Merge",
      description:
        "Merge a branch into the current branch. Cannot merge into protected branches (main, master). " +
        "Equivalent to git merge <branch>.",
      inputSchema: MergeArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("merge");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = MergeArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const status = await git.status();
        const currentBranch = status.current;
        if (!currentBranch) {
          return textResponse("Cannot merge in detached HEAD state.");
        }

        const currentName = toLocalBranchName(currentBranch);
        if (isProtectedBranch(currentName)) {
          return textResponse(
            `Cannot merge into protected branch '${currentName}'. ` +
              "Checkout a different branch first, or adjust GIT_MIND_PROTECTED_BRANCHES.",
          );
        }

        const branchToMerge = toLocalBranchName(parsed.branch);
        const result = await git.merge([branchToMerge]);

        if (result.failed) {
          const conflicts = result.conflicts ?? [];
          const conflictList =
            conflicts.length > 0
              ? conflicts.map((c) => c.file ?? "?").join(", ")
              : "unknown";
          return textResponse(
            `Merge failed (conflicts). Conflicting files: ${conflictList}`,
          );
        }

        const summary = result.summary;
        const changes = summary?.changes ?? 0;
        const insertions = summary?.insertions ?? 0;
        const deletions = summary?.deletions ?? 0;
        const merges = result.merges?.length ?? 0;

        const lines = [`Merged ${branchToMerge} into ${currentName}.`];
        if (merges > 0) lines.push(`  Files merged: ${merges}`);
        if (changes > 0) lines.push(`  Files changed: ${changes}`);
        if (insertions > 0) lines.push(`  Insertions: ${insertions}`);
        if (deletions > 0) lines.push(`  Deletions: ${deletions}`);

        return textResponse(lines.join("\n"));
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
