import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerDeleteBranch } from "../../src/tools/delete-branch";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/lib/guard", () => ({
  checkOperationAllowed: vi.fn(),
  isProtectedBranch: vi.fn(),
}));

import { getGit } from "../../src/lib/git";
import { checkOperationAllowed, isProtectedBranch } from "../../src/lib/guard";

import { createMockServer } from "./helpers";

describe("delete_branch tool", () => {
  const mockStatus = vi.fn();
  const mockDeleteLocalBranch = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isProtectedBranch).mockReturnValue(false);
    mockStatus.mockResolvedValue({ current: "master" });
    mockDeleteLocalBranch.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      status: mockStatus,
      deleteLocalBranch: mockDeleteLocalBranch,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerDeleteBranch(mockServer);
  });

  it("deletes branch", async () => {
    const handler = mockServer.getHandler("delete_branch");
    const result = await handler({ branch: "feature/old" });

    expect(mockDeleteLocalBranch).toHaveBeenCalledWith("feature/old", false);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Deleted") }],
    });
  });

  it("blocks delete of protected branch", async () => {
    mockDeleteLocalBranch.mockClear();
    vi.mocked(isProtectedBranch).mockReturnValue(true);

    const handler = mockServer.getHandler("delete_branch");
    const result = await handler({ branch: "main" });

    expect(mockDeleteLocalBranch).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("protected") }],
    });
  });

  it("blocks delete of current branch", async () => {
    mockDeleteLocalBranch.mockClear();
    mockStatus.mockResolvedValue({ current: "feature/x" });

    const handler = mockServer.getHandler("delete_branch");
    const result = await handler({ branch: "feature/x" });

    expect(mockDeleteLocalBranch).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("current branch") }],
    });
  });

  it("supports force delete", async () => {
    await mockServer.getHandler("delete_branch")({
      branch: "feature/x",
      force: true,
    });

    expect(mockDeleteLocalBranch).toHaveBeenCalledWith("feature/x", true);
  });
});
