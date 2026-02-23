import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCheckout } from "../../src/tools/checkout";

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

describe("checkout tool", () => {
  const mockCheckout = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    mockCheckout.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      checkout: mockCheckout,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerCheckout(mockServer);
  });

  it("checks out branch", async () => {
    const handler = mockServer.getHandler("checkout");
    const result = await handler({ target: "feature/x" });

    expect(mockCheckout).toHaveBeenCalledWith("feature/x");
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Checked out") }],
    });
  });
});
