import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { success, error } from "../lib/format-response";
import { checkOperationAllowed, isDryRun } from "../lib/guard";

const CleanArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  dryRun: z
    .boolean()
    .optional()
    .default(true)
    .describe("If true, only show what would be removed (default: true for safety)"),
  directories: z.boolean().optional().default(false).describe("Remove untracked directories too (-d)"),
  ignored: z.boolean().optional().default(false).describe("Remove ignored files too (-x)"),
});

export function registerClean(server: McpServer): void {
  server.registerTool(
    "clean",
    {
      title: "Clean",
      description:
        "Remove untracked files from the working tree. Default is dry-run (show only). " +
        "Set dryRun=false to actually remove. Equivalent to git clean -n (dry) or -f (force).",
      inputSchema: CleanArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("clean");
        if (!guard.allowed) {
          return textResponse(error(guard.reason ?? "Operation not allowed."));
        }

        const parsed = CleanArgsSchema.parse(args);

        if (isDryRun() || parsed.dryRun) {
          const git = getGit(parsed.repoPath);
          await validateRepo(parsed.repoPath);
          const mode = "n";
          const switches = [mode, parsed.directories ? "d" : "", parsed.ignored ? "x" : ""].filter(Boolean).join("");
          const result = await git.clean(switches);
          const output = result?.trim() || "Nothing to clean.";
          return textResponse(`[DRY RUN] Would remove:\n${output}`);
        }

        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);
        const switches = ["f", parsed.directories ? "d" : "", parsed.ignored ? "x" : ""].filter(Boolean).join("");
        await git.clean(switches);

        return textResponse(success("Cleaned", "Untracked files removed."));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
