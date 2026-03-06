import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerClone } from "../../src/tools/clone";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn(),
}));

vi.mock("../../src/lib/guard", () => ({
  checkOperationAllowed: vi.fn(),
  isDryRun: vi.fn().mockReturnValue(false),
}));

import { getGit } from "../../src/lib/git";
import { checkOperationAllowed, isDryRun } from "../../src/lib/guard";
import { createMockServer } from "./helpers";

describe("clone tool", () => {
  const mockClone = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isDryRun).mockReturnValue(false);
    mockClone.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      clone: mockClone,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerClone(mockServer);
  });

  it("clones repo with url only", async () => {
    const handler = mockServer.getHandler("clone");
    const result = await handler({ url: "https://github.com/org/repo.git" });

    expect(mockClone).toHaveBeenCalledWith("https://github.com/org/repo.git");
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Cloned") }],
    });
  });

  it("clones repo with url and targetPath", async () => {
    const handler = mockServer.getHandler("clone");
    await handler({
      url: "https://github.com/org/repo.git",
      targetPath: "myproject",
    });

    expect(mockClone).toHaveBeenCalledWith("https://github.com/org/repo.git", "myproject");
  });

  it("returns dry-run message when dry-run enabled", async () => {
    vi.mocked(isDryRun).mockReturnValue(true);

    const handler = mockServer.getHandler("clone");
    const result = await handler({ url: "https://github.com/org/repo.git" });

    expect(mockClone).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("[DRY RUN]") }],
    });
  });

  it("blocks when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "clone not in allowed actions",
    });

    const handler = mockServer.getHandler("clone");
    const result = await handler({ url: "https://github.com/org/repo.git" });

    expect(mockClone).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });

  it("rejects invalid url", async () => {
    const handler = mockServer.getHandler("clone");
    const result = await handler({ url: "--help" });

    expect(mockClone).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Error") }],
    });
  });
});
