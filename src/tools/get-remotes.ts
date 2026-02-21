import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";

const GetRemotesArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
});

export function registerGetRemotes(server: McpServer): void {
  server.registerTool(
    "get_remotes",
    {
      title: "Get Remotes",
      description:
        "List all remotes with their URLs. Useful for checking push/pull targets " +
        "and verifying private server configuration (SSH/HTTPS).",
      inputSchema: GetRemotesArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const parsed = GetRemotesArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const remotes = await git.getRemotes(true);

        if (!remotes || remotes.length === 0) {
          return textResponse("No remotes configured.");
        }

        const lines = remotes.flatMap((r) => {
          const refs = r.refs;
          if (!refs) return [`  ${r.name}\t(no URLs)`];
          const urls = [...new Set([refs.push, refs.fetch].filter(Boolean))];
          return urls.length > 0
            ? urls.map((u) => `  ${r.name}\t${u}`)
            : [`  ${r.name}\t(no URLs)`];
        });

        const text = "Remotes:\n" + lines.join("\n");
        return textResponse(text);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
