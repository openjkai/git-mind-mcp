import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { success, error } from "../lib/format-response";
import { checkOperationAllowed, isDryRun } from "../lib/guard";

const ApplyArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  patch: z.string().min(1).describe("Patch content (unified diff format) or path to patch file"),
  isPath: z
    .boolean()
    .optional()
    .default(false)
    .describe("If true, patch is a file path; if false, patch is the diff content"),
  check: z
    .boolean()
    .optional()
    .default(false)
    .describe("If true, only check if patch applies (dry-run, no changes)"),
});

export function registerApply(server: McpServer): void {
  server.registerTool(
    "apply",
    {
      title: "Apply Patch",
      description:
        "Apply a patch to the working tree. Patch can be inline diff content or path to a .patch file. " +
        "Use check=true to verify without applying. Equivalent to git apply.",
      inputSchema: ApplyArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("apply");
        if (!guard.allowed) {
          return textResponse(error(guard.reason ?? "Operation not allowed."));
        }

        const parsed = ApplyArgsSchema.parse(args);

        if (isDryRun() || parsed.check) {
          const git = getGit(parsed.repoPath);
          await validateRepo(parsed.repoPath);
          const applyArgs = parsed.check ? ["--check"] : ["--stat"];
          if (parsed.isPath) {
            await git.raw(["apply", ...applyArgs, "--", parsed.patch]);
          } else {
            await git.raw(["apply", ...applyArgs, "--stdin"], parsed.patch);
          }
          return textResponse(
            parsed.check
              ? success("Patch applies", "The patch would apply cleanly.")
              : `[DRY RUN] Would apply patch. Use check=false to apply.`,
          );
        }

        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        if (parsed.isPath) {
          await git.raw(["apply", "--", parsed.patch]);
        } else {
          await git.raw(["apply", "--stdin"], parsed.patch);
        }

        return textResponse(success("Applied", "Patch applied to working tree."));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
