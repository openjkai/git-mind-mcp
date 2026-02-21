import { getConfig } from "../config/index";

export interface GuardResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if an operation is allowed by config.
 */
export function checkOperationAllowed(operation: string): GuardResult {
  const config = getConfig();
  const allowed = config.allowedActions.map((a) => a.toLowerCase());
  const op = operation.toLowerCase();

  if (allowed.includes(op)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Operation '${operation}' is not in allowed actions. Set GIT_MIND_ALLOWED_ACTIONS to enable it (current: ${config.allowedActions.join(", ")}).`,
  };
}

/**
 * Check if a branch is protected (no force push, no delete).
 */
export function isProtectedBranch(branch: string): boolean {
  const config = getConfig();
  const normalized = branch.toLowerCase().trim();
  return config.protectedBranches.some(
    (b) => b.toLowerCase() === normalized,
  );
}

/**
 * Check if force operations are allowed (strict mode blocks them).
 */
export function checkForceAllowed(): GuardResult {
  const config = getConfig();
  if (config.strictMode) {
    return {
      allowed: false,
      reason: "Force operations are disabled (GIT_MIND_STRICT_MODE=1).",
    };
  }
  return { allowed: true };
}
