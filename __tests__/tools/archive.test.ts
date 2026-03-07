import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerArchive } from "../../src/tools/archive";

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

describe("archive tool", () => {
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isDryRun).mockReturnValue(false);
    mockRaw.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      raw: mockRaw,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerArchive(mockServer);
  });

  it("creates tar archive at HEAD by default", async () => {
    const handler = mockServer.getHandler("archive");
    const result = await handler({ outputPath: "release.tar" });

    expect(mockRaw).toHaveBeenCalledWith([
      "archive",
      "--format",
      "tar",
      "-o",
      expect.stringContaining("release.tar"),
      "HEAD",
    ]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("HEAD → release.tar") }],
    });
  });

  it("creates zip archive with ref and prefix", async () => {
    const handler = mockServer.getHandler("archive");
    await handler({
      ref: "v1.0.0",
      format: "zip",
      outputPath: "dist.zip",
      prefix: "myapp/",
    });

    expect(mockRaw).toHaveBeenCalledWith([
      "archive",
      "--format",
      "zip",
      "-o",
      expect.stringContaining("dist.zip"),
      "--prefix",
      "myapp/",
      "v1.0.0",
    ]);
  });

  it("returns dry-run message when GIT_MIND_DRY_RUN=1", async () => {
    vi.mocked(isDryRun).mockReturnValue(true);

    const handler = mockServer.getHandler("archive");
    const result = await handler({ outputPath: "out.tar", ref: "main" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("[DRY RUN]") }],
    });
  });

  it("blocks when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "archive not in allowed actions",
    });

    const handler = mockServer.getHandler("archive");
    const result = await handler({ outputPath: "out.tar" });

    expect(mockRaw).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });
});
