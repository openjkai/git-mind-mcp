import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerRevert } from "../../src/tools/revert";

vi.mock("../../src/lib/git", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/git")>();
  return {
    ...actual,
    getGit: vi.fn(),
    validateRepo: vi.fn().mockResolvedValue(undefined),
    toLocalBranchName: vi.fn((s: string) => s.replace(/^remotes\/[^/]+\//, "")),
  };
});

vi.mock("../../src/lib/guard", () => ({
  checkOperationAllowed: vi.fn(),
  isProtectedBranch: vi.fn(),
}));

import { getGit } from "../../src/lib/git";
import { checkOperationAllowed, isProtectedBranch } from "../../src/lib/guard";
import { createMockServer } from "./helpers";

describe("revert tool", () => {
  const mockRevert = vi.fn();
  const mockStatus = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isProtectedBranch).mockReturnValue(false);
    mockStatus.mockResolvedValue({ current: "feature" });
    mockRevert.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      status: mockStatus,
      revert: mockRevert,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerRevert(mockServer);
  });

  it("reverts commit on current branch", async () => {
    const handler = mockServer.getHandler("revert");
    const result = await handler({ commit: "HEAD~1" });

    expect(mockRevert).toHaveBeenCalledWith("HEAD~1");
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Reverted HEAD~1 on feature") }],
    });
  });

  it("blocks revert when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "revert not in allowed actions",
    });

    const handler = mockServer.getHandler("revert");
    const result = await handler({ commit: "abc1234" });

    expect(mockRevert).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });

  it("blocks revert on protected branch", async () => {
    mockStatus.mockResolvedValue({ current: "main" });
    vi.mocked(isProtectedBranch).mockReturnValue(true);

    const handler = mockServer.getHandler("revert");
    const result = await handler({ commit: "abc1234" });

    expect(mockRevert).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Cannot revert on protected branch") }],
    });
  });

  it("rejects revert in detached HEAD", async () => {
    mockStatus.mockResolvedValue({ current: null });

    const handler = mockServer.getHandler("revert");
    const result = await handler({ commit: "abc1234" });

    expect(mockRevert).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("detached HEAD") }],
    });
  });

  it("accepts repoPath", async () => {
    await mockServer.getHandler("revert")({ commit: "abc", repoPath: "/repo" });
    expect(getGit).toHaveBeenCalledWith("/repo");
  });
});
