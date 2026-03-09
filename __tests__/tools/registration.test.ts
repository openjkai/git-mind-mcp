import { describe, it, expect } from "vitest";
import { registerAllTools } from "../../src/tools/index";
import { createMockServer } from "./helpers";

describe("tool registration", () => {
  it("registers all tools", () => {
    const mockServer = createMockServer();
    registerAllTools(mockServer);

    const expectedTools = [
      "get_status",
      "get_commit_history",
      "get_diff",
      "get_blame",
      "get_branches",
      "get_remotes",
      "get_reflog",
      "get_show",
      "get_config",
      "get_log",
      "suggest_commit_message",
      "stage",
      "unstage",
      "commit",
      "push",
      "force_push",
      "pull",
      "checkout",
      "create_branch",
      "delete_branch",
      "branch_rename",
      "merge",
      "stash",
      "fetch",
      "reset",
      "cherry_pick",
      "revert",
      "tag",
      "rebase",
      "remote",
      "init",
      "clone",
      "clean",
      "submodule",
      "apply",
      "set_config",
      "mv",
      "archive",
      "bisect",
      "worktree",
      "get_describe",
      "get_ls_files",
      "get_shortlog",
      "get_ignore",
      "get_current_branch",
    ];

    for (const name of expectedTools) {
      expect(() => mockServer.getHandler(name)).not.toThrow();
    }
  });
});
