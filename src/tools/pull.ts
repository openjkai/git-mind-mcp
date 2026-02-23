import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed } from "../lib/guard";

const PullArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  remote: z.string().optional().default("origin").describe("Remote name (default: origin)"),
  branch: z.string().optional().describe("Branch to pull (default: current branch)"),
});

export function registerPull(server: McpServer): void {
  server.registerTool(
    "pull",
    {
      title: "Pull",
      description:
        "Pull changes from a remote. Uses current branch if branch not specified. " +
        "Equivalent to git pull.",
      inputSchema: PullArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("pull");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = PullArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const status = await git.status();
        const branch = parsed.branch ?? status.current;
        const result = branch
          ? await git.pull(parsed.remote, branch)
          : await git.pull(parsed.remote);

        const summary = result.summary;
        const changes = summary?.changes ?? 0;
        const insertions = summary?.insertions ?? 0;
        const deletions = summary?.deletions ?? 0;

        if (changes === 0 && insertions === 0 && deletions === 0) {
          return textResponse("Already up to date.");
        }

        const lines = ["Pull complete."];
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
