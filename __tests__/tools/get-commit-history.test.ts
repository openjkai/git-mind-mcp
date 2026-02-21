import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetCommitHistory } from "../../src/tools/get-commit-history";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";

import { createMockServer } from "./helpers";

describe("get_commit_history tool", () => {
  const mockLog = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(getGit).mockReturnValue({
      log: mockLog,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerGetCommitHistory(mockServer);
  });

  it("returns formatted commit history", async () => {
    mockLog.mockResolvedValue({
      all: [
        { hash: "abc1234", author_name: "Alice", date: "2024-01-15", message: "feat: add x" },
        { hash: "def5678", author_name: "Bob", date: "2024-01-14", message: "fix: y" },
      ],
    });

    const handler = mockServer.getHandler("get_commit_history");
    const result = await handler({});

    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("abc1234");
    expect(text).toContain("Alice");
    expect(text).toContain("feat: add x");
    expect(text).toContain("def5678");
    expect(text).toContain("Bob");
  });

  it("returns default limit of 10 when not specified", async () => {
    mockLog.mockResolvedValue({ all: [] });

    await mockServer.getHandler("get_commit_history")({});

    expect(mockLog).toHaveBeenCalledWith({ maxCount: 10 });
  });

  it("respects custom limit", async () => {
    mockLog.mockResolvedValue({ all: [] });

    await mockServer.getHandler("get_commit_history")({ limit: 5 });

    expect(mockLog).toHaveBeenCalledWith({ maxCount: 5 });
  });

  it("passes repoPath to getGit", async () => {
    mockLog.mockResolvedValue({ all: [] });

    await mockServer.getHandler("get_commit_history")({ repoPath: "/my/repo" });

    expect(getGit).toHaveBeenCalledWith("/my/repo");
  });
});
