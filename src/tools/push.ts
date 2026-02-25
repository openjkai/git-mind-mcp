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

const PushArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  remote: z.string().optional().default("origin").describe("Remote name (default: origin)"),
  branch: z.string().optional().describe("Branch to push (default: current branch)"),
  force: z.boolean().optional().default(false).describe("Force push (overwrites remote history)"),
});

export function registerPush(server: McpServer): void {
  server.registerTool(
    "push",
    {
      title: "Push",
      description:
        "Push commits to a remote. Uses current branch if branch not specified. " +
        "Protected branches (main, master) can be pushed normally; force push is blocked.",
      inputSchema: PushArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("push");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = PushArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const status = await git.status();
        const branch = parsed.branch ?? status.current;
        if (!branch) {
          return textResponse("No branch to push (detached HEAD state).");
        }

        const branchName = toLocalBranchName(branch);
        if (parsed.force) {
          const forceGuard = checkForceAllowed();
          if (!forceGuard.allowed) {
            return textResponse(forceGuard.reason ?? "Force push not allowed.");
          }
          if (isProtectedBranch(branchName)) {
            return textResponse(
              `Cannot force push to protected branch '${branchName}'. ` +
                "Use GIT_MIND_PROTECTED_BRANCHES to configure, or remove to allow regular pushes.",
            );
          }
        }

        const pushOpts = parsed.force ? ["--force"] : [];
        const remote = parsed.remote;
        await git.push(remote, branch, pushOpts);
        return textResponse(`Pushed ${branch} to ${remote}.`);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
