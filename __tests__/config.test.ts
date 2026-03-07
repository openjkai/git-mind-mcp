import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolve } from "path";

describe("config", () => {
  const originalEnv = process.env;
  const fixturesDir = resolve(process.cwd(), "__tests__/fixtures");

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.GIT_MIND_CONFIG_FILE;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("loads default config when no env vars and no config file", async () => {
    delete process.env.GIT_MIND_ALLOWED_ACTIONS;
    delete process.env.GIT_MIND_PROTECTED_BRANCHES;
    delete process.env.GIT_MIND_PROTECTED_REMOTES;
    delete process.env.GIT_MIND_STRICT_MODE;
    delete process.env.GIT_MIND_DRY_RUN;

    const { loadConfig } = await import("../src/config/index");
    const config = loadConfig();

    expect(config.allowedActions).toContain("stage");
    expect(config.allowedActions).toContain("unstage");
    expect(config.allowedActions).toContain("commit");
    expect(config.protectedBranches).toContain("main");
    expect(config.protectedBranches).toContain("master");
    expect(config.protectedRemotes).toContain("origin");
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

  it("loads config from file when GIT_MIND_CONFIG_FILE is set", async () => {
    delete process.env.GIT_MIND_ALLOWED_ACTIONS;
    delete process.env.GIT_MIND_PROTECTED_BRANCHES;
    delete process.env.GIT_MIND_PROTECTED_REMOTES;
    delete process.env.GIT_MIND_STRICT_MODE;
    process.env.GIT_MIND_CONFIG_FILE = resolve(fixturesDir, "git-mind.config.json");

    const { loadConfig } = await import("../src/config/index");
    const config = loadConfig();

    expect(config.allowedActions).toEqual(["stage", "unstage", "commit", "push", "pull"]);
    expect(config.protectedBranches).toEqual(["main", "master", "develop"]);
    expect(config.protectedRemotes).toEqual(["origin", "upstream"]);
    expect(config.strictMode).toBe(false);
  });

  it("loads config from file with string arrays (comma-separated)", async () => {
    delete process.env.GIT_MIND_ALLOWED_ACTIONS;
    delete process.env.GIT_MIND_PROTECTED_BRANCHES;
    delete process.env.GIT_MIND_STRICT_MODE;
    process.env.GIT_MIND_CONFIG_FILE = resolve(fixturesDir, "git-mind-strict.json");

    const { loadConfig } = await import("../src/config/index");
    const config = loadConfig();

    expect(config.allowedActions).toEqual(["stage", "unstage", "commit", "push"]);
    expect(config.protectedBranches).toEqual(["main"]);
    expect(config.strictMode).toBe(true);
  });

  it("parses GIT_MIND_PROTECTED_REMOTES", async () => {
    process.env.GIT_MIND_PROTECTED_REMOTES = "origin,upstream";

    const { loadConfig } = await import("../src/config/index");
    const config = loadConfig();

    expect(config.protectedRemotes).toEqual(["origin", "upstream"]);
  });

  it("parses GIT_MIND_DRY_RUN", async () => {
    process.env.GIT_MIND_DRY_RUN = "1";

    const { loadConfig } = await import("../src/config/index");
    const config = loadConfig();

    expect(config.dryRun).toBe(true);
  });

  it("env vars override config file", async () => {
    process.env.GIT_MIND_CONFIG_FILE = resolve(fixturesDir, "git-mind.config.json");
    process.env.GIT_MIND_ALLOWED_ACTIONS = "stage,commit";
    process.env.GIT_MIND_PROTECTED_BRANCHES = "main";
    delete process.env.GIT_MIND_STRICT_MODE;

    const { loadConfig } = await import("../src/config/index");
    const config = loadConfig();

    expect(config.allowedActions).toEqual(["stage", "commit"]);
    expect(config.protectedBranches).toEqual(["main"]);
    expect(config.strictMode).toBe(false);
  });
});
