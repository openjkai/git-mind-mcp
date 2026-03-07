import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { success, error } from "../lib/format-response";
import { checkOperationAllowed } from "../lib/guard";

const pathSchema = (name: string) =>
  z
    .string()
    .min(1)
    .refine((val) => !val.startsWith("-") && !val.includes("--") && !/[\0\n]/.test(val), {
      message: `${name} must not contain flags or invalid characters`,
    });

const MvArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  from: pathSchema("from").describe("Source path (file or directory)"),
  to: pathSchema("to").describe("Destination path"),
});

export function registerMv(server: McpServer): void {
  server.registerTool(
    "mv",
    {
      title: "Move/Rename",
      description:
        "Move or rename a file/directory in the working tree. Tracks the rename for better diff history. " +
        "Equivalent to git mv <from> <to>.",
      inputSchema: MvArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("mv");
        if (!guard.allowed) {
          return textResponse(error(guard.reason ?? "Operation not allowed."));
        }

        const parsed = MvArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        await git.mv(parsed.from, parsed.to);

        return textResponse(success("Moved", `${parsed.from} → ${parsed.to}`));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
