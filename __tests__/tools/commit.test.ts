import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCommit } from "../../src/tools/commit";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";

import { createMockServer } from "./helpers";

describe("commit tool", () => {
  const mockCommit = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(getGit).mockReturnValue({
      commit: mockCommit,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerCommit(mockServer);
  });

  it("creates commit and returns result", async () => {
    mockCommit.mockResolvedValue({ commit: "abc123" });

    const handler = mockServer.getHandler("commit");
    const result = await handler({ message: "feat: add x" });

    expect(mockCommit).toHaveBeenCalledWith("feat: add x");
    expect(result).toMatchObject({
      content: [
        {
          type: "text",
          text: expect.stringContaining("abc123"),
        },
      ],
    });
  });

  it("handles nothing to commit", async () => {
    mockCommit.mockResolvedValue({ commit: undefined });

    const handler = mockServer.getHandler("commit");
    const result = await handler({ message: "empty" });

    expect(result).toMatchObject({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Nothing to commit"),
        },
      ],
    });
  });

  it("accepts repoPath", async () => {
    mockCommit.mockResolvedValue({ commit: "xyz" });
    await mockServer.getHandler("commit")({
      message: "test",
      repoPath: "/custom/repo",
    });

    expect(getGit).toHaveBeenCalledWith("/custom/repo");
  });
});
