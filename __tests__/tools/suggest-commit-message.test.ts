import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerSuggestCommitMessage } from "../../src/tools/suggest-commit-message";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";

import { createMockServer } from "./helpers";

describe("suggest_commit_message tool", () => {
  const mockDiff = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(getGit).mockReturnValue({
      diff: mockDiff,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerSuggestCommitMessage(mockServer);
  });

  it("returns staged diff with --cached and --stat", async () => {
    mockDiff.mockResolvedValue(" file1.ts | 5 +++\n 1 file changed, 5 insertions(+)");

    const handler = mockServer.getHandler("suggest_commit_message");
    const result = await handler({});

    expect(mockDiff).toHaveBeenCalledWith(["--cached", "--stat"]);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("file1.ts");
  });

  it("returns message when no staged changes", async () => {
    mockDiff.mockResolvedValue("");

    const handler = mockServer.getHandler("suggest_commit_message");
    const result = await handler({});

    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("No staged changes");
  });

  it("passes repoPath to getGit", async () => {
    mockDiff.mockResolvedValue("");

    await mockServer.getHandler("suggest_commit_message")({ repoPath: "/repo" });

    expect(getGit).toHaveBeenCalledWith("/repo");
  });
});
