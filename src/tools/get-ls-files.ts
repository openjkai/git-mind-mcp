import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { section, list, error } from "../lib/format-response";

const GetLsFilesArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  staged: z
    .boolean()
    .optional()
    .default(false)
    .describe("If true, list only staged files (--cached)"),
  deleted: z
    .boolean()
    .optional()
    .default(false)
    .describe("If true, include deleted files in output"),
  others: z
    .boolean()
    .optional()
    .default(false)
    .describe("If true, include untracked/ignored (--others)"),
});

export function registerGetLsFiles(server: McpServer): void {
  server.registerTool(
    "get_ls_files",
    {
      title: "List Files",
      description:
        "List files tracked by Git (or staged, or others). " +
        "Useful for understanding repository structure. Equivalent to git ls-files.",
      inputSchema: GetLsFilesArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const parsed = GetLsFilesArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const cmd = ["ls-files"];
        if (parsed.staged) cmd.push("--cached");
        if (parsed.deleted) cmd.push("--deleted");
        if (parsed.others) cmd.push("--others", "--exclude-standard");

        const result = await git.raw(cmd);
        const lines = result?.trim().split("\n").filter(Boolean) ?? [];

        const header = section("Files", "📁");
        const body = lines.length ? list(lines) : "  (none)";
        return textResponse(header + body);
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
