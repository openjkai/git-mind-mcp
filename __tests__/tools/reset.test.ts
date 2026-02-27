import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerReset } from "../../src/tools/reset";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/lib/guard", () => ({
  checkOperationAllowed: vi.fn(),
}));

import { getGit } from "../../src/lib/git";
import { checkOperationAllowed } from "../../src/lib/guard";
import { createMockServer } from "./helpers";

describe("reset tool", () => {
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    mockRaw.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      raw: mockRaw,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerReset(mockServer);
  });

  it("resets with mixed mode by default", async () => {
    const handler = mockServer.getHandler("reset");
    const result = await handler({ ref: "HEAD~1" });

    expect(mockRaw).toHaveBeenCalledWith(["reset", "--mixed", "HEAD~1"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Reset (mixed)") }],
    });
  });

  it("resets with soft mode", async () => {
    const handler = mockServer.getHandler("reset");
    await handler({ ref: "HEAD~1", mode: "soft" });

    expect(mockRaw).toHaveBeenCalledWith(["reset", "--soft", "HEAD~1"]);
  });

  it("resets to branch name", async () => {
    const handler = mockServer.getHandler("reset");
    await handler({ ref: "main", mode: "mixed" });

    expect(mockRaw).toHaveBeenCalledWith(["reset", "--mixed", "main"]);
  });

  it("blocks reset when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "reset not in allowed actions",
    });

    const handler = mockServer.getHandler("reset");
    const result = await handler({ ref: "HEAD~1" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });

  it("accepts repoPath", async () => {
    await mockServer.getHandler("reset")({ ref: "HEAD~1", repoPath: "/custom/repo" });

    expect(getGit).toHaveBeenCalledWith("/custom/repo");
  });
});
