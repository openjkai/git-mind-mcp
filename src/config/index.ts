import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { z } from "zod";

/**
 * Configuration from optional config file and environment variables.
 * GIT_MIND_* env vars override config file. File supports: git-mind.config.json, .git-mind.json
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
  dryRun: boolean;
}

const DEFAULT_ALLOWED = ["stage", "unstage", "commit"];
const DEFAULT_PROTECTED = ["main", "master"];

const ConfigFileSchema = z.object({
  allowedActions: z
    .union([
      z.string(),
      z.array(z.string()),
    ])
    .optional(),
  protectedBranches: z
    .union([
      z.string(),
      z.array(z.string()),
    ])
    .optional(),
  strictMode: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});

type ConfigFileInput = z.infer<typeof ConfigFileSchema>;

function loadConfigFromFile(): Partial<Config> | null {
  const explicitPath = process.env.GIT_MIND_CONFIG_FILE;
  if (explicitPath) {
    const p = resolve(process.cwd(), explicitPath);
    if (existsSync(p)) {
      try {
        const raw = JSON.parse(readFileSync(p, "utf-8")) as unknown;
        const parsed = ConfigFileSchema.safeParse(raw);
        if (!parsed.success) return null;
        return parseConfigFile(parsed.data);
      } catch {
        return null;
      }
    }
    return null;
  }

  const candidates = ["git-mind.config.json", ".git-mind.json"];
  for (const name of candidates) {
    const p = resolve(process.cwd(), name);
    if (existsSync(p)) {
      try {
        const raw = JSON.parse(readFileSync(p, "utf-8")) as unknown;
        const parsed = ConfigFileSchema.safeParse(raw);
        if (!parsed.success) return null;
        return parseConfigFile(parsed.data);
      } catch {
        return null;
      }
    }
  }
  return null;
}

function parseConfigFile(data: ConfigFileInput): Partial<Config> {
  const out: Partial<Config> = {};
  if (data.allowedActions !== undefined) {
    out.allowedActions = Array.isArray(data.allowedActions)
      ? data.allowedActions.filter(Boolean)
      : parseList(data.allowedActions as string);
  }
  if (data.protectedBranches !== undefined) {
    out.protectedBranches = Array.isArray(data.protectedBranches)
      ? data.protectedBranches.filter(Boolean)
      : parseList(data.protectedBranches as string);
  }
  if (data.strictMode !== undefined) {
    out.strictMode = Boolean(data.strictMode);
  }
  if (data.dryRun !== undefined) {
    out.dryRun = Boolean(data.dryRun);
  }
  return out;
}

export function loadConfig(): Config {
  const fileConfig = loadConfigFromFile();

  const allowedEnv = process.env.GIT_MIND_ALLOWED_ACTIONS;
  const protectedEnv = process.env.GIT_MIND_PROTECTED_BRANCHES;
  const strictEnv = process.env.GIT_MIND_STRICT_MODE;
  const dryRunEnv = process.env.GIT_MIND_DRY_RUN;

  return {
    allowedActions:
      allowedEnv && allowedEnv.length > 0
        ? parseList(allowedEnv)
        : (fileConfig?.allowedActions?.length
            ? fileConfig.allowedActions
            : DEFAULT_ALLOWED),
    protectedBranches:
      protectedEnv && protectedEnv.length > 0
        ? parseList(protectedEnv)
        : (fileConfig?.protectedBranches?.length
            ? fileConfig.protectedBranches
            : DEFAULT_PROTECTED),
    strictMode:
      strictEnv === "1" || strictEnv?.toLowerCase() === "true"
        ? true
        : fileConfig?.strictMode ?? false,
    dryRun:
      dryRunEnv === "1" || dryRunEnv?.toLowerCase() === "true"
        ? true
        : fileConfig?.dryRun ?? false,
  };
}

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

/** Reset cached config (for tests). */
export function resetConfigCache(): void {
  cachedConfig = null;
}
