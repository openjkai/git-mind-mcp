/**
 * UX-friendly response formatting for MCP tool output.
 * Uses markdown-style formatting that renders well in both console and markdown UIs.
 */

/** Wrap text as inline code (refs, paths, branch names). */
export function code(s: string): string {
  return `\`${s}\``;
}

/** Success message with checkmark. */
export function success(msg: string, detail?: string): string {
  const line = `✅ **${msg}**`;
  return detail ? `${line}\n\n${detail}` : line;
}

/** Error message with cross. */
export function error(msg: string): string {
  return `❌ **Error:** ${msg}`;
}

/** Warning message. */
export function warning(msg: string): string {
  return `⚠️ ${msg}`;
}

/** Section header. */
export function section(title: string, icon = "📋"): string {
  return `\n${icon} **${title}**\n`;
}

/** Bullet list. */
export function list(items: string[], bullet = "•"): string {
  return items.map((i) => `  ${bullet} ${i}`).join("\n");
}

/** Key-value pair. */
export function kv(key: string, value: string): string {
  return `  **${key}:** ${value}`;
}

/** Empty state message. */
export function emptyState(msg: string, icon = "📭"): string {
  return `${icon} ${msg}`;
}

/** Divider line. */
export function divider(): string {
  return "---";
}

/** Format a file status line with icon. */
export function fileStatus(path: string, status: "staged" | "modified" | "untracked" | "deleted" | "conflicted"): string {
  const icons: Record<string, string> = {
    staged: "🟢",
    modified: "🟡",
    untracked: "⚪",
    deleted: "🔴",
    conflicted: "🔶",
  };
  return `  ${icons[status] ?? "•"} ${code(path)}`;
}
