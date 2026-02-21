import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed } from "../lib/guard";

const UnstageArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository (defaults to current directory)"),
  files: z
    .union([z.string(), z.array(z.string())])
    .describe("File path(s) to unstage (remove from index). Use '.' to unstage all."),
});

export function registerUnstage(server: McpServer): void {
  server.registerTool(
    "unstage",
    {
      title: "Unstage Files",
      description:
        "Unstage (reset) files from the index. Removes them from the staging area but keeps changes in the working tree. " +
        "Pass a single path, array of paths, or '.' to unstage all.",
      inputSchema: UnstageArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("unstage");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = UnstageArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const files = Array.isArray(parsed.files) ? parsed.files : [parsed.files];
        await git.raw(["reset", "HEAD", "--", ...files]);

        const list = files.length === 1 ? files[0] : files.join(", ");
        return textResponse(`Unstaged ${list}.`);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
