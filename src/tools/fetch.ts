import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed } from "../lib/guard";

const FetchArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  remote: z
    .string()
    .optional()
    .describe("Remote name to fetch from (default: fetches all remotes)"),
});

export function registerFetch(server: McpServer): void {
  server.registerTool(
    "fetch",
    {
      title: "Fetch",
      description:
        "Fetch objects and refs from a remote. Updates local refs without merging. " +
        "Equivalent to git fetch.",
      inputSchema: FetchArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("fetch");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = FetchArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const result = parsed.remote
          ? await git.fetch(parsed.remote)
          : await git.fetch();

        const updated = result.updated ?? [];
        const tags = result.tags ?? [];
        const deleted = result.deleted ?? [];

        if (updated.length === 0 && tags.length === 0 && deleted.length === 0) {
          return textResponse("Already up to date.");
        }

        const lines = ["Fetch complete."];
        if (updated.length > 0) {
          lines.push(`  Updated: ${updated.map((u) => u.name).join(", ")}`);
        }
        if (tags.length > 0) {
          lines.push(`  Tags: ${tags.map((t) => t.name).join(", ")}`);
        }
        if (deleted.length > 0) {
          lines.push(`  Deleted: ${deleted.length} ref(s)`);
        }
        return textResponse(lines.join("\n"));
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
