import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetLog } from "../../src/tools/get-log";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";
import { createMockServer } from "./helpers";

describe("get_log tool", () => {
  const mockLog = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    mockLog.mockResolvedValue({
      all: [
        { hash: "abc1234", author_name: "Alice", date: "2024-01-15", message: "feat: add x" },
        { hash: "def5678", author_name: "Bob", date: "2024-01-14", message: "fix: bug" },
      ],
    });
    vi.mocked(getGit).mockReturnValue({
      log: mockLog,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerGetLog(mockServer);
  });

  it("returns log with default limit", async () => {
    const handler = mockServer.getHandler("get_log");
    const result = await handler({});

    expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({ maxCount: 20 }));
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("abc1234");
    expect(text).toContain("Alice");
    expect(text).toContain("feat: add x");
  });

  it("passes author and path filters", async () => {
    const handler = mockServer.getHandler("get_log");
    await handler({ author: "Alice", path: "src/" });

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({ "--author": "Alice", file: "src/" }),
    );
  });

  it("returns empty state when no commits", async () => {
    mockLog.mockResolvedValue({ all: [] });

    const handler = mockServer.getHandler("get_log");
    const result = await handler({});

    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("No commits");
  });
});
