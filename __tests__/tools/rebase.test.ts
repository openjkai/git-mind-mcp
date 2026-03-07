import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerRebase } from "../../src/tools/rebase";

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
  isDryRun: vi.fn().mockReturnValue(false),
  isProtectedBranch: vi.fn(),
}));

import { getGit } from "../../src/lib/git";
import { checkOperationAllowed, isDryRun, isProtectedBranch } from "../../src/lib/guard";
import { createMockServer } from "./helpers";

describe("rebase tool", () => {
  const mockStatus = vi.fn();
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isDryRun).mockReturnValue(false);
    vi.mocked(isProtectedBranch).mockReturnValue(false);
    mockStatus.mockResolvedValue({ current: "feature" });
    mockRaw.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      status: mockStatus,
      raw: mockRaw,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerRebase(mockServer);
  });

  it("rebases current branch onto target", async () => {
    const handler = mockServer.getHandler("rebase");
    const result = await handler({ action: "rebase", onto: "main" });

    expect(mockRaw).toHaveBeenCalledWith(["rebase", "main"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Rebased feature onto main") }],
    });
  });

  it("aborts in-progress rebase", async () => {
    const handler = mockServer.getHandler("rebase");
    const result = await handler({ action: "abort" });

    expect(mockRaw).toHaveBeenCalledWith(["rebase", "--abort"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Rebase aborted") }],
    });
  });

  it("continues rebase after resolving conflicts", async () => {
    const handler = mockServer.getHandler("rebase");
    const result = await handler({ action: "continue" });

    expect(mockRaw).toHaveBeenCalledWith(["rebase", "--continue"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Rebase continued") }],
    });
  });

  it("requires onto when action is rebase", async () => {
    const handler = mockServer.getHandler("rebase");
    const result = await handler({ action: "rebase" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Missing 'onto'") }],
    });
  });

  it("blocks rebase when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "rebase not in allowed actions",
    });

    const handler = mockServer.getHandler("rebase");
    const result = await handler({ action: "rebase", onto: "main" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });

  it("blocks rebase of protected branch", async () => {
    mockStatus.mockResolvedValue({ current: "main" });
    vi.mocked(isProtectedBranch).mockReturnValue(true);

    const handler = mockServer.getHandler("rebase");
    const result = await handler({ action: "rebase", onto: "develop" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Cannot rebase protected branch") }],
    });
  });

  it("returns dry-run message when GIT_MIND_DRY_RUN is set", async () => {
    vi.mocked(isDryRun).mockReturnValue(true);

    const handler = mockServer.getHandler("rebase");
    const result = await handler({ action: "rebase", onto: "main" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("[DRY RUN] Would execute: rebase onto main") }],
    });
  });

  it("rejects rebase in detached HEAD", async () => {
    mockStatus.mockResolvedValue({ current: null });

    const handler = mockServer.getHandler("rebase");
    const result = await handler({ action: "rebase", onto: "main" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("detached HEAD") }],
    });
  });
});
