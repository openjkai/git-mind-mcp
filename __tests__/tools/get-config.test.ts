import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetConfig } from "../../src/tools/get-config";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";
import { createMockServer } from "./helpers";

describe("get_config tool", () => {
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(getGit).mockReturnValue({
      raw: mockRaw,
    } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerGetConfig(mockServer);
  });

  it("returns config value for specific key", async () => {
    mockRaw.mockResolvedValue("  John Doe\n");

    const handler = mockServer.getHandler("get_config");
    const result = await handler({ key: "user.name" });

    expect(mockRaw).toHaveBeenCalledWith(["config", "--get", "user.name"]);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("user.name");
    expect(text).toContain("John Doe");
  });

  it("returns all config when key omitted", async () => {
    mockRaw.mockResolvedValue("user.name=John\0user.email=john@example.com\0");

    const handler = mockServer.getHandler("get_config");
    const result = await handler({});

    expect(mockRaw).toHaveBeenCalledWith(["config", "--list", "--null"]);
    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("user.name");
    expect(text).toContain("John");
  });

  it("passes repoPath to getGit", async () => {
    mockRaw.mockResolvedValue("value");

    await mockServer.getHandler("get_config")({ key: "user.name", repoPath: "/repo" });

    expect(getGit).toHaveBeenCalledWith("/repo");
  });
});
