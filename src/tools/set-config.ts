import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { success, error } from "../lib/format-response";
import { checkOperationAllowed, isDryRun } from "../lib/guard";

const keySchema = z
  .string()
  .min(1)
  .refine((val) => !val.startsWith("-") && !val.includes("--") && !/[\0\n]/.test(val), {
    message: "Key must not contain flags or invalid characters",
  });

const SetConfigArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  key: keySchema.describe("Config key (e.g. user.name, user.email, core.editor)"),
  value: z.string().describe("Value to set"),
  scope: z
    .enum(["local", "global", "system"])
    .optional()
    .default("local")
    .describe("Config scope: local (repo), global (user), or system"),
});

export function registerSetConfig(server: McpServer): void {
  server.registerTool(
    "set_config",
    {
      title: "Set Config",
      description:
        "Set a Git config value. Use scope=local for repo, global for user, system for system-wide. " +
        "Equivalent to git config [--global|--system] <key> <value>.",
      inputSchema: SetConfigArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("set_config");
        if (!guard.allowed) {
          return textResponse(error(guard.reason ?? "Operation not allowed."));
        }

        const parsed = SetConfigArgsSchema.parse(args);

        if (isDryRun()) {
          return textResponse(
            `[DRY RUN] Would execute: set config ${parsed.key}=${parsed.value} (${parsed.scope})`,
          );
        }

        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const scopeFlag = parsed.scope === "global" ? ["--global"] : parsed.scope === "system" ? ["--system"] : [];
        await git.addConfig(parsed.key, parsed.value, ...scopeFlag);

        return textResponse(success("Config set", `${parsed.key} = ${parsed.value} (${parsed.scope})`));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
