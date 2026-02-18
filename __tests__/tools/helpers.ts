import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Captures tool handlers registered via registerTool for testing.
 */
export function createMockServer(): McpServer & { getHandler: (name: string) => (args: unknown) => Promise<unknown> } {
  const handlers: Record<string, (args: unknown) => Promise<unknown>> = {};
  return {
    registerTool(
      name: string,
      _schema: unknown,
      handler: (args: unknown) => Promise<unknown>,
    ) {
      handlers[name] = handler;
    },
    getHandler(name: string) {
      const h = handlers[name];
      if (!h) throw new Error(`No handler registered for tool: ${name}`);
      return h;
    },
  } as McpServer & { getHandler: (name: string) => (args: unknown) => Promise<unknown> };
}
