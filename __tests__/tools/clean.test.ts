import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerClean } from "../../src/tools/clean";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/lib/guard", () => ({
  checkOperationAllowed: vi.fn(),
  isDryRun: vi.fn().mockReturnValue(false),
}));

import { getGit } from "../../src/lib/git";
import { checkOperationAllowed, isDryRun } from "../../src/lib/guard";
import { createMockServer } from "./helpers";

describe("clean tool", () => {
  const mockClean = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isDryRun).mockReturnValue(false);
    mockClean.mockResolvedValue("Would remove build/\nWould remove tmp.txt");
    vi.mocked(getGit).mockReturnValue({
      clean: mockClean,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerClean(mockServer);
  });

  it("runs dry-run by default (shows what would be removed)", async () => {
    const handler = mockServer.getHandler("clean");
    const result = await handler({});

    expect(mockClean).toHaveBeenCalledWith("n");
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("[DRY RUN]") }],
    });
  });

  it("actually removes when dryRun=false", async () => {
    mockClean.mockResolvedValue(undefined);

    const handler = mockServer.getHandler("clean");
    const result = await handler({ dryRun: false });

    expect(mockClean).toHaveBeenCalledWith("f");
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Cleaned") }],
    });
  });

  it("passes -d and -x when directories and ignored true", async () => {
    await mockServer.getHandler("clean")({ dryRun: false, directories: true, ignored: true });

    expect(mockClean).toHaveBeenCalledWith("fdx");
  });

  it("blocks when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "clean not in allowed actions",
    });

    const handler = mockServer.getHandler("clean");
    const result = await handler({});

    expect(mockClean).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });
});
