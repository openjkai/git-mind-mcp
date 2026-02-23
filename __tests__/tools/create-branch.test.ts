import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCreateBranch } from "../../src/tools/create-branch";

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

describe("create_branch tool", () => {
  const mockCheckoutLocalBranch = vi.fn();
  const mockBranch = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    mockCheckoutLocalBranch.mockResolvedValue(undefined);
    mockBranch.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      checkoutLocalBranch: mockCheckoutLocalBranch,
      branch: mockBranch,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerCreateBranch(mockServer);
  });

  it("creates and checks out branch by default", async () => {
    const handler = mockServer.getHandler("create_branch");
    const result = await handler({ name: "feature/new" });

    expect(mockCheckoutLocalBranch).toHaveBeenCalledWith("feature/new");
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Created and checked out") }],
    });
  });

  it("creates only when checkout false", async () => {
    await mockServer.getHandler("create_branch")({
      name: "feature/x",
      checkout: false,
    });

    expect(mockBranch).toHaveBeenCalledWith(["feature/x"]);
  });
});
