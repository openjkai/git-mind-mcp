import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { validateRepo, resolveRepoPath } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { section, list, emptyState, error } from "../lib/format-response";

const GetIgnoreArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  includeExclude: z
    .boolean()
    .optional()
    .default(false)
    .describe("If true, also include .git/info/exclude patterns"),
});

export function registerGetIgnore(server: McpServer): void {
  server.registerTool(
    "get_ignore",
    {
      title: "Get Ignore",
      description:
        "Read .gitignore (and optionally .git/info/exclude) patterns. " +
        "Useful for understanding what files Git ignores. Equivalent to viewing .gitignore.",
      inputSchema: GetIgnoreArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const parsed = GetIgnoreArgsSchema.parse(args);
        await validateRepo(parsed.repoPath);
        const root = resolveRepoPath(parsed.repoPath);

        const parts: string[] = [];
        const gitignorePath = path.join(root, ".gitignore");

        try {
          const content = await readFile(gitignorePath, "utf-8");
          const lines = content.split("\n").filter((l) => l.trim() !== "");
          if (lines.length) {
            parts.push(section(".gitignore", "🚫") + list(lines));
          } else {
            parts.push(section(".gitignore", "🚫") + "  " + emptyState("Empty file", "📄"));
          }
        } catch {
          parts.push(section(".gitignore", "🚫") + "  " + emptyState("No .gitignore found", "📄"));
        }

        if (parsed.includeExclude) {
          const excludePath = path.join(root, ".git", "info", "exclude");
          try {
            const content = await readFile(excludePath, "utf-8");
            const lines = content
              .split("\n")
              .filter((l) => l.trim() !== "" && !l.startsWith("#"));
            if (lines.length) {
              parts.push(section(".git/info/exclude", "🚫") + list(lines));
            } else {
              parts.push(section(".git/info/exclude", "🚫") + "  " + emptyState("Empty or comments only", "📄"));
            }
          } catch {
            parts.push(section(".git/info/exclude", "🚫") + "  " + emptyState("Not found", "📄"));
          }
        }

        return textResponse(parts.join("\n"));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
