import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetShortlog } from "../../src/tools/get-shortlog";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";
import { createMockServer } from "./helpers";

describe("get_shortlog tool", () => {
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(getGit).mockReturnValue({
      raw: mockRaw,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerGetShortlog(mockServer);
  });

  it("returns shortlog for HEAD by default", async () => {
    mockRaw.mockResolvedValue("    10  Alice\n     5  Bob\n");

    const handler = mockServer.getHandler("get_shortlog");
    const result = await handler({});

    expect(mockRaw).toHaveBeenCalledWith(["shortlog", "-n", "20", "-s", "HEAD"]);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("Alice");
    expect(text).toContain("Bob");
  });

  it("accepts custom ref", async () => {
    mockRaw.mockResolvedValue("     3  Carol\n");

    await mockServer.getHandler("get_shortlog")({ ref: "main" });

    expect(mockRaw).toHaveBeenCalledWith(["shortlog", "-n", "20", "-s", "main"]);
  });

  it("passes repoPath to getGit", async () => {
    mockRaw.mockResolvedValue("");

    await mockServer.getHandler("get_shortlog")({ repoPath: "/repo" });

    expect(getGit).toHaveBeenCalledWith("/repo");
  });
});
