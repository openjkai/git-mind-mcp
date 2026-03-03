import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerForcePush } from "../../src/tools/force-push";

vi.mock("../../src/lib/git", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/git")>();
  return {
    ...actual,
    getGit: vi.fn(),
    validateRepo: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("../../src/lib/guard", () => ({
  checkForceAllowed: vi.fn(),
  checkOperationAllowed: vi.fn(),
  isDryRun: vi.fn().mockReturnValue(false),
  isProtectedBranch: vi.fn(),
}));

import { getGit } from "../../src/lib/git";
import {
  checkForceAllowed,
  checkOperationAllowed,
  isProtectedBranch,
} from "../../src/lib/guard";

import { createMockServer } from "./helpers";

describe("force_push tool", () => {
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
    registerForcePush(mockServer);
  });

  it("force pushes current branch when no branch specified", async () => {
    const handler = mockServer.getHandler("force_push");
    const result = await handler({});

    expect(mockPush).toHaveBeenCalledWith("origin", "feature/foo", ["--force"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Force pushed") }],
    });
  });

  it("blocks force push to protected branch", async () => {
    mockPush.mockClear();
    mockStatus.mockResolvedValue({ current: "main" });
    vi.mocked(isProtectedBranch).mockReturnValue(true);

    const handler = mockServer.getHandler("force_push");
    const result = await handler({});

    expect(mockPush).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("protected") }],
    });
  });

  it("accepts remote and branch", async () => {
    await mockServer.getHandler("force_push")({
      remote: "upstream",
      branch: "fix/bar",
    });

    expect(mockPush).toHaveBeenCalledWith("upstream", "fix/bar", ["--force"]);
  });

  it("rejects when force_push not in allowed actions", async () => {
    mockPush.mockClear();
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "force_push not in GIT_MIND_ALLOWED_ACTIONS",
    });

    const handler = mockServer.getHandler("force_push");
    const result = await handler({});

    expect(mockPush).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [
        {
          type: "text",
          text: expect.stringMatching(/force_push|GIT_MIND_ALLOWED_ACTIONS/),
        },
      ],
    });
  });

  it("rejects when strict mode disables force", async () => {
    mockPush.mockClear();
    vi.mocked(checkForceAllowed).mockReturnValue({
      allowed: false,
      reason: "Force operations are disabled (GIT_MIND_STRICT_MODE=1).",
    });

    const handler = mockServer.getHandler("force_push");
    const result = await handler({});

    expect(mockPush).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("STRICT") }],
    });
  });
});
