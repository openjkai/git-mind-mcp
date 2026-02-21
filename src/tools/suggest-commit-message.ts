import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";

const SuggestCommitMessageArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
});

export function registerSuggestCommitMessage(server: McpServer): void {
  server.registerTool(
    "suggest_commit_message",
    {
      title: "Suggest Commit Message",
      description:
        "Get the staged diff to help suggest a commit message. Returns the diff of staged changes " +
        "so the AI can propose a conventional commit message based on the changes.",
      inputSchema: SuggestCommitMessageArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const parsed = SuggestCommitMessageArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const diff = await git.diff(["--cached", "--stat"]);
        const text =
          diff ||
          "No staged changes. Use 'git add' to stage files first.";
        return textResponse(text);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
