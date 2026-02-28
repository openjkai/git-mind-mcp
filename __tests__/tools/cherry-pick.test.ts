import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCherryPick } from "../../src/tools/cherry-pick";

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

describe("cherry_pick tool", () => {
  const mockRaw = vi.fn();
  const mockStatus = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isProtectedBranch).mockReturnValue(false);
    mockStatus.mockResolvedValue({ current: "feature" });
    mockRaw.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      status: mockStatus,
      raw: mockRaw,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerCherryPick(mockServer);
  });

  it("cherry-picks commit onto current branch", async () => {
    const handler = mockServer.getHandler("cherry_pick");
    const result = await handler({ commit: "abc1234" });

    expect(mockRaw).toHaveBeenCalledWith(["cherry-pick", "abc1234"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Cherry-picked abc1234 onto feature") }],
    });
  });

  it("blocks cherry-pick when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "cherry_pick not in allowed actions",
    });

    const handler = mockServer.getHandler("cherry_pick");
    const result = await handler({ commit: "abc1234" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });

  it("blocks cherry-pick into protected branch", async () => {
    mockStatus.mockResolvedValue({ current: "main" });
    vi.mocked(isProtectedBranch).mockReturnValue(true);

    const handler = mockServer.getHandler("cherry_pick");
    const result = await handler({ commit: "abc1234" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Cannot cherry-pick into protected branch") }],
    });
  });

  it("rejects cherry-pick in detached HEAD", async () => {
    mockStatus.mockResolvedValue({ current: null });

    const handler = mockServer.getHandler("cherry_pick");
    const result = await handler({ commit: "abc1234" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("detached HEAD") }],
    });
  });

  it("accepts repoPath", async () => {
    await mockServer.getHandler("cherry_pick")({ commit: "abc", repoPath: "/repo" });
    expect(getGit).toHaveBeenCalledWith("/repo");
  });
});
