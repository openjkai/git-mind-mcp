import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerPush } from "../../src/tools/push";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/lib/guard", () => ({
  checkForceAllowed: vi.fn(),
  checkOperationAllowed: vi.fn(),
  isProtectedBranch: vi.fn(),
}));

import { getGit } from "../../src/lib/git";
import {
  checkForceAllowed,
  checkOperationAllowed,
  isProtectedBranch,
} from "../../src/lib/guard";

import { createMockServer } from "./helpers";

describe("push tool", () => {
  const mockStatus = vi.fn();
  const mockPush = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(checkForceAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isProtectedBranch).mockReturnValue(false);
    mockStatus.mockResolvedValue({ current: "feature/foo" });
    mockPush.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      status: mockStatus,
      push: mockPush,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerPush(mockServer);
  });

  it("pushes current branch when no branch specified", async () => {
    const handler = mockServer.getHandler("push");
    const result = await handler({});

    expect(mockPush).toHaveBeenCalledWith("origin", "feature/foo", []);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Pushed") }],
    });
  });

  it("allows regular push to protected branch", async () => {
    mockStatus.mockResolvedValue({ current: "main" });
    vi.mocked(isProtectedBranch).mockReturnValue(true);

    const handler = mockServer.getHandler("push");
    const result = await handler({});

    expect(mockPush).toHaveBeenCalledWith("origin", "main", []);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Pushed") }],
    });
  });

  it("blocks force push to protected branch", async () => {
    mockPush.mockClear();
    mockStatus.mockResolvedValue({ current: "main" });
    vi.mocked(isProtectedBranch).mockReturnValue(true);

    const handler = mockServer.getHandler("push");
    const result = await handler({ force: true });

    expect(mockPush).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("protected") }],
    });
  });

  it("allows force push to non-protected branch", async () => {
    mockStatus.mockResolvedValue({ current: "feature/foo" });
    vi.mocked(isProtectedBranch).mockReturnValue(false);

    const handler = mockServer.getHandler("push");
    const result = await handler({ force: true });

    expect(mockPush).toHaveBeenCalledWith("origin", "feature/foo", ["--force"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Pushed") }],
    });
  });

  it("accepts remote and branch", async () => {
    await mockServer.getHandler("push")({
      remote: "upstream",
      branch: "fix/bar",
    });

    expect(mockPush).toHaveBeenCalledWith("upstream", "fix/bar", []);
  });

  it("rejects when operation not allowed", async () => {
    mockPush.mockClear();
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "Not in allowlist",
    });

    const handler = mockServer.getHandler("push");
    const result = await handler({});

    expect(mockPush).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Not in allowlist") }],
    });
  });
});
