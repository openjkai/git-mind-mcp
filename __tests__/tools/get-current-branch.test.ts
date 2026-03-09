import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetCurrentBranch } from "../../src/tools/get-current-branch";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";
import { createMockServer } from "./helpers";

describe("get_current_branch tool", () => {
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(getGit).mockReturnValue({
      raw: mockRaw,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerGetCurrentBranch(mockServer);
  });

  it("returns current branch", async () => {
    mockRaw.mockResolvedValue("main\n");

    const handler = mockServer.getHandler("get_current_branch");
    const result = await handler({});

    expect(mockRaw).toHaveBeenCalledWith(["rev-parse", "--abbrev-ref", "HEAD"]);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("main");
  });

  it("returns detached HEAD message when detached", async () => {
    mockRaw.mockResolvedValue("HEAD\n");

    const handler = mockServer.getHandler("get_current_branch");
    const result = await handler({});

    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("Detached HEAD");
  });

  it("passes repoPath to getGit", async () => {
    mockRaw.mockResolvedValue("develop\n");

    await mockServer.getHandler("get_current_branch")({ repoPath: "/repo" });

    expect(getGit).toHaveBeenCalledWith("/repo");
  });
});
