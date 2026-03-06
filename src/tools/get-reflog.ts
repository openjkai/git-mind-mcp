import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { section, code, emptyState, error } from "../lib/format-response";

const GetReflogArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  limit: z.number().optional().default(20).describe("Number of reflog entries to return (default: 20)"),
});

export function registerGetReflog(server: McpServer): void {
  server.registerTool(
    "get_reflog",
    {
      title: "Get Reflog",
      description:
        "Get the reflog — a log of where HEAD and branch tips have been. " +
        "Useful for recovery after reset, finding lost commits, or debugging branch history.",
      inputSchema: GetReflogArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const parsed = GetReflogArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const result = await git.raw(["reflog", "-n", String(parsed.limit)]);

        if (!result || !result.trim()) {
          return textResponse(emptyState("No reflog entries found."));
        }

        const lines = result.trim().split("\n").filter(Boolean);
        const formatted = lines.map((line) => {
          const match = line.match(/^([a-f0-9]+)\s+(HEAD@\{\d+\}):\s+(.+)$/);
          if (match) {
            const [, hash, ref, action] = match;
            return `  ${code(hash!)} ${ref} ${action}`;
          }
          return `  ${line}`;
        });

        return textResponse(section("Reflog", "📜") + formatted.join("\n"));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
