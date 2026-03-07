import path from "path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { success, error } from "../lib/format-response";
import { checkOperationAllowed, isDryRun } from "../lib/guard";

const urlRefine = (val: string) =>
  !val.startsWith("-") &&
  !val.includes("--") &&
  !/[\0\n]/.test(val) &&
  (val.startsWith("http") || val.startsWith("git@") || val.startsWith("ssh://") || /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+:/.test(val));

const CloneArgsSchema = z.object({
  url: z
    .string()
    .min(1)
    .refine(urlRefine, { message: "URL must be a valid git URL (http, https, git@, or ssh)" })
    .describe("Repository URL to clone (e.g. https://github.com/org/repo.git)"),
  targetPath: z
    .string()
    .optional()
    .refine((val) => !val || (!val.includes("..") && !val.startsWith("-")), {
      message: "targetPath must not contain '..' or start with '-'",
    })
    .describe("Directory to clone into (default: repo name from URL)"),
});

export function registerClone(server: McpServer): void {
  server.registerTool(
    "clone",
    {
      title: "Clone",
      description:
        "Clone a repository from a URL into a local directory. " +
        "Equivalent to git clone <url> [path]. Uses dry-run when GIT_MIND_DRY_RUN=1.",
      inputSchema: CloneArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("clone");
        if (!guard.allowed) {
          return textResponse(error(guard.reason ?? "Operation not allowed."));
        }

        const parsed = CloneArgsSchema.parse(args);

        if (isDryRun()) {
          const target = parsed.targetPath ?? "(default from URL)";
          return textResponse(`[DRY RUN] Would execute: clone ${parsed.url} into ${target}`);
        }

        const git = getGit();
        if (parsed.targetPath) {
          await git.clone(parsed.url, parsed.targetPath);
        } else {
          await git.clone(parsed.url);
        }

        const target = parsed.targetPath ?? path.basename(parsed.url.replace(/\.git$/, ""));
        return textResponse(success("Cloned", `${parsed.url} → ${target}`));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
