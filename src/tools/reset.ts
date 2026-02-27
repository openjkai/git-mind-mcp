import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed } from "../lib/guard";

const ResetArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  mode: z
    .enum(["soft", "mixed"])
    .default("mixed")
    .describe("soft: keep changes staged; mixed: unstage but keep working tree (default)"),
  ref: z.string().describe("Commit to reset to (e.g. HEAD~1, abc1234, branch-name)"),
});

export function registerReset(server: McpServer): void {
  server.registerTool(
    "reset",
    {
      title: "Reset",
      description:
        "Reset HEAD to a commit. Only soft and mixed modes allowed (--hard is blocked). " +
        "soft: move HEAD, keep index; mixed: move HEAD, unstage, keep working tree. Equivalent to git reset --soft/--mixed <ref>.",
      inputSchema: ResetArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("reset");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = ResetArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const modeStr = parsed.mode === "soft" ? "soft" : "mixed";
        await git.raw(["reset", `--${modeStr}`, parsed.ref]);

        return textResponse(`Reset (${modeStr}) to ${parsed.ref}.`);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
