# Safety Model

Git Mind MCP is designed to be **safe by default**. Write operations are gated by configuration and guardrails.

## Configuration

All safety settings are controlled via environment variables (`GIT_MIND_*`).

| Variable | Default | Description |
|----------|---------|-------------|
| `GIT_MIND_ALLOWED_ACTIONS` | `stage,unstage,commit` | Comma-separated list of operations that can run |
| `GIT_MIND_PROTECTED_BRANCHES` | `main,master` | Branches protected from force push and delete |
| `GIT_MIND_STRICT_MODE` | `0` | Set to `1` to disable all force operations |

## Operation Allowlist

Only operations listed in `GIT_MIND_ALLOWED_ACTIONS` can execute. Default is `stage,unstage,commit`. To enable push, pull, branching, and merge:

```bash
export GIT_MIND_ALLOWED_ACTIONS=stage,unstage,commit,push,pull,checkout,create_branch,delete_branch,merge
```

## Protected Branches

`push`, `delete_branch`, and `merge` enforce protected branches: you cannot force push to, delete, or merge into `main`/`master` (or any branch in `GIT_MIND_PROTECTED_BRANCHES`). Regular pushes and merges from feature branches are allowed. Configure or remove branches to customize.

## Strict Mode

When `GIT_MIND_STRICT_MODE=1`, force operations (e.g. `push --force`) are disabled regardless of other settings.
