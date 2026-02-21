import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerUnstage } from "../../src/tools/unstage";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";

import { createMockServer } from "./helpers";

describe("unstage tool", () => {
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    mockRaw.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      raw: mockRaw,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerUnstage(mockServer);
  });

  it("unstages a single file", async () => {
    const handler = mockServer.getHandler("unstage");
    const result = await handler({ files: "src/index.ts" });

    expect(mockRaw).toHaveBeenCalledWith([
      "reset",
      "HEAD",
      "--",
      "src/index.ts",
    ]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Unstaged") }],
    });
  });

  it("unstages multiple files", async () => {
    const handler = mockServer.getHandler("unstage");
    await handler({ files: ["a.ts", "b.ts"] });

    expect(mockRaw).toHaveBeenCalledWith(["reset", "HEAD", "--", "a.ts", "b.ts"]);
  });

  it("accepts repoPath", async () => {
    await mockServer.getHandler("unstage")({
      files: "x",
      repoPath: "/custom/repo",
    });

    expect(getGit).toHaveBeenCalledWith("/custom/repo");
  });
});
