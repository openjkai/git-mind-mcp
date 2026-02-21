import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed } from "../lib/guard";

const CommitArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository (defaults to current directory)"),
  message: z.string().min(1).describe("Commit message"),
});

export function registerCommit(server: McpServer): void {
  server.registerTool(
    "commit",
    {
      title: "Commit",
      description:
        "Create a commit with the staged changes. Stage files first with the stage tool. " +
        "Use a clear, descriptive commit message (conventional commits style recommended).",
      inputSchema: CommitArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("commit");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = CommitArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const result = await git.commit(parsed.message);

        if (!result.commit) {
          return textResponse(
            "Nothing to commit. Stage changes first with the stage tool, then commit.",
          );
        }

        return textResponse(`Committed: ${result.commit}\n${parsed.message}`);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
