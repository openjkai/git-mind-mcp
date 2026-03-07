import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerBisect } from "../../src/tools/bisect";

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

describe("bisect tool", () => {
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isDryRun).mockReturnValue(false);
    mockRaw.mockResolvedValue("");
    vi.mocked(getGit).mockReturnValue({ raw: mockRaw } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerBisect(mockServer);
  });

  it("starts bisect with bad and good refs", async () => {
    const handler = mockServer.getHandler("bisect");
    await handler({ action: "start", bad: "HEAD", good: "main" });

    expect(mockRaw).toHaveBeenCalledWith(["bisect", "start", "HEAD", "main"]);
  });

  it("marks current commit as bad", async () => {
    const handler = mockServer.getHandler("bisect");
    const result = await handler({ action: "bad" });

    expect(mockRaw).toHaveBeenCalledWith(["bisect", "bad"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Marked bad") }],
    });
  });

  it("resets bisect session", async () => {
    const handler = mockServer.getHandler("bisect");
    const result = await handler({ action: "reset" });

    expect(mockRaw).toHaveBeenCalledWith(["bisect", "reset"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Bisect reset") }],
    });
  });

  it("blocks when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "bisect not in allowed actions",
    });

    const handler = mockServer.getHandler("bisect");
    const result = await handler({ action: "bad" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });
});
