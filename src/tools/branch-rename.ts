import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { success, error } from "../lib/format-response";
import { checkOperationAllowed, isDryRun, isProtectedBranch } from "../lib/guard";

const refSchema = (name: string) =>
  z
    .string()
    .min(1)
    .refine((val) => !val.startsWith("-") && !val.includes("--") && !/[\0\n]/.test(val), {
      message: `${name} must not contain flags or invalid characters`,
    });

const BranchRenameArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  oldName: refSchema("oldName").describe("Current branch name to rename"),
  newName: refSchema("newName").describe("New branch name"),
});

export function registerBranchRename(server: McpServer): void {
  server.registerTool(
    "branch_rename",
    {
      title: "Rename Branch",
      description:
        "Rename a branch. Cannot rename protected branches (main, master). " +
        "Equivalent to git branch -m <old> <new>.",
      inputSchema: BranchRenameArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("branch_rename");
        if (!guard.allowed) {
          return textResponse(error(guard.reason ?? "Operation not allowed."));
        }

        const parsed = BranchRenameArgsSchema.parse(args);

        if (isDryRun()) {
          return textResponse(
            `[DRY RUN] Would execute: rename branch ${parsed.oldName} → ${parsed.newName}`,
          );
        }

        if (isProtectedBranch(parsed.oldName)) {
          return textResponse(
            error(
              `Cannot rename protected branch '${parsed.oldName}'. ` +
                "Adjust GIT_MIND_PROTECTED_BRANCHES to allow.",
            ),
          );
        }

        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const status = await git.status();
        const isCurrentBranch = status.current === parsed.oldName;

        await git.raw(["branch", "-m", parsed.oldName, parsed.newName]);

        return textResponse(
          success("Renamed branch", `${parsed.oldName} → ${parsed.newName}${isCurrentBranch ? " (current branch)" : ""}`),
        );
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
