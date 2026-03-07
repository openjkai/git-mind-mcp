import { z } from "zod";
import { resolve } from "path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { success, error, section, list } from "../lib/format-response";
import { checkOperationAllowed, isDryRun, isProtectedBranch } from "../lib/guard";
import { toLocalBranchName } from "../lib/git";

const refSchema = z
  .string()
  .min(1)
  .refine((val) => !val.startsWith("-") && !val.includes("--") && !/[\0\n]/.test(val), {
    message: "Ref must not contain flags or invalid characters",
  });

const pathSchema = (name: string) =>
  z
    .string()
    .min(1)
    .refine((val) => !val.includes("..") && !val.startsWith("-"), {
      message: `${name} must not contain '..' or start with '-'`,
    });

const WorktreeArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  action: z
    .enum(["add", "list", "remove"])
    .describe("add: add worktree; list: list worktrees; remove: remove worktree"),
  path: pathSchema("path").optional().describe("Worktree path (required for add/remove)"),
  branch: refSchema.optional().describe("Branch to check out in new worktree (for add)"),
});

export function registerWorktree(server: McpServer): void {
  server.registerTool(
    "worktree",
    {
      title: "Worktree",
      description:
        "Manage multiple working trees. Add a worktree for another branch, list worktrees, or remove one. " +
        "Useful for working on multiple branches simultaneously. Equivalent to git worktree add/list/remove.",
      inputSchema: WorktreeArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("worktree");
        if (!guard.allowed) {
          return textResponse(error(guard.reason ?? "Operation not allowed."));
        }

        const parsed = WorktreeArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        if (parsed.action === "list") {
          const out = await git.raw(["worktree", "list"]);
          const lines = out?.trim().split("\n").filter(Boolean) ?? [];
          const header = section("Worktrees", "📁");
          return textResponse(header + list(lines));
        }

        if (parsed.action === "add") {
          if (!parsed.path?.trim()) {
            return textResponse(error("Missing 'path' for worktree add."));
          }
          if (parsed.branch && isProtectedBranch(toLocalBranchName(parsed.branch))) {
            return textResponse(
              error(`Cannot create worktree for protected branch '${parsed.branch}'.`),
            );
          }
          if (isDryRun()) {
            return textResponse(
              `[DRY RUN] Would execute: worktree add ${parsed.path}${parsed.branch ? ` ${parsed.branch}` : ""}`,
            );
          }
          const absPath = resolve(process.cwd(), parsed.path);
          const addArgs = parsed.branch
            ? ["worktree", "add", absPath, parsed.branch]
            : ["worktree", "add", absPath];
          await git.raw(addArgs);
          return textResponse(success("Worktree added", `${parsed.path}${parsed.branch ? ` (${parsed.branch})` : ""}`));
        }

        // action === "remove"
        if (!parsed.path?.trim()) {
          return textResponse(error("Missing 'path' for worktree remove."));
        }
        if (isDryRun()) {
          return textResponse(`[DRY RUN] Would execute: worktree remove ${parsed.path}`);
        }
        const absPath = resolve(process.cwd(), parsed.path);
        await git.raw(["worktree", "remove", absPath]);
        return textResponse(success("Worktree removed", parsed.path));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
