import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerPull } from "../../src/tools/pull";

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

describe("pull tool", () => {
  const mockStatus = vi.fn();
  const mockPull = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    mockStatus.mockResolvedValue({ current: "master" });
    mockPull.mockResolvedValue({
      summary: { changes: 2, insertions: 10, deletions: 3 },
    });
    vi.mocked(getGit).mockReturnValue({
      status: mockStatus,
      pull: mockPull,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerPull(mockServer);
  });

  it("pulls and returns summary", async () => {
    const handler = mockServer.getHandler("pull");
    const result = await handler({});

    expect(mockPull).toHaveBeenCalledWith("origin", "master");
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Pull complete") }],
    });
  });

  it("returns up to date when no changes", async () => {
    mockPull.mockResolvedValue({
      summary: { changes: 0, insertions: 0, deletions: 0 },
    });

    const handler = mockServer.getHandler("pull");
    const result = await handler({});

    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Already up to date") }],
    });
  });

  it("accepts remote and branch", async () => {
    await mockServer.getHandler("pull")({
      remote: "upstream",
      branch: "main",
    });

    expect(mockPull).toHaveBeenCalledWith("upstream", "main");
  });
});
