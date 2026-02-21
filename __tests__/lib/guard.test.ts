import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("guard", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("checkOperationAllowed", () => {
    it("allows stage when in default allowlist", async () => {
      delete process.env.GIT_MIND_ALLOWED_ACTIONS;
      const { checkOperationAllowed } = await import("../../src/lib/guard");
      expect(checkOperationAllowed("stage").allowed).toBe(true);
    });

    it("denies push when not in default allowlist", async () => {
      delete process.env.GIT_MIND_ALLOWED_ACTIONS;
      const { checkOperationAllowed } = await import("../../src/lib/guard");
      const result = checkOperationAllowed("push");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("push");
    });

    it("allows custom operation when in GIT_MIND_ALLOWED_ACTIONS", async () => {
      process.env.GIT_MIND_ALLOWED_ACTIONS = "stage,push,pull";
      vi.resetModules();
      const { checkOperationAllowed } = await import("../../src/lib/guard");
      expect(checkOperationAllowed("push").allowed).toBe(true);
    });
  });

  describe("isProtectedBranch", () => {
    it("returns true for main and master", async () => {
      delete process.env.GIT_MIND_PROTECTED_BRANCHES;
      const { isProtectedBranch } = await import("../../src/lib/guard");
      expect(isProtectedBranch("main")).toBe(true);
      expect(isProtectedBranch("master")).toBe(true);
    });

    it("returns false for feature branch", async () => {
      delete process.env.GIT_MIND_PROTECTED_BRANCHES;
      const { isProtectedBranch } = await import("../../src/lib/guard");
      expect(isProtectedBranch("feature/x")).toBe(false);
    });
  });

  describe("checkForceAllowed", () => {
    it("allows force when strict mode off", async () => {
      process.env.GIT_MIND_STRICT_MODE = "0";
      vi.resetModules();
      const { checkForceAllowed } = await import("../../src/lib/guard");
      expect(checkForceAllowed().allowed).toBe(true);
    });

    it("denies force when strict mode on", async () => {
      process.env.GIT_MIND_STRICT_MODE = "1";
      vi.resetModules();
      const { checkForceAllowed } = await import("../../src/lib/guard");
      const result = checkForceAllowed();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("STRICT");
    });
  });
});
