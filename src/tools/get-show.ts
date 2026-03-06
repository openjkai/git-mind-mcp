import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { section, code, error } from "../lib/format-response";

const refSchema = z
  .string()
  .min(1)
  .refine((val) => !val.startsWith("-") && !val.includes("--") && !/[\0\n]/.test(val), {
    message: "Ref must not contain flags or invalid characters",
  });

const GetShowArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  ref: refSchema.describe("Commit to show (hash, HEAD~n, branch name, or tag)"),
});

export function registerGetShow(server: McpServer): void {
  server.registerTool(
    "get_show",
    {
      title: "Get Show",
      description:
        "Show a specific commit — full message, author, date, and diff. " +
        "Useful for inspecting changes in a commit. Equivalent to git show <ref>.",
      inputSchema: GetShowArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const parsed = GetShowArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const result = await git.raw(["show", "--stat", parsed.ref]);

        if (!result || !result.trim()) {
          return textResponse(error("Commit not found or empty."));
        }

        const header = section("Commit", "📄") + `  ${code(parsed.ref)}\n\n`;
        return textResponse(header + result.trim());
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
