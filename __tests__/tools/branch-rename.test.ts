import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerBranchRename } from "../../src/tools/branch-rename";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/lib/guard", () => ({
  checkOperationAllowed: vi.fn(),
  isDryRun: vi.fn().mockReturnValue(false),
  isProtectedBranch: vi.fn(),
}));

import { getGit } from "../../src/lib/git";
import { checkOperationAllowed, isDryRun, isProtectedBranch } from "../../src/lib/guard";
import { createMockServer } from "./helpers";

describe("branch_rename tool", () => {
  const mockRaw = vi.fn();
  const mockStatus = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isDryRun).mockReturnValue(false);
    vi.mocked(isProtectedBranch).mockReturnValue(false);
    mockRaw.mockResolvedValue(undefined);
    mockStatus.mockResolvedValue({ current: "feature" });
    vi.mocked(getGit).mockReturnValue({
      raw: mockRaw,
      status: mockStatus,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerBranchRename(mockServer);
  });

  it("renames branch", async () => {
    const handler = mockServer.getHandler("branch_rename");
    const result = await handler({ oldName: "feature", newName: "feature-v2" });

    expect(mockRaw).toHaveBeenCalledWith(["branch", "-m", "feature", "feature-v2"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Renamed") }],
    });
  });

  it("blocks rename of protected branch", async () => {
    vi.mocked(isProtectedBranch).mockReturnValue(true);

    const handler = mockServer.getHandler("branch_rename");
    const result = await handler({ oldName: "main", newName: "primary" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("protected") }],
    });
  });

  it("returns dry-run message when dry-run enabled", async () => {
    vi.mocked(isDryRun).mockReturnValue(true);

    const handler = mockServer.getHandler("branch_rename");
    const result = await handler({ oldName: "feature", newName: "feature-v2" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("[DRY RUN]") }],
    });
  });

  it("blocks when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "branch_rename not in allowed actions",
    });

    const handler = mockServer.getHandler("branch_rename");
    const result = await handler({ oldName: "feature", newName: "feature-v2" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });
});
