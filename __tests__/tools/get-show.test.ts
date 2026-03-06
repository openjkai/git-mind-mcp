import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetShow } from "../../src/tools/get-show";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";
import { createMockServer } from "./helpers";

describe("get_show tool", () => {
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(getGit).mockReturnValue({
      raw: mockRaw,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerGetShow(mockServer);
  });

  it("returns commit details for ref", async () => {
    mockRaw.mockResolvedValue("commit abc123\nAuthor: Alice\n\n    feat: add x\n\n file.ts | 5 +++\n 1 file changed");

    const handler = mockServer.getHandler("get_show");
    const result = await handler({ ref: "abc123" });

    expect(mockRaw).toHaveBeenCalledWith(["show", "--stat", "abc123"]);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("abc123");
    expect(text).toContain("Alice");
    expect(text).toContain("feat: add x");
  });

  it("passes repoPath to getGit", async () => {
    mockRaw.mockResolvedValue("commit x\nAuthor: A\n\nmsg");

    await mockServer.getHandler("get_show")({ ref: "HEAD", repoPath: "/repo" });

    expect(getGit).toHaveBeenCalledWith("/repo");
  });

  it("returns error for invalid ref", async () => {
    mockRaw.mockRejectedValue(new Error("unknown revision"));

    const handler = mockServer.getHandler("get_show");
    const result = await handler({ ref: "nonexistent" });

    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Error") }],
    });
  });
});
