import path from "path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { simpleGit } from "simple-git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { success, error } from "../lib/format-response";
import { checkOperationAllowed, isDryRun } from "../lib/guard";

const InitArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path where to initialize the repo (default: current directory)"),
  bare: z.boolean().optional().default(false).describe("Create a bare repository (no working tree)"),
});

export function registerInit(server: McpServer): void {
  server.registerTool(
    "init",
    {
      title: "Init",
      description:
        "Initialize a new Git repository. Creates .git in the given path (or current directory). " +
        "Equivalent to git init.",
      inputSchema: InitArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("init");
        if (!guard.allowed) {
          return textResponse(error(guard.reason ?? "Operation not allowed."));
        }

        const parsed = InitArgsSchema.parse(args);
        const targetPath = parsed.repoPath ? path.resolve(parsed.repoPath) : process.cwd();

        if (isDryRun()) {
          return textResponse(
            `[DRY RUN] Would execute: init ${parsed.bare ? "--bare " : ""}${targetPath}`,
          );
        }

        const git = simpleGit(process.cwd());
        const initArgs = ["init", ...(parsed.bare ? ["--bare"] : [])];
        if (parsed.repoPath) initArgs.push(targetPath);
        await git.raw(initArgs);

        const desc = parsed.bare ? "Bare repository" : "Repository";
        return textResponse(success("Initialized", `${desc} at \`${targetPath}\``));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
