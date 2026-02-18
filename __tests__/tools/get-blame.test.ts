import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetBlame } from "../../src/tools/get-blame";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
}));

import { getGit } from "../../src/lib/git";

import { createMockServer } from "./helpers";

describe("get_blame tool", () => {
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(getGit).mockReturnValue({
      raw: mockRaw,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerGetBlame(mockServer);
  });

  it("returns blame output for file", async () => {
    mockRaw.mockResolvedValue("abc123 (Alice 2024-01-15 1) const x = 1;");

    const handler = mockServer.getHandler("get_blame");
    const result = await handler({ filePath: "src/index.ts" });

    expect(mockRaw).toHaveBeenCalledWith(["blame", "-w", "src/index.ts"]);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("abc123");
  });

  it("requires filePath (Zod validation)", async () => {
    const handler = mockServer.getHandler("get_blame");
    await expect(handler({})).rejects.toThrow();
  });

  it("passes repoPath to getGit", async () => {
    mockRaw.mockResolvedValue("");

    await mockServer.getHandler("get_blame")({ filePath: "x.ts", repoPath: "/repo" });

    expect(getGit).toHaveBeenCalledWith("/repo");
  });
});
