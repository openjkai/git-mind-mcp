import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerSetConfig } from "../../src/tools/set-config";

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

describe("set_config tool", () => {
  const mockAddConfig = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isDryRun).mockReturnValue(false);
    mockAddConfig.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      addConfig: mockAddConfig,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerSetConfig(mockServer);
  });

  it("sets local config by default", async () => {
    const handler = mockServer.getHandler("set_config");
    const result = await handler({ key: "user.name", value: "Jane Doe" });

    expect(mockAddConfig).toHaveBeenCalledWith("user.name", "Jane Doe");
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Config set") }],
    });
  });

  it("sets global config when scope=global", async () => {
    const handler = mockServer.getHandler("set_config");
    await handler({ key: "user.email", value: "jane@example.com", scope: "global" });

    expect(mockAddConfig).toHaveBeenCalledWith("user.email", "jane@example.com", "--global");
  });

  it("sets system config when scope=system", async () => {
    const handler = mockServer.getHandler("set_config");
    await handler({ key: "core.editor", value: "vim", scope: "system" });

    expect(mockAddConfig).toHaveBeenCalledWith("core.editor", "vim", "--system");
  });

  it("returns dry-run message when dry-run enabled", async () => {
    vi.mocked(isDryRun).mockReturnValue(true);

    const handler = mockServer.getHandler("set_config");
    const result = await handler({ key: "user.name", value: "Test" });

    expect(mockAddConfig).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("[DRY RUN]") }],
    });
  });

  it("blocks when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "set_config not in allowed actions",
    });

    const handler = mockServer.getHandler("set_config");
    const result = await handler({ key: "user.name", value: "Test" });

    expect(mockAddConfig).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });
});
