import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed } from "../lib/guard";

const StashArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  action: z
    .enum(["push", "pop", "list"])
    .describe("push: stash working tree; pop: apply and remove top stash; list: show stashes"),
  message: z
    .string()
    .optional()
    .describe("Optional message for stash push (e.g. 'WIP: feature work')"),
  ref: z
    .string()
    .optional()
    .describe("Stash ref for pop (e.g. stash@{1}); defaults to stash@{0}"),
});

export function registerStash(server: McpServer): void {
  server.registerTool(
    "stash",
    {
      title: "Stash",
      description:
        "Stash working changes (push), apply and remove a stash (pop), or list stashes. " +
        "Equivalent to git stash push/pop/list.",
      inputSchema: StashArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("stash");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = StashArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        if (parsed.action === "list") {
          const result = await git.stashList();
          const entries = result.all ?? [];
          if (entries.length === 0) {
            return textResponse("No stashes.");
          }
          const lines = entries.map((e, i) => {
            const hash = e.hash?.slice(0, 7) ?? "?";
            const msg = e.message?.trim() ?? "(no message)";
            return `  stash@{${i}}: ${hash} ${msg}`;
          });
          return textResponse(`Stashes (${entries.length}):\n${lines.join("\n")}`);
        }

        if (parsed.action === "push") {
          const stashArgs: string[] = ["push"];
          if (parsed.message) {
            stashArgs.push("-m", parsed.message);
          }
          await git.stash(stashArgs);
          const msg = parsed.message ? ` with message "${parsed.message}"` : "";
          return textResponse(`Stashed working changes${msg}.`);
        }

        if (parsed.action === "pop") {
          const ref = parsed.ref ?? "stash@{0}";
          await git.stash(["pop", ref]);
          return textResponse(`Applied and removed ${ref}.`);
        }

        return textResponse("Unknown action.");
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
