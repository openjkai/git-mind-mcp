/**
 * Configuration from environment variables.
 * GIT_MIND_* prefixed vars control safety and behavior.
 */
function parseList(value: string | undefined): string[] {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface Config {
  allowedActions: string[];
  protectedBranches: string[];
  strictMode: boolean;
}

const DEFAULT_ALLOWED = ["stage", "unstage", "commit"];
const DEFAULT_PROTECTED = ["main", "master"];

export function loadConfig(): Config {
  const allowedEnv = process.env.GIT_MIND_ALLOWED_ACTIONS;
  const protectedEnv = process.env.GIT_MIND_PROTECTED_BRANCHES;
  const strictEnv = process.env.GIT_MIND_STRICT_MODE;

  return {
    allowedActions:
      allowedEnv && allowedEnv.length > 0 ? parseList(allowedEnv) : DEFAULT_ALLOWED,
    protectedBranches:
      protectedEnv && protectedEnv.length > 0
        ? parseList(protectedEnv)
        : DEFAULT_PROTECTED,
    strictMode: strictEnv === "1" || strictEnv?.toLowerCase() === "true",
  };
}

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}
