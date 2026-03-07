import path from "path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { success, error } from "../lib/format-response";
import { checkOperationAllowed, isDryRun } from "../lib/guard";

const refSchema = z
  .string()
  .min(1)
  .refine((val) => !val.startsWith("-") && !val.includes("--") && !/[\0\n]/.test(val), {
    message: "Ref must not contain flags or invalid characters",
  });

const ArchiveArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  ref: refSchema.default("HEAD").describe("Commit, branch, or tag to archive (default: HEAD)"),
  format: z
    .enum(["tar", "zip"])
    .default("tar")
    .describe("Archive format: tar or zip"),
  outputPath: z
    .string()
    .min(1)
    .refine((val) => !val.includes("..") && !val.startsWith("-"), {
      message: "outputPath must not contain '..' or start with '-'",
    })
    .describe("Output file path (e.g. release.tar or dist.zip)"),
  prefix: z
    .string()
    .optional()
    .refine((val) => !val || (!val.includes("..") && !val.startsWith("-")), {
      message: "prefix must not contain '..' or start with '-'",
    })
    .describe("Prefix to strip from paths in archive (e.g. project-name/)"),
});

export function registerArchive(server: McpServer): void {
  server.registerTool(
    "archive",
    {
      title: "Archive",
      description:
        "Create an archive (tar or zip) of the repository at a given ref. " +
        "Useful for creating release bundles. Equivalent to git archive.",
      inputSchema: ArchiveArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("archive");
        if (!guard.allowed) {
          return textResponse(error(guard.reason ?? "Operation not allowed."));
        }

        const parsed = ArchiveArgsSchema.parse(args);

        if (isDryRun()) {
          return textResponse(
            `[DRY RUN] Would execute: archive ${parsed.ref} as ${parsed.format} → ${parsed.outputPath}`,
          );
        }

        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const output = path.resolve(process.cwd(), parsed.outputPath);
        const args_arr = [
          "archive",
          "--format",
          parsed.format === "zip" ? "zip" : "tar",
          "-o",
          output,
          parsed.ref,
        ];
        if (parsed.prefix) {
          args_arr.splice(args_arr.length - 1, 0, "--prefix", parsed.prefix);
        }

        await git.raw(args_arr);

        return textResponse(success("Archived", `${parsed.ref} → ${parsed.outputPath}`));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
