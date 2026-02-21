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

Only operations listed in `GIT_MIND_ALLOWED_ACTIONS` can execute. To enable push and pull:

```bash
export GIT_MIND_ALLOWED_ACTIONS=stage,unstage,commit,push,pull
```

## Protected Branches

When implemented for `push` and `delete_branch`, operations on protected branches will be blocked or require explicit override.

## Strict Mode

When `GIT_MIND_STRICT_MODE=1`, force operations (e.g. `push --force`) are disabled regardless of other settings.
