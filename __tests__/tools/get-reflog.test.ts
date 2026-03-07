import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetReflog } from "../../src/tools/get-reflog";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";
import { createMockServer } from "./helpers";

describe("get_reflog tool", () => {
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(getGit).mockReturnValue({
      raw: mockRaw,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerGetReflog(mockServer);
  });

  it("returns formatted reflog entries", async () => {
    mockRaw.mockResolvedValue(
      "abc1234 HEAD@{0}: commit: Add feature\n" +
        "def5678 HEAD@{1}: checkout: moving from main to feature\n",
    );

    const handler = mockServer.getHandler("get_reflog");
    const result = await handler({});

    expect(mockRaw).toHaveBeenCalledWith(["reflog", "-n", "20"]);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("Reflog");
    expect(text).toContain("abc1234");
    expect(text).toContain("HEAD@{0}");
    expect(text).toContain("Add feature");
  });

  it("accepts limit parameter", async () => {
    mockRaw.mockResolvedValue("abc1234 HEAD@{0}: commit: test\n");

    await mockServer.getHandler("get_reflog")({ limit: 5 });

    expect(mockRaw).toHaveBeenCalledWith(["reflog", "-n", "5"]);
  });

  it("returns empty state when no reflog", async () => {
    mockRaw.mockResolvedValue("");

    const handler = mockServer.getHandler("get_reflog");
    const result = await handler({});

    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("No reflog entries");
  });

  it("accepts repoPath", async () => {
    mockRaw.mockResolvedValue("abc1234 HEAD@{0}: commit: test\n");

    await mockServer.getHandler("get_reflog")({ repoPath: "/custom/repo" });

    expect(getGit).toHaveBeenCalledWith("/custom/repo");
  });
});
