import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, toLocalBranchName, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed, isDryRun, isProtectedBranch } from "../lib/guard";

const RebaseArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  action: z
    .enum(["rebase", "abort", "continue"])
    .default("rebase")
    .describe("rebase: rebase onto target; abort: abort in-progress rebase; continue: continue after resolving conflicts"),
  onto: z
    .string()
    .optional()
    .describe("Branch or ref to rebase onto (required when action=rebase)")
    .refine((val) => !val || !val.startsWith("-"), { message: "onto must not start with '-' (git flag injection)" })
    .refine((val) => !val || !/^\s/.test(val), { message: "onto must not have leading whitespace" })
    .refine((val) => !val || !val.includes("--"), { message: "onto must not contain '--'" })
    .refine((val) => !val || !/[\0\n]/.test(val), { message: "onto must not contain null or newline" }),
});

export function registerRebase(server: McpServer): void {
  server.registerTool(
    "rebase",
    {
      title: "Rebase",
      description:
        "Rebase the current branch onto another branch or ref. Cannot rebase protected branches (main, master). " +
        "Use action=abort to abort an in-progress rebase, or action=continue after resolving conflicts. " +
        "Equivalent to git rebase <onto>.",
      inputSchema: RebaseArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("rebase");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = RebaseArgsSchema.parse(args);

        if (parsed.action === "rebase") {
          if (!parsed.onto || parsed.onto.trim().length === 0) {
            return textResponse(
              "Missing 'onto' parameter. Specify the branch or ref to rebase onto (e.g. main, origin/develop).",
            );
          }
        }

        if (parsed.action === "rebase" && isDryRun()) {
          return textResponse(
            `[DRY RUN] Would execute: rebase onto ${parsed.onto}`,
          );
        }

        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        if (parsed.action === "abort") {
          await git.raw(["rebase", "--abort"]);
          return textResponse("Rebase aborted.");
        }

        if (parsed.action === "continue") {
          await git.raw(["rebase", "--continue"]);
          return textResponse("Rebase continued successfully.");
        }

        // action === "rebase"
        const status = await git.status();
        const currentBranch = status.current;
        if (!currentBranch) {
          return textResponse("Cannot rebase in detached HEAD state.");
        }

        const currentNameForCheck = currentBranch.startsWith("remotes/")
          ? toLocalBranchName(currentBranch)
          : currentBranch;
        if (isProtectedBranch(currentNameForCheck)) {
          return textResponse(
            `Cannot rebase protected branch '${currentBranch}'. ` +
              "Checkout a different branch first, or adjust GIT_MIND_PROTECTED_BRANCHES.",
          );
        }

        try {
          await git.raw(["rebase", parsed.onto!]);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("CONFLICT") || msg.includes("conflict")) {
            return textResponse(
              "Rebase has conflicts. Resolve them, stage the files, then use action=continue to finish, or action=abort to cancel.",
            );
          }
          throw err;
        }

        return textResponse(`Rebased ${currentBranch} onto ${parsed.onto}.`);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
