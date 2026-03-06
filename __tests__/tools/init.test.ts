import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerInit } from "../../src/tools/init";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn(),
}));

vi.mock("simple-git", () => ({
  simpleGit: vi.fn(),
}));

vi.mock("../../src/lib/guard", () => ({
  checkOperationAllowed: vi.fn(),
  isDryRun: vi.fn().mockReturnValue(false),
}));

import { simpleGit } from "simple-git";
import { checkOperationAllowed, isDryRun } from "../../src/lib/guard";
import { createMockServer } from "./helpers";

describe("init tool", () => {
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isDryRun).mockReturnValue(false);
    vi.mocked(simpleGit).mockReturnValue({
      raw: mockRaw,
    } as ReturnType<typeof simpleGit>);
    mockRaw.mockResolvedValue(undefined);
    mockServer = createMockServer();
    registerInit(mockServer);
  });

  it("initializes repo in current directory", async () => {
    const handler = mockServer.getHandler("init");
    const result = await handler({});

    expect(mockRaw).toHaveBeenCalledWith(["init"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Initialized") }],
    });
  });

  it("initializes bare repo when bare=true", async () => {
    const handler = mockServer.getHandler("init");
    await handler({ bare: true });

    expect(mockRaw).toHaveBeenCalledWith(["init", "--bare"]);
  });

  it("initializes in custom path when repoPath provided", async () => {
    const handler = mockServer.getHandler("init");
    await handler({ repoPath: "/path/to/repo" });

    expect(mockRaw).toHaveBeenCalledWith(["init", expect.stringContaining("/path/to/repo")]);
  });

  it("returns dry-run message when dry-run enabled", async () => {
    vi.mocked(isDryRun).mockReturnValue(true);

    const handler = mockServer.getHandler("init");
    const result = await handler({});

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("[DRY RUN]") }],
    });
  });

  it("blocks when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "init not in allowed actions",
    });

    const handler = mockServer.getHandler("init");
    const result = await handler({});

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });
});
