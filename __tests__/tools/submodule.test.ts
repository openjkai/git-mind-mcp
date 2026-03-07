import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerSubmodule } from "../../src/tools/submodule";

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

describe("submodule tool", () => {
  const mockSubmoduleInit = vi.fn();
  const mockSubmoduleUpdate = vi.fn();
  const mockSubmoduleAdd = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    vi.mocked(isDryRun).mockReturnValue(false);
    mockSubmoduleInit.mockResolvedValue(undefined);
    mockSubmoduleUpdate.mockResolvedValue(undefined);
    mockSubmoduleAdd.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      submoduleInit: mockSubmoduleInit,
      submoduleUpdate: mockSubmoduleUpdate,
      submoduleAdd: mockSubmoduleAdd,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerSubmodule(mockServer);
  });

  it("runs submodule init", async () => {
    const handler = mockServer.getHandler("submodule");
    const result = await handler({ action: "init" });

    expect(mockSubmoduleInit).toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Initialized") }],
    });
  });

  it("runs submodule update (all)", async () => {
    const handler = mockServer.getHandler("submodule");
    await handler({ action: "update" });

    expect(mockSubmoduleUpdate).toHaveBeenCalledWith(undefined);
  });

  it("runs submodule add with url and path", async () => {
    const handler = mockServer.getHandler("submodule");
    const result = await handler({
      action: "add",
      url: "https://github.com/org/lib.git",
      path: "libs/mylib",
    });

    expect(mockSubmoduleAdd).toHaveBeenCalledWith("https://github.com/org/lib.git", "libs/mylib");
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Added submodule") }],
    });
  });

  it("rejects add without url and path", async () => {
    const handler = mockServer.getHandler("submodule");
    const result = await handler({ action: "add" });

    expect(mockSubmoduleAdd).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("required") }],
    });
  });

  it("returns dry-run message when dry-run enabled", async () => {
    vi.mocked(isDryRun).mockReturnValue(true);

    const handler = mockServer.getHandler("submodule");
    const result = await handler({ action: "init" });

    expect(mockSubmoduleInit).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("[DRY RUN]") }],
    });
  });
});
