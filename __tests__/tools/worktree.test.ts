import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerWorktree } from "../../src/tools/worktree";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
  toLocalBranchName: vi.fn((s: string) => s.replace(/^remotes\/[^/]+\//, "")),
}));

vi.mock("../../src/lib/guard", () => ({
  checkOperationAllowed: vi.fn(),
  isDryRun: vi.fn().mockReturnValue(false),
  isProtectedBranch: vi.fn().mockReturnValue(false),
}));

import { getGit } from "../../src/lib/git";
import { checkOperationAllowed, isDryRun } from "../../src/lib/guard";
import { createMockServer } from "./helpers";

describe("worktree tool", () => {
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isDryRun).mockReturnValue(false);
    mockRaw.mockResolvedValue("");
    vi.mocked(getGit).mockReturnValue({ raw: mockRaw } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerWorktree(mockServer);
  });

  it("lists worktrees", async () => {
    mockRaw.mockResolvedValue("/repo/main\n/repo/feature  abc123 [feature]");

    const handler = mockServer.getHandler("worktree");
    const result = await handler({ action: "list" });

    expect(mockRaw).toHaveBeenCalledWith(["worktree", "list"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Worktrees") }],
    });
  });

  it("adds worktree with path and branch", async () => {
    const handler = mockServer.getHandler("worktree");
    const result = await handler({ action: "add", path: "feature-work", branch: "feature" });

    expect(mockRaw).toHaveBeenCalledWith(
      expect.arrayContaining(["worktree", "add", expect.any(String), "feature"]),
    );
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Worktree added") }],
    });
  });

  it("returns dry-run message when GIT_MIND_DRY_RUN=1", async () => {
    vi.mocked(isDryRun).mockReturnValue(true);

    const handler = mockServer.getHandler("worktree");
    const result = await handler({ action: "add", path: "x", branch: "y" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("[DRY RUN]") }],
    });
  });

  it("blocks when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "worktree not in allowed actions",
    });

    const handler = mockServer.getHandler("worktree");
    const result = await handler({ action: "list" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });
});
