/**
 * Format git/simple-git errors for user-friendly messages.
 */
export function formatGitError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    // Common patterns from simple-git and git CLI
    if (msg.includes("not a git repository") || msg.includes("Not a git repository")) {
      return "Not a git repository. Ensure the path points to a valid repo.";
    }
    if (msg.includes("fatal: not a git repository")) {
      return "Not a git repository.";
    }
    if (msg.includes("pathspec") && msg.includes("did not match")) {
      return "One or more file paths do not exist or are not in the repo.";
    }
    if (msg.includes("nothing to commit")) {
      return "Nothing to commit. Stage changes first.";
    }
    if (msg.includes("no changes added to commit")) {
      return "No changes added to commit.";
    }
    if (msg.includes("merge conflict") || msg.includes("CONFLICT")) {
      return "Merge conflict. Resolve conflicts manually, then stage and commit.";
    }
    if (msg.includes("rejected") && msg.includes("push")) {
      return "Push rejected (non-fast-forward). Pull first or use rebase.";
    }
    if (msg.includes("Permission denied") || msg.includes("Authentication failed")) {
      return "Authentication failed. Check SSH keys or credentials.";
    }
    return msg;
  }
  return String(error);
}
