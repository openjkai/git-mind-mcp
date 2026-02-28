import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerTag } from "../../src/tools/tag";

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

describe("tag tool", () => {
  const mockTags = vi.fn();
  const mockAddTag = vi.fn();
  const mockAddAnnotatedTag = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOperationAllowed).mockReturnValue({ allowed: true });
    mockTags.mockResolvedValue({ all: ["v1.0", "v1.1"], latest: "v1.1" });
    mockAddTag.mockResolvedValue({ name: "v2.0" });
    mockAddAnnotatedTag.mockResolvedValue({ name: "v2.0" });
    vi.mocked(getGit).mockReturnValue({
      tags: mockTags,
      addTag: mockAddTag,
      addAnnotatedTag: mockAddAnnotatedTag,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerTag(mockServer);
  });

  it("lists tags", async () => {
    const handler = mockServer.getHandler("tag");
    const result = await handler({ action: "list" });

    expect(mockTags).toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Tags (2)") }],
    });
    expect(result.content[0].text).toContain("v1.0");
    expect(result.content[0].text).toContain("v1.1");
  });

  it("lists tags when empty", async () => {
    mockTags.mockResolvedValue({ all: [] });

    const handler = mockServer.getHandler("tag");
    const result = await handler({ action: "list" });

    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("No tags") }],
    });
  });

  it("creates lightweight tag", async () => {
    const handler = mockServer.getHandler("tag");
    const result = await handler({ action: "create", name: "v2.0" });

    expect(mockAddTag).toHaveBeenCalledWith("v2.0");
    expect(mockAddAnnotatedTag).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Created lightweight tag") }],
    });
  });

  it("creates annotated tag with message", async () => {
    const handler = mockServer.getHandler("tag");
    const result = await handler({ action: "create", name: "v2.0", message: "Release 2.0" });

    expect(mockAddAnnotatedTag).toHaveBeenCalledWith("v2.0", "Release 2.0");
    expect(mockAddTag).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Created annotated tag") }],
    });
  });

  it("requires name for create", async () => {
    const handler = mockServer.getHandler("tag");
    const result = await handler({ action: "create" });

    expect(mockAddTag).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("Tag name required") }],
    });
  });

  it("blocks tag when operation not allowed", async () => {
    vi.mocked(checkOperationAllowed).mockReturnValue({
      allowed: false,
      reason: "tag not in allowed actions",
    });

    const handler = mockServer.getHandler("tag");
    const result = await handler({ action: "list" });

    expect(mockTags).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("not in allowed actions") }],
    });
  });

  it("accepts repoPath", async () => {
    await mockServer.getHandler("tag")({ action: "list", repoPath: "/repo" });
    expect(getGit).toHaveBeenCalledWith("/repo");
  });
});
