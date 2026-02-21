/**
 * Standard MCP text response format.
 * Use for consistent tool responses across all tools.
 */
export function textResponse(text: string): {
  content: [{ type: "text"; text: string }];
  structuredContent: { content: string };
} {
  return {
    content: [{ type: "text" as const, text }],
    structuredContent: { content: text },
  };
}
