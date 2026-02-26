import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerStash } from "../../src/tools/stash";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/lib/guard", () => ({
  checkOperationAllowed: vi.fn(),
}));

import { getGit } from "../../src/lib/git";
import { checkOperationAllowed } from "../../src/lib/guard";
import { createMockServer } from "./helpers";

describe("stash tool", () => {
  const mockStash = vi.fn();
  const mockStashList = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    mockStash.mockResolvedValue(undefined);
    mockStashList.mockResolvedValue({
      all: [
        { hash: "abc1234", message: "WIP on main: previous work" },
        { hash: "def5678", message: "On feature: other changes" },
      ],
    });
    vi.mocked(getGit).mockReturnValue({
      stash: mockStash,
      stashList: mockStashList,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerStash(mockServer);
  });

  it("stash push saves working changes", async () => {
    const handler = mockServer.getHandler("stash");
    const result = await handler({ action: "push" });

    expect(mockStash).toHaveBeenCalledWith(["push"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Stashed working changes") }],
    });
  });

  it("stash push with message", async () => {
    const handler = mockServer.getHandler("stash");
    await handler({ action: "push", message: "WIP: feature" });

    expect(mockStash).toHaveBeenCalledWith(["push", "-m", "WIP: feature"]);
  });

  it("stash list returns entries", async () => {
    const handler = mockServer.getHandler("stash");
    const result = await handler({ action: "list" });

    expect(mockStashList).toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Stashes (2)") }],
    });
    expect(result.content[0].text).toContain("stash@{0}");
    expect(result.content[0].text).toContain("abc1234");
  });

  it("stash list when empty", async () => {
    mockStashList.mockResolvedValue({ all: [] });

    const handler = mockServer.getHandler("stash");
    const result = await handler({ action: "list" });

    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("No stashes") }],
    });
  });

  it("stash pop applies and removes", async () => {
    const handler = mockServer.getHandler("stash");
    const result = await handler({ action: "pop" });

    expect(mockStash).toHaveBeenCalledWith(["pop", "stash@{0}"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Applied and removed") }],
    });
  });

  it("stash pop with ref", async () => {
    const handler = mockServer.getHandler("stash");
    await handler({ action: "pop", ref: "stash@{1}" });

    expect(mockStash).toHaveBeenCalledWith(["pop", "stash@{1}"]);
  });

  it("blocks stash when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "stash not in allowed actions",
    });

    const handler = mockServer.getHandler("stash");
    const result = await handler({ action: "push" });

    expect(mockStash).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });

  it("accepts repoPath", async () => {
    await mockServer.getHandler("stash")({
      action: "list",
      repoPath: "/custom/repo",
    });

    expect(getGit).toHaveBeenCalledWith("/custom/repo");
  });
});
