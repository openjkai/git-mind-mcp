import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit } from "../lib/git";

const GetBlameArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  filePath: z.string().describe("Path to the file (relative to repo root)"),
});

export function registerGetBlame(server: McpServer): void {
  server.registerTool(
    "get_blame",
    {
      title: "Get Blame",
      description:
        "Get git blame for a file - shows who last modified each line and when. " +
        "Useful for finding who wrote or changed specific code.",
      inputSchema: GetBlameArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      const parsed = GetBlameArgsSchema.parse(args);
      const git = getGit(parsed.repoPath);

      const blame = await git.raw(["blame", "-w", parsed.filePath]);
      const text = blame || "No blame output (file may be empty or binary).";
      return {
        content: [{ type: "text" as const, text }],
        structuredContent: { content: text },
      };
    },
  );
}
