import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerApply } from "../../src/tools/apply";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/lib/guard", () => ({
  checkOperationAllowed: vi.fn(),
  isDryRun: vi.fn().mockReturnValue(false),
}));

import { getGit } from "../../src/lib/git";
import { checkOperationAllowed, isDryRun } from "../../src/lib/guard";
import { createMockServer } from "./helpers";

describe("apply tool", () => {
  const mockRaw = vi.fn();
  const mockApplyPatch = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isDryRun).mockReturnValue(false);
    mockRaw.mockResolvedValue(undefined);
    mockApplyPatch.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      raw: mockRaw,
      applyPatch: mockApplyPatch,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerApply(mockServer);
  });

  it("applies inline patch content", async () => {
    const patch = "diff --git a/file.txt b/file.txt\n--- a/file.txt\n+++ b/file.txt\n@@ -1 +1,2 @@\n-old\n+new\n+line";
    const handler = mockServer.getHandler("apply");
    const result = await handler({ patch, check: false });

    expect(mockApplyPatch).toHaveBeenCalledWith(patch);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Applied") }],
    });
  });

  it("checks patch without applying when check=true", async () => {
    const patch = "diff --git a/x b/x";
    const handler = mockServer.getHandler("apply");
    const result = await handler({ patch, check: true });

    expect(mockApplyPatch).toHaveBeenCalledWith(patch, ["--check"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Patch applies") }],
    });
  });

  it("applies patch from file path when isPath=true", async () => {
    const handler = mockServer.getHandler("apply");
    await handler({ patch: "changes.patch", isPath: true, check: false });

    expect(mockRaw).toHaveBeenCalledWith(["apply", "--", "changes.patch"]);
    expect(mockApplyPatch).not.toHaveBeenCalled();
  });

  it("returns dry-run message when GIT_MIND_DRY_RUN=1", async () => {
    vi.mocked(isDryRun).mockReturnValue(true);

    const handler = mockServer.getHandler("apply");
    const result = await handler({ patch: "diff...", check: false });

    expect(mockApplyPatch).toHaveBeenCalledWith("diff...", ["--stat"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("[DRY RUN]") }],
    });
  });

  it("blocks when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "apply not in allowed actions",
    });

    const handler = mockServer.getHandler("apply");
    const result = await handler({ patch: "diff..." });

    expect(mockApplyPatch).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });
});
