import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed } from "../lib/guard";

const CreateBranchArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  name: z.string().min(1).describe("Name of the new branch"),
  checkout: z
    .boolean()
    .optional()
    .default(true)
    .describe("Checkout the new branch after creating (default: true)"),
});

export function registerCreateBranch(server: McpServer): void {
  server.registerTool(
    "create_branch",
    {
      title: "Create Branch",
      description:
        "Create a new branch. Optionally checkout the branch after creating. " +
        "Branch is created from current HEAD.",
      inputSchema: CreateBranchArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("create_branch");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = CreateBranchArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        if (parsed.checkout) {
          await git.checkoutLocalBranch(parsed.name);
          return textResponse(`Created and checked out branch: ${parsed.name}`);
        } else {
          await git.branch([parsed.name]);
          return textResponse(`Created branch: ${parsed.name}`);
        }
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
