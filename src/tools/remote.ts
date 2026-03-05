import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { checkOperationAllowed, isDryRun, isProtectedRemote } from "../lib/guard";

const refSchema = (field: string) =>
  z
    .string()
    .min(1)
    .refine((val) => !val.startsWith("-"), { message: `${field} must not start with '-' (git flag injection)` })
    .refine((val) => !/^\s/.test(val), { message: `${field} must not have leading whitespace` })
    .refine((val) => !val.includes("--"), { message: `${field} must not contain '--'` })
    .refine((val) => !/[\0\n]/.test(val), { message: `${field} must not contain null or newline` });

const RemoteArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  action: z
    .enum(["add", "remove", "set_url"])
    .describe("add: add remote; remove: remove remote; set_url: change remote URL"),
  name: refSchema("name").describe("Remote name (e.g. origin, upstream)"),
  url: z
    .string()
    .optional()
    .describe("Remote URL (required for add and set_url)"),
});

export function registerRemote(server: McpServer): void {
  server.registerTool(
    "remote",
    {
      title: "Remote",
      description:
        "Add, remove, or change a remote. Uses config file and dry-run. " +
        "Cannot remove protected remotes (default: origin). Equivalent to git remote add/remove/set-url.",
      inputSchema: RemoteArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("remote");
        if (!guard.allowed) {
          return textResponse(guard.reason ?? "Operation not allowed.");
        }

        const parsed = RemoteArgsSchema.parse(args);

        if ((parsed.action === "add" || parsed.action === "set_url") && (!parsed.url || !parsed.url.trim())) {
          return textResponse(`Missing 'url' parameter for action '${parsed.action}'.`);
        }

        if (parsed.action === "add" && isDryRun()) {
          return textResponse(
            `[DRY RUN] Would execute: remote add ${parsed.name} ${parsed.url}`,
          );
        }
        if (parsed.action === "remove" && isDryRun()) {
          return textResponse(
            `[DRY RUN] Would execute: remote remove ${parsed.name}`,
          );
        }
        if (parsed.action === "set_url" && isDryRun()) {
          return textResponse(
            `[DRY RUN] Would execute: remote set-url ${parsed.name} ${parsed.url}`,
          );
        }

        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        if (parsed.action === "remove") {
          if (isProtectedRemote(parsed.name)) {
            return textResponse(
              `Cannot remove protected remote '${parsed.name}'. ` +
                "Configure GIT_MIND_PROTECTED_REMOTES or use config file to allow.",
            );
          }
          await git.raw(["remote", "remove", parsed.name]);
          return textResponse(`Removed remote: ${parsed.name}`);
        }

        if (parsed.action === "add") {
          await git.addRemote(parsed.name, parsed.url!);
          return textResponse(`Added remote: ${parsed.name} -> ${parsed.url}`);
        }

        // set_url
        await git.raw(["remote", "set-url", parsed.name, parsed.url!]);
        return textResponse(`Updated remote ${parsed.name} URL to ${parsed.url}.`);
      } catch (e) {
        return textResponse(`Error: ${formatGitError(e)}`);
      }
    },
  );
}
