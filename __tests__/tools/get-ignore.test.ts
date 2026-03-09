import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFile } from "fs/promises";
import { registerGetIgnore } from "../../src/tools/get-ignore";

vi.mock("../../src/lib/git", () => ({
  validateRepo: vi.fn().mockResolvedValue(undefined),
  resolveRepoPath: vi.fn((p?: string) => (p ? `/resolved/${p}` : "/cwd")),
}));

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}));

import { createMockServer } from "./helpers";

describe("get_ignore tool", () => {
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.mocked(readFile).mockRejectedValue(new Error("ENOENT"));
    mockServer = createMockServer();
    registerGetIgnore(mockServer);
  });

  it("returns empty state when no .gitignore", async () => {
    const handler = mockServer.getHandler("get_ignore");
    const result = await handler({});

    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain(".gitignore");
    expect(text).toContain("No .gitignore found");
  });

  it("returns .gitignore contents when present", async () => {
    vi.mocked(readFile).mockImplementation(async (pathArg) => {
      if (String(pathArg).endsWith(".gitignore")) return "node_modules\n*.log\n";
      throw new Error("ENOENT");
    });

    const handler = mockServer.getHandler("get_ignore");
    const result = await handler({});

    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("node_modules");
    expect(text).toContain("*.log");
  });

  it("includes exclude when includeExclude true", async () => {
    vi.mocked(readFile).mockImplementation(async (pathArg) => {
      const s = String(pathArg);
      if (s.endsWith(".gitignore")) return "dist\n";
      if (s.includes("exclude")) return "*.tmp\n";
      throw new Error("ENOENT");
    });

    const handler = mockServer.getHandler("get_ignore");
    const result = await handler({ includeExclude: true });

    const text = (result as { content: { text: string }[] }).content[0].text;
    expect(text).toContain("dist");
    expect(text).toContain("*.tmp");
  });
});
