import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { section, list, error } from "../lib/format-response";

const refSchema = z
  .string()
  .min(1)
  .refine((val) => !val.startsWith("-") && !val.includes("--") && !/[\0\n]/.test(val), {
    message: "Ref must not contain flags or invalid characters",
  });

const GetShortlogArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  ref: refSchema.default("HEAD").describe("Ref to summarize (default: HEAD)"),
  summary: z
    .boolean()
    .optional()
    .default(true)
    .describe("If true, show summary counts only (-s); if false, show commit messages"),
  limit: z.number().min(1).max(1000).optional().default(20).describe("Max commits to consider (via -n)"),
});

export function registerGetShortlog(server: McpServer): void {
  server.registerTool(
    "get_shortlog",
    {
      title: "Shortlog",
      description:
        "Summarize commit counts by author. Useful for contributor stats. " +
        "Equivalent to git shortlog.",
      inputSchema: GetShortlogArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const parsed = GetShortlogArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const cmd = ["shortlog", "-n", String(parsed.limit)];
        if (parsed.summary) cmd.push("-s");
        cmd.push(parsed.ref);

        const result = await git.raw(cmd);
        const trimmed = result?.trim();

        if (!trimmed) {
          return textResponse(section("Shortlog", "📊") + "  (no commits)");
        }

        const lines = trimmed.split("\n").filter(Boolean);
        const header = section("Shortlog", "📊");
        return textResponse(header + list(lines));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
