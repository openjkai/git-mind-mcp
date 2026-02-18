import path from "path";
import { simpleGit } from "simple-git";
import type { SimpleGit } from "simple-git";

/**
 * Get a simple-git instance for the given repository path.
 * Uses process.cwd() if no path is provided.
 */
export function getGit(repoPath?: string): SimpleGit {
  const repo = repoPath || process.cwd();
  return simpleGit(repo);
}

/**
 * Resolve the repository path - use provided path or cwd.
 */
export function resolveRepoPath(repoPath?: string): string {
  return repoPath ? path.resolve(repoPath) : process.cwd();
}
