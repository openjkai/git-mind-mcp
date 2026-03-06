import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import * as fmt from "../lib/format-response";

const refSchema = z
  .string()
  .refine((val) => !val.startsWith("-") && !val.includes("--") && !/[\0\n]/.test(val), {
    message: "Ref must not contain flags or invalid characters",
  })
  .optional();

const GetLogArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  limit: z.number().optional().default(20).describe("Number of commits (default: 20)"),
  from: refSchema.describe("Start of range (commit, branch, tag)"),
  to: refSchema.describe("End of range (default: HEAD)"),
  author: z.string().optional().describe("Filter by author (substring match)"),
  since: z.string().optional().describe("Commits after date (e.g. 2024-01-01, 2.weeks.ago)"),
  until: z.string().optional().describe("Commits before date"),
  path: z.string().optional().describe("Limit to commits touching this path"),
  oneline: z.boolean().optional().default(false).describe("Compact one-line format"),
});

export function registerGetLog(server: McpServer): void {
  server.registerTool(
    "get_log",
    {
      title: "Get Log",
      description:
        "Flexible git log with filters. Filter by author, date range, path, or commit range. " +
        "Useful for finding commits by criteria. Equivalent to git log with options.",
      inputSchema: GetLogArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const parsed = GetLogArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const logOptions: Record<string, unknown> = {
          maxCount: parsed.limit,
        };
        if (parsed.from) logOptions.from = parsed.from;
        if (parsed.to) logOptions.to = parsed.to;
        if (parsed.path) logOptions.file = parsed.path;
        if (parsed.author) logOptions["--author"] = parsed.author;
        if (parsed.since) logOptions["--since"] = parsed.since;
        if (parsed.until) logOptions["--until"] = parsed.until;

        const log = await git.log(logOptions);

        if (log.all.length === 0) {
          return textResponse(fmt.emptyState("No commits match the criteria.", "📭"));
        }

        const lines = log.all.map((c) => {
          if (parsed.oneline) {
            return `  ${fmt.code(c.hash.substring(0, 7))} ${c.message.split("\n")[0] ?? c.message}`;
          }
          return `  ${fmt.code(c.hash.substring(0, 7))} · ${c.author_name} · ${c.date}\n    ${c.message.split("\n")[0] ?? c.message}`;
        });

        const header = fmt.section("Log", "📜");
        if (parsed.author || parsed.since || parsed.until || parsed.path) {
          const filters: string[] = [];
          if (parsed.author) filters.push(`author: ${parsed.author}`);
          if (parsed.since) filters.push(`since: ${parsed.since}`);
          if (parsed.until) filters.push(`until: ${parsed.until}`);
          if (parsed.path) filters.push(`path: ${parsed.path}`);
          return textResponse(header + fmt.kv("Filters", filters.join(", ")) + "\n\n" + lines.join("\n\n"));
        }
        return textResponse(header + lines.join("\n\n"));
      } catch (e) {
        return textResponse(fmt.error(formatGitError(e)));
      }
    },
  );
}
