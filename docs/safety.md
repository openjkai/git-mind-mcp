# Safety Model

Git Mind MCP is designed to be **safe by default**. Write operations are gated by configuration and guardrails.

## Configuration

Safety settings can be set via **optional config file** or **environment variables**. Env vars override config file values.

### Config File (optional)

Place `git-mind.config.json` or `.git-mind.json` in the current working directory, or set `GIT_MIND_CONFIG_FILE` to a custom path:

```json
{
  "allowedActions": ["stage", "unstage", "commit", "push", "pull"],
  "protectedBranches": ["main", "master", "develop"],
  "strictMode": false
}
```

`allowedActions` and `protectedBranches` accept either arrays or comma-separated strings.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GIT_MIND_ALLOWED_ACTIONS` | `stage,unstage,commit` | Comma-separated list of operations that can run |
| `GIT_MIND_PROTECTED_BRANCHES` | `main,master` | Branches protected from force push, delete, and merge |
| `GIT_MIND_STRICT_MODE` | `0` | Set to `1` to disable all force operations |
| `GIT_MIND_CONFIG_FILE` | — | Path to config file (relative to cwd); overrides auto-discovery |

## Operation Allowlist

Only operations listed in `GIT_MIND_ALLOWED_ACTIONS` can execute. Default is `stage,unstage,commit`. To enable push, pull, branching, merge, stash, fetch, reset, cherry_pick, revert, tag, and optional force_push:

```bash
export GIT_MIND_ALLOWED_ACTIONS=stage,unstage,commit,push,force_push,pull,checkout,create_branch,delete_branch,merge,stash,fetch,reset,cherry_pick,revert,tag
```

## Protected Branches

`push`, `force_push`, `delete_branch`, `merge`, `cherry_pick`, and `revert` enforce protected branches: you cannot force-push to, delete, merge into, cherry-pick into, or revert on `main`/`master` (or any branch in `GIT_MIND_PROTECTED_BRANCHES`). Normal pushes to protected branches and merges where the protected branch is the source (e.g., merging `main` into a feature branch) are allowed. The `force_push` tool is opt-in and must be explicitly added to `GIT_MIND_ALLOWED_ACTIONS`. Configure or remove branches to customize.

## Reset

The `reset` tool only allows soft and mixed modes; `--hard` is explicitly blocked to prevent losing uncommitted changes.

## Strict Mode

When `GIT_MIND_STRICT_MODE=1`, force operations (e.g. `push --force`, `force_push`) are disabled regardless of other settings.
