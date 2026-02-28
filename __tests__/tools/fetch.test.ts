import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerFetch } from "../../src/tools/fetch";

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

describe("fetch tool", () => {
  const mockFetch = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    mockFetch.mockResolvedValue({
      updated: [{ name: "main", tracking: "origin/main", to: "abc1234", from: "def5678" }],
      tags: [{ name: "v1.0", tracking: "refs/tags/v1.0" }],
      deleted: [],
    });
    vi.mocked(getGit).mockReturnValue({
      fetch: mockFetch,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerFetch(mockServer);
  });

  it("fetches from default when no remote", async () => {
    const handler = mockServer.getHandler("fetch");
    const result = await handler({});

    expect(mockFetch).toHaveBeenCalledWith();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Fetch complete") }],
    });
  });

  it("fetches from specified remote", async () => {
    const handler = mockServer.getHandler("fetch");
    await handler({ remote: "origin" });

    expect(mockFetch).toHaveBeenCalledWith("origin");
  });

  it("shows already up to date when nothing changed", async () => {
    mockFetch.mockResolvedValue({ updated: [], tags: [], deleted: [] });

    const handler = mockServer.getHandler("fetch");
    const result = await handler({});

    expect(result).toMatchObject({
      content: [{ type: "text", text: "Already up to date." }],
    });
  });

  it("blocks fetch when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "fetch not in allowed actions",
    });

    const handler = mockServer.getHandler("fetch");
    const result = await handler({});

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });

  it("accepts repoPath", async () => {
    await mockServer.getHandler("fetch")({ repoPath: "/custom/repo" });

    expect(getGit).toHaveBeenCalledWith("/custom/repo");
  });
});
