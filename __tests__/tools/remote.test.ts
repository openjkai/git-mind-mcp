import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerRemote } from "../../src/tools/remote";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/lib/guard", () => ({
  checkOperationAllowed: vi.fn(),
  isDryRun: vi.fn().mockReturnValue(false),
  isProtectedRemote: vi.fn(),
}));

import { getGit } from "../../src/lib/git";
import { checkOperationAllowed, isDryRun, isProtectedRemote } from "../../src/lib/guard";
import { createMockServer } from "./helpers";

describe("remote tool", () => {
  const mockRaw = vi.fn();
  const mockAddRemote = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isDryRun).mockReturnValue(false);
    vi.mocked(isProtectedRemote).mockReturnValue(false);
    mockRaw.mockResolvedValue(undefined);
    mockAddRemote.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      raw: mockRaw,
      addRemote: mockAddRemote,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerRemote(mockServer);
  });

  it("adds a remote", async () => {
    const handler = mockServer.getHandler("remote");
    const result = await handler({
      action: "add",
      name: "upstream",
      url: "https://github.com/org/repo.git",
    });

    expect(mockAddRemote).toHaveBeenCalledWith("upstream", "https://github.com/org/repo.git");
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Added remote: upstream") }],
    });
  });

  it("removes a remote", async () => {
    const handler = mockServer.getHandler("remote");
    const result = await handler({ action: "remove", name: "upstream" });

    expect(mockRaw).toHaveBeenCalledWith(["remote", "remove", "upstream"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Removed remote") }],
    });
  });

  it("sets remote URL", async () => {
    const handler = mockServer.getHandler("remote");
    const result = await handler({
      action: "set_url",
      name: "origin",
      url: "https://new-url.git",
    });

    expect(mockRaw).toHaveBeenCalledWith(["remote", "set-url", "origin", "https://new-url.git"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Updated remote origin") }],
    });
  });

  it("blocks remove when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "remote not in allowed actions",
    });

    const handler = mockServer.getHandler("remote");
    const result = await handler({ action: "remove", name: "upstream" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });

  it("blocks remove of protected remote", async () => {
    vi.mocked(isProtectedRemote).mockReturnValue(true);

    const handler = mockServer.getHandler("remote");
    const result = await handler({ action: "remove", name: "origin" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Cannot remove protected remote") }],
    });
  });

  it("returns dry-run message for add", async () => {
    vi.mocked(isDryRun).mockReturnValue(true);

    const handler = mockServer.getHandler("remote");
    const result = await handler({
      action: "add",
      name: "upstream",
      url: "https://example.com/repo.git",
    });

    expect(mockAddRemote).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("[DRY RUN] Would execute: remote add upstream") }],
    });
  });

  it("returns dry-run message for remove", async () => {
    vi.mocked(isDryRun).mockReturnValue(true);

    const handler = mockServer.getHandler("remote");
    const result = await handler({ action: "remove", name: "upstream" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("[DRY RUN] Would execute: remote remove upstream") }],
    });
  });

  it("requires url for add", async () => {
    const handler = mockServer.getHandler("remote");
    const result = await handler({ action: "add", name: "upstream" });

    expect(mockAddRemote).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Missing 'url'") }],
    });
  });
});
