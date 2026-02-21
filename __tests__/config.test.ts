import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("loads default config when no env vars set", async () => {
    delete process.env.GIT_MIND_ALLOWED_ACTIONS;
    delete process.env.GIT_MIND_PROTECTED_BRANCHES;
    delete process.env.GIT_MIND_STRICT_MODE;

    const { loadConfig } = await import("../src/config/index");
    const config = loadConfig();

    expect(config.allowedActions).toContain("stage");
    expect(config.allowedActions).toContain("unstage");
    expect(config.allowedActions).toContain("commit");
    expect(config.protectedBranches).toContain("main");
    expect(config.protectedBranches).toContain("master");
    expect(config.strictMode).toBe(false);
  });

  it("parses GIT_MIND_ALLOWED_ACTIONS", async () => {
    process.env.GIT_MIND_ALLOWED_ACTIONS = "stage, commit, push";

    const { loadConfig } = await import("../src/config/index");
    const config = loadConfig();

    expect(config.allowedActions).toEqual(["stage", "commit", "push"]);
  });

  it("parses GIT_MIND_STRICT_MODE", async () => {
    process.env.GIT_MIND_STRICT_MODE = "1";

    const { loadConfig } = await import("../src/config/index");
    const config = loadConfig();

    expect(config.strictMode).toBe(true);
  });
});
