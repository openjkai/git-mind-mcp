import { describe, it, expect } from "vitest";
import { getGit, resolveRepoPath, toLocalBranchName, validateRepo } from "../../src/lib/git";
import path from "path";

describe("git lib", () => {
  describe("getGit", () => {
    it("returns simple-git instance for cwd when no path provided", () => {
      const git = getGit();
      expect(git).toBeDefined();
      expect(typeof git.status).toBe("function");
      expect(typeof git.log).toBe("function");
    });

    it("returns simple-git instance for given repo path", () => {
      const git = getGit(process.cwd()); // use existing dir
      expect(git).toBeDefined();
    });
  });

  describe("resolveRepoPath", () => {
    it("returns resolved path when repoPath is provided", () => {
      const repoPath = "./my-repo";
      const result = resolveRepoPath(repoPath);
      expect(result).toBe(path.resolve(repoPath));
    });

    it("returns process.cwd() when repoPath is omitted", () => {
      const result = resolveRepoPath();
      expect(result).toBe(process.cwd());
    });
  });

  describe("toLocalBranchName", () => {
    it("strips remotes/remote/ prefix", () => {
      expect(toLocalBranchName("remotes/origin/main")).toBe("main");
      expect(toLocalBranchName("remotes/upstream/feature")).toBe("feature");
    });

    it("returns as-is when no prefix", () => {
      expect(toLocalBranchName("main")).toBe("main");
      expect(toLocalBranchName("feature/foo")).toBe("feature/foo");
    });
  });

  describe("validateRepo", () => {
    it("resolves for valid repo (project root)", async () => {
      await expect(validateRepo(process.cwd())).resolves.toBeUndefined();
    });

    it("throws for invalid path", async () => {
      await expect(validateRepo("/nonexistent/path/12345")).rejects.toThrow();
    });
  });
});
