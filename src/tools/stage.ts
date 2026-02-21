import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed } from "../lib/guard";

const StageArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository (defaults to current directory)"),
  files: z
    .union([z.string(), z.array(z.string())])
    .describe("File path(s) to stage. Use '.' or '*' to stage all changes."),
});

export function registerStage(server: McpServer): void {
  server.registerTool(
    "stage",
    {
      title: "Stage Files",
      description:
        "Stage (add) files to the index for the next commit. " +
        "Pass a single path, array of paths, '.' or '*' to stage all changes.",
      inputSchema: StageArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("stage");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = StageArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const files = Array.isArray(parsed.files) ? parsed.files : [parsed.files];
        await git.add(files);

        const list = files.length === 1 ? files[0] : files.join(", ");
        return textResponse(`Staged ${list}.`);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
