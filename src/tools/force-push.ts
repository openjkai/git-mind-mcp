import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, toLocalBranchName, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import {
  checkForceAllowed,
  checkOperationAllowed,
  isProtectedBranch,
} from "../lib/guard";

const ForcePushArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  remote: z.string().optional().default("origin").describe("Remote name (default: origin)"),
  branch: z.string().optional().describe("Branch to push (default: current branch)"),
});

export function registerForcePush(server: McpServer): void {
  server.registerTool(
    "force_push",
    {
      title: "Force Push",
      description:
        "Force push to a remote, overwriting remote history. " +
        "Requires force_push in GIT_MIND_ALLOWED_ACTIONS and GIT_MIND_STRICT_MODE=0. " +
        "Protected branches (main, master) are blocked. Use with caution.",
      inputSchema: ForcePushArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("force_push");
        if (!guard.allowed) {
          return textResponse(
            guard.reason ??
              "force_push is not in GIT_MIND_ALLOWED_ACTIONS. Add it to enable this tool.",
          );
        }

        const forceGuard = checkForceAllowed();
        if (!forceGuard.allowed) {
          return textResponse(forceGuard.reason ?? "Force push not allowed.");
        }

        const parsed = ForcePushArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const status = await git.status();
        const branch = parsed.branch ?? status.current;
        if (!branch) {
          return textResponse("No branch to push (detached HEAD state).");
        }

        const branchName = toLocalBranchName(branch);
        if (isProtectedBranch(branchName)) {
          return textResponse(
            `Cannot force push to protected branch '${branchName}'. ` +
              "Configure GIT_MIND_PROTECTED_BRANCHES to modify.",
          );
        }

        const remote = parsed.remote;
        await git.push(remote, branch, ["--force"]);

        return textResponse(`Force pushed ${branch} to ${remote}.`);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
