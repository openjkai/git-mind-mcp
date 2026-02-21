import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetStatus } from "../../src/tools/get-status";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";

import { createMockServer } from "./helpers";

describe("get_status tool", () => {
  const mockStatus = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(getGit).mockReturnValue({
      status: mockStatus,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerGetStatus(mockServer);
  });

  it("returns working tree clean when no changes", async () => {
    mockStatus.mockResolvedValue({
      current: undefined,
      staged: [],
      modified: [],
      not_added: [],
      deleted: [],
      conflicted: [],
    });

    const handler = mockServer.getHandler("get_status");
    const result = await handler({});

    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Working tree clean") }],
    });
  });

  it("returns status with staged and modified files", async () => {
    mockStatus.mockResolvedValue({
      current: "main",
      staged: ["file1.ts"],
      modified: ["file2.ts"],
      not_added: [],
      deleted: [],
      conflicted: [],
    });

    const handler = mockServer.getHandler("get_status");
    const result = await handler({});

    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("Current branch: main");
    expect(text).toContain("file1.ts");
    expect(text).toContain("file2.ts");
    expect(text).toContain("Staged changes");
    expect(text).toContain("Modified");
  });

  it("accepts repoPath and passes to getGit", async () => {
    mockStatus.mockResolvedValue({ current: "main", staged: [], modified: [], not_added: [], deleted: [], conflicted: [] });

    await mockServer.getHandler("get_status")({ repoPath: "/custom/repo" });

    expect(getGit).toHaveBeenCalledWith("/custom/repo");
  });
});
