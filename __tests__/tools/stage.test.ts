import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerStage } from "../../src/tools/stage";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";

import { createMockServer } from "./helpers";

describe("stage tool", () => {
  const mockAdd = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    mockAdd.mockResolvedValue(undefined);
    vi.mocked(getGit).mockReturnValue({
      add: mockAdd,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerStage(mockServer);
  });

  it("stages a single file", async () => {
    const handler = mockServer.getHandler("stage");
    const result = await handler({ files: "src/index.ts" });

    expect(mockAdd).toHaveBeenCalledWith(["src/index.ts"]);
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Staged") }],
    });
  });

  it("stages multiple files", async () => {
    const handler = mockServer.getHandler("stage");
    await handler({ files: ["a.ts", "b.ts"] });

    expect(mockAdd).toHaveBeenCalledWith(["a.ts", "b.ts"]);
  });

  it("stages all with dot", async () => {
    const handler = mockServer.getHandler("stage");
    await handler({ files: "." });

    expect(mockAdd).toHaveBeenCalledWith(["."]);
  });

  it("accepts repoPath", async () => {
    await mockServer.getHandler("stage")({
      files: "x",
      repoPath: "/custom/repo",
    });

    expect(getGit).toHaveBeenCalledWith("/custom/repo");
  });
});
