import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetBranches } from "../../src/tools/get-branches";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";

import { createMockServer } from "./helpers";

describe("get_branches tool", () => {
  const mockBranch = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(getGit).mockReturnValue({
      branch: mockBranch,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerGetBranches(mockServer);
  });

  it("returns formatted branch list with current marked", async () => {
    mockBranch.mockResolvedValue({
      current: "main",
      all: ["main", "develop"],
    });

    const handler = mockServer.getHandler("get_branches");
    const result = await handler({});

    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("Local branches:");
    expect(text).toContain("main");
    expect(text).toContain("develop");
  });

  it("calls branch with -a -v for local and remote", async () => {
    mockBranch.mockResolvedValue({ current: "main", all: ["main"] });

    await mockServer.getHandler("get_branches")({});

    expect(mockBranch).toHaveBeenCalledWith(["-a", "-v"]);
  });

  it("passes repoPath to getGit", async () => {
    mockBranch.mockResolvedValue({ current: "main", all: [] });

    await mockServer.getHandler("get_branches")({ repoPath: "/repo" });

    expect(getGit).toHaveBeenCalledWith("/repo");
  });
});
