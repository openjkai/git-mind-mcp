import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetDiff } from "../../src/tools/get-diff";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";

import { createMockServer } from "./helpers";

describe("get_diff tool", () => {
  const mockDiff = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(getGit).mockReturnValue({
      diff: mockDiff,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerGetDiff(mockServer);
  });

  it("returns working tree diff by default", async () => {
    mockDiff.mockResolvedValue("diff --git a/x b/x\n--- a/x\n+++ b/x");

    const handler = mockServer.getHandler("get_diff");
    const result = await handler({});

    expect(mockDiff).toHaveBeenCalledWith();
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("diff --git");
  });

  it("diffs against ref when provided", async () => {
    mockDiff.mockResolvedValue("diff output");

    await mockServer.getHandler("get_diff")({ ref: "main" });

    expect(mockDiff).toHaveBeenCalledWith(["main"]);
  });

  it("diffs specific file when filePath provided", async () => {
    mockDiff.mockResolvedValue("");

    await mockServer.getHandler("get_diff")({ filePath: "src/index.ts" });

    expect(mockDiff).toHaveBeenCalledWith(["--", "src/index.ts"]);
  });

  it("diffs ref and file when both provided", async () => {
    mockDiff.mockResolvedValue("");

    await mockServer.getHandler("get_diff")({ ref: "HEAD~1", filePath: "foo.ts" });

    expect(mockDiff).toHaveBeenCalledWith(["HEAD~1", "foo.ts"]);
  });

  it("passes repoPath to getGit", async () => {
    mockDiff.mockResolvedValue("");

    await mockServer.getHandler("get_diff")({ repoPath: "/repo" });

    expect(getGit).toHaveBeenCalledWith("/repo");
  });
});
