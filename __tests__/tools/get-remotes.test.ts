import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetRemotes } from "../../src/tools/get-remotes";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";

import { createMockServer } from "./helpers";

describe("get_remotes tool", () => {
  const mockGetRemotes = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    mockGetRemotes.mockResolvedValue([
      {
        name: "origin",
        refs: { push: "git@github.com:user/repo.git", fetch: "git@github.com:user/repo.git" },
      },
    ]);
    vi.mocked(getGit).mockReturnValue({
      getRemotes: mockGetRemotes,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerGetRemotes(mockServer);
  });

  it("returns remotes with URLs", async () => {
    mockGetRemotes.mockResolvedValue([
      {
        name: "origin",
        refs: { push: "git@github.com:user/repo.git", fetch: "git@github.com:user/repo.git" },
      },
    ]);

    const handler = mockServer.getHandler("get_remotes");
    const result = await handler({});

    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("origin") }],
    });
  });

  it("returns message when no remotes", async () => {
    mockGetRemotes.mockResolvedValue([]);

    const handler = mockServer.getHandler("get_remotes");
    const result = await handler({});

    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("No remotes") }],
    });
  });

  it("accepts repoPath", async () => {
    mockGetRemotes.mockResolvedValue({});
    await mockServer.getHandler("get_remotes")({ repoPath: "/custom/repo" });

    expect(getGit).toHaveBeenCalledWith("/custom/repo");
  });
});
