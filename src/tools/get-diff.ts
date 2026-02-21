import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";

const GetDiffArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  ref: z.string().optional().describe("Commit or branch to diff against (e.g. main, HEAD~1)"),
  filePath: z.string().optional().describe("Specific file to diff"),
});

export function registerGetDiff(server: McpServer): void {
  server.registerTool(
    "get_diff",
    {
      title: "Get Diff",
      description:
        "Get the diff (changes) for the working tree, staged files, or between commits. " +
        "Use ref to compare against a branch or commit. Use filePath to limit to one file.",
      inputSchema: GetDiffArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const parsed = GetDiffArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        let diff: string;
        if (parsed.ref) {
          diff = await git.diff([parsed.ref, parsed.filePath].filter(Boolean) as string[]);
        } else if (parsed.filePath) {
          diff = await git.diff(["--", parsed.filePath]);
        } else {
          diff = await git.diff();
        }

        const text = diff || "No diff (working tree matches HEAD).";
        return textResponse(text);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
