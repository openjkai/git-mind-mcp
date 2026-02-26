# Git Mind MCP

**MCP server for Git intelligence** — status, diff, blame, branches, merge, stage, commit, push, pull, checkout, stash, branching. Works with any MCP-compatible client (Cursor, Claude Desktop, [LibreChat](https://librechat.ai), etc.).

> **[Roadmap](ROADMAP.md)** — Planned features, phases, and timeline.

## Features

**Read**
- `get_status` — Working tree and staged changes
- `get_commit_history` — Recent commits with author, date, message
- `get_diff` — Diffs for working tree, staged, or between refs
- `get_blame` — Who last modified each line of a file
- `get_branches` — Local and remote branches
- `get_remotes` — List remotes and URLs (for push/pull targets)
- `suggest_commit_message` — Staged diff for AI to suggest commit messages

**Write**
- `stage` — Stage files for commit (git add)
- `unstage` — Unstage files (git reset)
- `commit` — Create a commit with staged changes
- `push` — Push to remote (protected branches blocked)
- `pull` — Pull from remote
- `checkout` — Switch branch or restore file
- `create_branch` — Create and optionally checkout a branch
- `delete_branch` — Delete local branch (protected branches blocked)
- `merge` — Merge a branch into the current branch (cannot merge into protected branches)
- `stash` — Stash changes (push/pop/list)

**Configuration** (environment variables)
- `GIT_MIND_ALLOWED_ACTIONS` — Comma-separated list of allowed operations (default: `stage,unstage,commit`). Add `push,pull,checkout,create_branch,delete_branch,merge,stash` to enable sync, branching, merge, and stash.
- `GIT_MIND_PROTECTED_BRANCHES` — Branches to protect from push/delete/merge (default: `main,master`)
- `GIT_MIND_STRICT_MODE` — Set to `1` to disable force operations

## Installation

```bash
npm install -g git-mind-mcp
# or
npx git-mind-mcp
```

## Usage

### Standalone (stdio)

```bash
# Use current directory as repo
npx git-mind-mcp

# Specify repo path
npx git-mind-mcp /path/to/your/repo
```

### LibreChat

See [LibreChat Integration](docs/integrations/librechat.md) for detailed setup. Quick start — add to `librechat.yaml`:

```yaml
mcpServers:
  git-mind:
    type: stdio
    command: npx
    args:
      - -y
      - git-mind-mcp
      - /path/to/your/repo   # optional; omit to use process cwd
    timeout: 30000
```

For submodule or local development setup, see [LibreChat Integration](docs/integrations/librechat.md).

## Development

```bash
npm install
npm run build
npm run dev    # Run with tsx (no build needed)
npm test
```

## License

MIT
