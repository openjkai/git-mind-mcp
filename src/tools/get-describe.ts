import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getGit, validateRepo } from "../lib/git";
import { textResponse } from "../lib/response";
import { formatGitError } from "../lib/format-git-error";
import { section, code, error } from "../lib/format-response";

const refSchema = z
  .string()
  .min(1)
  .refine((val) => !val.startsWith("-") && !val.includes("--") && !/[\0\n]/.test(val), {
    message: "Ref must not contain flags or invalid characters",
  });

const GetDescribeArgsSchema = z.object({
  repoPath: z.string().optional().describe("Path to the git repository"),
  ref: refSchema.default("HEAD").describe("Ref to describe (commit, branch, or tag; default: HEAD)"),
  tags: z
    .boolean()
    .optional()
    .default(true)
    .describe("Only consider tags (default: true)"),
  always: z
    .boolean()
    .optional()
    .default(false)
    .describe("Always output a description, even for non-tagged commits"),
});

export function registerGetDescribe(server: McpServer): void {
  server.registerTool(
    "get_describe",
    {
      title: "Get Describe",
      description:
        "Get a human-readable description of a ref (e.g. v1.2.3-5-gabc1234). " +
        "Useful for version strings and release tagging. Equivalent to git describe.",
      inputSchema: GetDescribeArgsSchema.shape,
      outputSchema: { content: z.string() },
    },
    async (args) => {
      try {
        const parsed = GetDescribeArgsSchema.parse(args);
        const git = getGit(parsed.repoPath);
        await validateRepo(parsed.repoPath);

        const describeArgs = ["describe"];
        if (parsed.tags) describeArgs.push("--tags");
        if (parsed.always) describeArgs.push("--always");
        describeArgs.push(parsed.ref);

        const result = await git.raw(describeArgs);
        const desc = result?.trim();
        if (!desc) {
          return textResponse(error("No description found for ref."));
        }
        const header = section("Describe", "🏷️") + `  ${code(desc)}\n`;
        return textResponse(header);
      } catch (e) {
        return textResponse(error(formatGitError(e)));
      }
    },
  );
}
