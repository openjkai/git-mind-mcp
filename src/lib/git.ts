import path from "path";
import { simpleGit } from "simple-git";
import type { SimpleGit } from "simple-git";

/**
 * Resolve the repository path - use provided path or cwd.
 */
export function resolveRepoPath(repoPath?: string): string {
  return repoPath ? path.resolve(repoPath) : process.cwd();
}

/**
 * Get a simple-git instance for the given repository path.
 * Uses process.cwd() if no path is provided.
 */
export function getGit(repoPath?: string): SimpleGit {
  const repo = resolveRepoPath(repoPath);
  return simpleGit(repo);
}

/**
 * Validate that the path is a git repository.
 * @returns true if valid
 * @throws Error with user-friendly message if not a repo
 */
export async function validateRepo(repoPath?: string): Promise<void> {
  const git = getGit(repoPath);
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error(
      resolveRepoPath(repoPath) === process.cwd()
        ? "Current directory is not a git repository."
        : `Path is not a git repository: ${resolveRepoPath(repoPath)}`,
    );
  }
}
