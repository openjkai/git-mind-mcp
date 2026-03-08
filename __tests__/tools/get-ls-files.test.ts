import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetLsFiles } from "../../src/tools/get-ls-files";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";
import { createMockServer } from "./helpers";

describe("get_ls_files tool", () => {
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(getGit).mockReturnValue({
      raw: mockRaw,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerGetLsFiles(mockServer);
  });

  it("lists tracked files by default", async () => {
    mockRaw.mockResolvedValue("src/index.ts\nREADME.md\n");

    const handler = mockServer.getHandler("get_ls_files");
    const result = await handler({});

    expect(mockRaw).toHaveBeenCalledWith(["ls-files"]);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("src/index.ts");
    expect(text).toContain("README.md");
  });

  it("includes --cached when staged", async () => {
    mockRaw.mockResolvedValue("file.ts");

    await mockServer.getHandler("get_ls_files")({ staged: true });

    expect(mockRaw).toHaveBeenCalledWith(["ls-files", "--cached"]);
  });

  it("includes --deleted when deleted", async () => {
    mockRaw.mockResolvedValue("");

    await mockServer.getHandler("get_ls_files")({ deleted: true });

    expect(mockRaw).toHaveBeenCalledWith(["ls-files", "--deleted"]);
  });

  it("includes --others when others", async () => {
    mockRaw.mockResolvedValue("");

    await mockServer.getHandler("get_ls_files")({ others: true });

    expect(mockRaw).toHaveBeenCalledWith(["ls-files", "--others", "--exclude-standard"]);
  });

  it("passes repoPath to getGit", async () => {
    mockRaw.mockResolvedValue("");

    await mockServer.getHandler("get_ls_files")({ repoPath: "/repo" });

    expect(getGit).toHaveBeenCalledWith("/repo");
  });
});
