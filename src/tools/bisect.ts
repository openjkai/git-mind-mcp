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

const BisectArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  action: z
    .enum(["start", "bad", "good", "reset", "run"])
    .describe("start: begin bisect; bad: mark current commit bad; good: mark good; reset: abort; run: run script"),
  bad: refSchema.optional().describe("Commit to mark bad (for start)"),
  good: refSchema.optional().describe("Commit to mark good (for start)"),
  script: z
    .string()
    .optional()
    .refine((val) => !val || (!val.includes("..") && !val.startsWith("-")), {
      message: "script must not contain '..' or start with '-'",
    })
    .describe("Path to test script for run (exit 0 = good, non-zero = bad)"),
});

export function registerBisect(server: McpServer): void {
  server.registerTool(
    "bisect",
    {
      title: "Bisect",
      description:
        "Binary search to find the commit that introduced a bug. " +
        "Use start with bad/good refs, then bad/good to narrow, run with optional script, or reset to abort. " +
        "Equivalent to git bisect.",
      inputSchema: BisectArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const guard = checkOperationAllowed("bisect");
        if (!guard.allowed) {
          return textResponse(error(guard.reason ?? "Operation not allowed."));
        }

        const parsed = BisectArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        if (parsed.action === "start") {
          if (!parsed.bad && !parsed.good) {
            return textResponse(error("Provide at least 'bad' or 'good' when starting bisect."));
          }
          if (isDryRun()) {
            return textResponse(
              `[DRY RUN] Would execute: bisect start ${parsed.bad ? `--bad ${parsed.bad}` : ""} ${parsed.good ? `--good ${parsed.good}` : ""}`.trim(),
            );
          }
          const startArgs = ["bisect", "start"];
          if (parsed.bad) startArgs.push(parsed.bad);
          if (parsed.good) startArgs.push(parsed.good);
          const out = await git.raw(startArgs);
          return textResponse(success("Bisect started", out?.trim() || "Mark commits as bad/good to narrow down."));
        }

        if (parsed.action === "bad") {
          if (isDryRun()) return textResponse("[DRY RUN] Would execute: bisect bad");
          await git.raw(["bisect", "bad"]);
          return textResponse(success("Marked bad", "Current commit marked as bad."));
        }

        if (parsed.action === "good") {
          if (isDryRun()) return textResponse("[DRY RUN] Would execute: bisect good");
          await git.raw(["bisect", "good"]);
          return textResponse(success("Marked good", "Current commit marked as good."));
        }

        if (parsed.action === "reset") {
          if (isDryRun()) return textResponse("[DRY RUN] Would execute: bisect reset");
          await git.raw(["bisect", "reset"]);
          return textResponse(success("Bisect reset", "Bisect session ended."));
        }

        // action === "run"
        if (isDryRun()) {
          return textResponse(`[DRY RUN] Would execute: bisect run ${parsed.script || "<script>"}`);
        }
        const runArgs = ["bisect", "run"];
        if (parsed.script) runArgs.push(parsed.script);
        const out = await git.raw(runArgs);
        return textResponse(success("Bisect complete", out?.trim() || "First bad commit found."));
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
