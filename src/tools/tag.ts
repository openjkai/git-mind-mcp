import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed } from "../lib/guard";

const TagArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  action: z
    .enum(["list", "create"])
    .describe("list: show all tags; create: add a tag at current HEAD"),
  name: z.string().optional().describe("Tag name for create (e.g. v1.0.0)"),
  message: z.string().optional().describe("Message for annotated tag (omit for lightweight tag)"),
});

export function registerTag(server: McpServer): void {
  server.registerTool(
    "tag",
    {
      title: "Tag",
      description:
        "List tags or create a tag at current HEAD. " +
        "Equivalent to git tag -l and git tag <name> or git tag -a <name> -m <message>.",
      inputSchema: TagArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("tag");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = TagArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        if (parsed.action === "list") {
          const result = await git.tags();
          const all = result.all ?? [];
          if (all.length === 0) {
            return textResponse("No tags.");
          }
          const lines = all.map((t) => `  ${t}`);
          return textResponse(`Tags (${all.length}):\n${lines.join("\n")}`);
        }

        if (parsed.action === "create") {
          if (!parsed.name) {
            return textResponse("Tag name required for create.");
          }
          if (parsed.message) {
            await git.addAnnotatedTag(parsed.name, parsed.message);
            return textResponse(`Created annotated tag '${parsed.name}' with message.`);
          } else {
            await git.addTag(parsed.name);
            return textResponse(`Created lightweight tag '${parsed.name}'.`);
          }
        }

        return textResponse("Unknown action.");
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
