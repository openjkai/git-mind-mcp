import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { success, error } from "../lib/format-response";
import { checkOperationAllowed, isDryRun } from "../lib/guard";

const urlRefine = (val: string) =>
  !val.startsWith("-") &&
  !val.includes("--") &&
  !/[\0\n]/.test(val) &&
  (val.startsWith("http") || val.startsWith("git@") || val.startsWith("ssh://") || /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+:/.test(val));

const SubmoduleArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  action: z
    .enum(["init", "update", "add"])
    .describe("init: initialize submodules; update: update submodules; add: add new submodule"),
  path: z.string().optional().describe("Submodule path (required for add; optional for update to target one)"),
  url: z
    .string()
    .optional()
    .refine((val) => !val || urlRefine(val!), { message: "URL must be valid (http, https, git@, ssh)" })
    .describe("Submodule URL (required for add)"),
});

export function registerSubmodule(server: McpServer): void {
  server.registerTool(
    "submodule",
    {
      title: "Submodule",
      description:
        "Manage submodules: init (initialize), update (fetch and checkout), add (add new submodule). " +
        "Equivalent to git submodule init/update/add.",
      inputSchema: SubmoduleArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("submodule");
        if (!guard.allowed) {
          return textResponse(error(guard.reason ?? "Operation not allowed."));
        }

        const parsed = SubmoduleArgsSchema.parse(args);

        if (isDryRun()) {
          const desc =
            parsed.action === "add"
              ? `add ${parsed.url} at ${parsed.path}`
              : parsed.action === "update"
                ? `update ${parsed.path ?? "all"}`
                : "init";
          return textResponse(`[DRY RUN] Would execute: submodule ${desc}`);
        }

        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        if (parsed.action === "init") {
          await git.submoduleInit();
          return textResponse(success("Initialized", "Submodules initialized."));
        }

        if (parsed.action === "update") {
          await git.submoduleUpdate(parsed.path);
          return textResponse(
            success("Updated", parsed.path ? `Submodule ${parsed.path} updated.` : "All submodules updated."),
          );
        }

        if (parsed.action === "add") {
          if (!parsed.url || !parsed.path) {
            return textResponse(error("Both 'url' and 'path' are required for submodule add."));
          }
          await git.submoduleAdd(parsed.url, parsed.path);
          return textResponse(success("Added submodule", `${parsed.url} → ${parsed.path}`));
        }

        return textResponse(error("Unknown action."));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
