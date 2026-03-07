import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { section, kv, emptyState, error } from "../lib/format-response";

const GetConfigArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  key: z
    .string()
    .optional()
    .describe("Specific config key (e.g. user.name, remote.origin.url); omit for all"),
});

export function registerGetConfig(server: McpServer): void {
  server.registerTool(
    "get_config",
    {
      title: "Get Config",
      description:
        "Read Git configuration. Returns a specific key's value or all config when key is omitted. " +
        "Useful for checking user.name, remote URLs, aliases. Equivalent to git config --get or git config --list.",
      inputSchema: GetConfigArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const parsed = GetConfigArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        if (parsed.key) {
          const value = await git.raw(["config", "--get", parsed.key]);
          const trimmed = value?.trim();
          if (!trimmed) {
            return textResponse(emptyState(`No config found for key: ${parsed.key}`));
          }
          return textResponse(section("Config", "⚙️") + kv(parsed.key, trimmed));
        }

        const result = await git.raw(["config", "--list", "--null"]);
        if (!result || !result.trim()) {
          return textResponse(emptyState("No config found."));
        }

        const entries = result
          .split("\0")
          .filter(Boolean)
          .map((line) => {
            const eq = line.indexOf("=");
            if (eq >= 0) {
              return `  **${line.slice(0, eq)}:** \`${line.slice(eq + 1)}\``;
            }
            return `  ${line}`;
          });

        return textResponse(section("Config", "⚙️") + entries.join("\n"));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
