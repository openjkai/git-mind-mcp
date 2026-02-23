import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed } from "../lib/guard";

const CheckoutArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  target: z.string().describe("Branch name, tag, or file path to checkout"),
});

export function registerCheckout(server: McpServer): void {
  server.registerTool(
    "checkout",
    {
      title: "Checkout",
      description:
        "Checkout a branch, tag, or restore a file. Use branch name to switch branches. " +
        "Use file path to restore a file from index.",
      inputSchema: CheckoutArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("checkout");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = CheckoutArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        await git.checkout(parsed.target);
        return textResponse(`Checked out: ${parsed.target}`);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
