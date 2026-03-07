# Git Mind MCP

**MCP server for Git intelligence** — status, diff, blame, branches, merge, stage, commit, push, pull, checkout, stash, fetch, reset, cherry_pick, revert, tag. Works with any MCP-compatible client (Cursor, Claude Desktop, [LibreChat](https://librechat.ai), etc.).

> **[Roadmap](ROADMAP.md)** — Planned features, phases, and timeline.  
> **[Contributing](CONTRIBUTING.md)** — How to contribute.

## Features

**Read**
- `get_status` — Working tree and staged changes
- `get_commit_history` — Recent commits with author, date, message
- `get_diff` — Diffs for working tree, staged, or between refs
- `get_blame` — Who last modified each line of a file
- `get_branches` — Local and remote branches
- `get_remotes` — List remotes and URLs (for push/pull targets)
- `get_reflog` — Reflog (recovery, lost commits, branch history)
- `get_show` — Show a specific commit (message, author, diff)
- `get_config` — Read Git config (specific key or all)
- `suggest_commit_message` — Staged diff for AI to suggest commit messages

**Write**
- `init` — Initialize a new Git repository (git init; supports bare)
- `clone` — Clone a repository from URL (git clone)
- `stage` — Stage files for commit (git add)
- `unstage` — Unstage files (git reset)
- `commit` — Create a commit with staged changes
- `push` — Push to remote (protected branches blocked)
- `force_push` — Force push (opt-in via GIT_MIND_ALLOWED_ACTIONS; protected branches blocked)
- `pull` — Pull from remote
- `checkout` — Switch branch or restore file
- `create_branch` — Create and optionally checkout a branch
- `delete_branch` — Delete local branch (protected branches blocked)
- `branch_rename` — Rename a branch (protected branches blocked)
- `merge` — Merge a branch into the current branch (cannot merge into protected branches)
- `stash` — Stash changes (push/pop/list)
- `fetch` — Fetch from remote (updates refs, no merge)
- `reset` — Reset HEAD (soft/mixed only; --hard blocked)
- `cherry_pick` — Apply a commit onto current branch (protected branches blocked)
- `revert` — Create revert commit (protected branches blocked)
- `tag` — List tags or create lightweight/annotated tag
- `rebase` — Rebase current branch onto another (action: rebase/abort/continue; protected branches blocked)
- `remote` — Add, remove, or set URL of remotes (config file + dry-run; protected remotes like origin blocked from remove)
- `mv` — Move or rename files (git mv; tracks rename for better diff history)
- `archive` — Create tar/zip archive of repo at a ref (release bundles; dry-run)
- `bisect` — Binary search to find bug-introducing commit (start/bad/good/reset/run)
- `worktree` — Manage multiple working trees (add/list/remove)
- `get_describe` — Human-readable ref description (e.g. v1.2.3-5-gabc1234)

**Configuration** (optional config file + environment variables; env overrides file)
- **Config file** — Place `git-mind.config.json` or `.git-mind.json` in the working directory (or set `GIT_MIND_CONFIG_FILE`). See [git-mind.config.example.json](git-mind.config.example.json) and [Safety Model](docs/safety.md).
- `GIT_MIND_ALLOWED_ACTIONS` — Comma-separated list of allowed operations (default: `stage,unstage,commit`). Add `init,clone,push,force_push,pull,checkout,create_branch,delete_branch,branch_rename,merge,stash,fetch,reset,cherry_pick,revert,tag,rebase,remote,mv,archive,bisect,worktree` to enable init, clone, sync, branching, merge, stash, fetch, reset, cherry_pick, revert, tag, rebase, remote, branch_rename, mv, archive, bisect, worktree, and optional force_push.
- `GIT_MIND_PROTECTED_BRANCHES` — Branches to protect from push/delete/merge (default: `main,master`)
- `GIT_MIND_PROTECTED_REMOTES` — Remotes to protect from removal (default: `origin`; config file supports array)
- `GIT_MIND_STRICT_MODE` — Set to `1` to disable force operations
- `GIT_MIND_DRY_RUN` — Set to `1` to simulate critical ops (init, clone, push, pull, merge, delete_branch, reset, cherry_pick, revert, rebase, remote) without executing

## Client Setup

- [Cursor](docs/setup/cursor.md) — [Claude Desktop](docs/setup/claude-desktop.md) — [ChatGPT](docs/setup/chatgpt.md) — [LibreChat](docs/integrations/librechat.md)

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

Requires **Node.js >= 22**. Use [nvm](https://github.com/nvm-sh/nvm) (or fnm, asdf) for version management:

```bash
nvm use          # or: fnm use / asdf install
npm install
npm run build
npm run dev    # Run with tsx (no build needed)
npm test
```

`.nvmrc` and `.node-version` specify Node 22 for nvm/fnm/asdf.

> **Why Node 22?** We target Node 22 LTS for improved performance, native ESM stability, and alignment with the current Node LTS schedule. If you need Node 20 support, use v1.x.

## License

MIT
