# Safety Model

Git Mind MCP is designed to be **safe by default**. Write operations are gated by configuration and guardrails.

## Configuration

All safety settings are controlled via environment variables (`GIT_MIND_*`).

| Variable | Default | Description |
|----------|---------|-------------|
| `GIT_MIND_ALLOWED_ACTIONS` | `stage,unstage,commit` | Comma-separated list of operations that can run |
| `GIT_MIND_PROTECTED_BRANCHES` | `main,master` | Branches protected from force push, delete, and merge |
| `GIT_MIND_STRICT_MODE` | `0` | Set to `1` to disable all force operations |

## Operation Allowlist

Only operations listed in `GIT_MIND_ALLOWED_ACTIONS` can execute. Default is `stage,unstage,commit`. To enable push, pull, branching, merge, stash, fetch, and reset:

```bash
export GIT_MIND_ALLOWED_ACTIONS=stage,unstage,commit,push,pull,checkout,create_branch,delete_branch,merge,stash,fetch,reset
```

## Protected Branches

`push`, `delete_branch`, and `merge` enforce protected branches: you cannot force-push to, delete, or merge into `main`/`master` (or any branch in `GIT_MIND_PROTECTED_BRANCHES`). Normal pushes to protected branches and merges where the protected branch is the source (e.g., merging `main` into a feature branch) are allowed. Configure or remove branches to customize.

## Reset

The `reset` tool only allows soft and mixed modes; `--hard` is explicitly blocked to prevent losing uncommitted changes.

## Strict Mode

When `GIT_MIND_STRICT_MODE=1`, force operations (e.g. `push --force`) are disabled regardless of other settings.
