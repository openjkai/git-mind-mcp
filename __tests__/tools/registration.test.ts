import { describe, it, expect } from "vitest";
import { registerAllTools } from "../../src/tools/index";
import { createMockServer } from "./helpers";

describe("tool registration", () => {
  it("registers all 22 tools", () => {
    const mockServer = createMockServer();
    registerAllTools(mockServer);

    const expectedTools = [
      "get_status",
      "get_commit_history",
      "get_diff",
      "get_blame",
      "get_branches",
      "get_remotes",
      "suggest_commit_message",
      "stage",
      "unstage",
      "commit",
      "push",
      "pull",
      "checkout",
      "create_branch",
      "delete_branch",
      "merge",
      "stash",
      "fetch",
      "reset",
      "cherry_pick",
      "revert",
      "tag",
    ];

    for (const name of expectedTools) {
      expect(() => mockServer.getHandler(name)).not.toThrow();
    }
  });
});
