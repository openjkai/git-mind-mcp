import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerMerge } from "../../src/tools/merge";

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

describe("merge tool", () => {
  const mockStatus = vi.fn();
  const mockMerge = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isProtectedBranch).mockReturnValue(false);
    mockStatus.mockResolvedValue({ current: "feature" });
    mockMerge.mockResolvedValue({
      failed: false,
      merges: ["file1.ts", "file2.ts"],
      conflicts: [],
      summary: { changes: 2, insertions: 5, deletions: 1 },
    });
    vi.mocked(getGit).mockReturnValue({
      status: mockStatus,
      merge: mockMerge,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerMerge(mockServer);
  });

  it("merges branch and returns summary", async () => {
    const handler = mockServer.getHandler("merge");
    const result = await handler({ branch: "develop" });

    expect(mockMerge).toHaveBeenCalledWith(["develop"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Merged develop into feature") }],
    });
  });

  it("blocks merge when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "merge not in allowed actions",
    });

    const handler = mockServer.getHandler("merge");
    const result = await handler({ branch: "develop" });

    expect(mockMerge).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("allowed") }],
    });
  });

  it("blocks merge into protected branch", async () => {
    mockStatus.mockResolvedValue({ current: "main" });
    vi.mocked(isProtectedBranch).mockReturnValue(true);

    const handler = mockServer.getHandler("merge");
    const result = await handler({ branch: "feature" });

    expect(mockMerge).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Cannot merge into protected branch") }],
    });
  });

  it("returns conflict message on failed merge", async () => {
    mockMerge.mockResolvedValue({
      failed: true,
      conflicts: [{ file: "src/foo.ts", reason: "modified" }, { file: null, reason: "other" }],
      merges: [],
    });

    const handler = mockServer.getHandler("merge");
    const result = await handler({ branch: "other" });

    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Merge failed (conflicts)") }],
    });
  });

  it("rejects merge in detached HEAD", async () => {
    mockStatus.mockResolvedValue({ current: null });

    const handler = mockServer.getHandler("merge");
    const result = await handler({ branch: "develop" });

    expect(mockMerge).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("detached HEAD") }],
    });
  });
});
