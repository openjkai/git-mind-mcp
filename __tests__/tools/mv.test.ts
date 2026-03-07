import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerMv } from "../../src/tools/mv";

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

describe("mv tool", () => {
  const mockMv = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    mockMv.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      mv: mockMv,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerMv(mockServer);
  });

  it("moves file from source to destination", async () => {
    const handler = mockServer.getHandler("mv");
    const result = await handler({ from: "old.txt", to: "new.txt" });

    expect(mockMv).toHaveBeenCalledWith("old.txt", "new.txt");
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("old.txt → new.txt") }],
    });
  });

  it("blocks when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "mv not in allowed actions",
    });

    const handler = mockServer.getHandler("mv");
    const result = await handler({ from: "a", to: "b" });

    expect(mockMv).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });
});
