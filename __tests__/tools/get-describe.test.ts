import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetDescribe } from "../../src/tools/get-describe";

vi.mock("../../src/lib/git", () => ({
  getGit: vi.fn(),
  validateRepo: vi.fn().mockResolvedValue(undefined),
}));

import { getGit } from "../../src/lib/git";
import { createMockServer } from "./helpers";

describe("get_describe tool", () => {
  const mockRaw = vi.fn();
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRaw.mockResolvedValue("v1.2.3-5-gabc1234");
    vi.mocked(getGit).mockReturnValue({ raw: mockRaw } as ReturnType<typeof getGit>);
    mockServer = createMockServer();
    registerGetDescribe(mockServer);
  });

  it("returns describe for HEAD by default", async () => {
    const handler = mockServer.getHandler("get_describe");
    const result = await handler({});

    expect(mockRaw).toHaveBeenCalledWith(
      expect.arrayContaining(["describe", "HEAD"]),
    );
    expect(result).toMatchObject({
      content: [{ type: "text", text: expect.stringContaining("v1.2.3-5-gabc1234") }],
    });
  });

  it("accepts ref and options", async () => {
    const handler = mockServer.getHandler("get_describe");
    await handler({ ref: "v1.0.0", tags: true, always: true });

    expect(mockRaw).toHaveBeenCalledWith(["describe", "--tags", "--always", "v1.0.0"]);
  });
});
