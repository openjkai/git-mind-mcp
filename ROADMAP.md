# Git Mind MCP — Roadmap

A powerful MCP server for Git actions — enabling AI assistants (Cursor, Claude, ChatGPT) to safely control repositories including private and self-hosted remotes.

---

## Vision

Git Mind MCP aims to be the go-to MCP server for Git intelligence and actions. It provides read operations (status, diff, blame, branches) and write workflows (stage, unstage, commit, push, pull, checkout, merge, stash, fetch, reset, cherry_pick, revert, tag, branching) with built-in guardrails to prevent destructive operations.

---

## New Feature for Today
*March 2, 2026*

- ~~Optional config file~~ ✅ — Load config from `git-mind.config.json` or `.git-mind.json`; env vars override; supports `GIT_MIND_CONFIG_FILE` for custom path
- ~~Dry-run support for critical ops~~ ✅ — `GIT_MIND_DRY_RUN=1` simulates push, pull, merge, delete_branch, reset, cherry_pick, revert
- ~~Client setup docs~~ ✅ — Cursor, Claude Desktop, ChatGPT setup guides in `docs/setup/`
- ~~`rebase` tool~~ ✅ — Rebase current branch onto target; supports abort/continue for conflict resolution
- ~~changelog, contribution guide~~ ✅ — [CHANGELOG.md](CHANGELOG.md), [CONTRIBUTING.md](CONTRIBUTING.md)
- ~~`remote` tool~~ ✅ — Add/remove/set-url remotes; config file (protectedRemotes) + dry-run
- ~~`get_reflog` tool~~ ✅ — Reflog for recovery and debugging
- ~~Response UX improvements~~ ✅ — Markdown-style formatting, icons, clearer structure for status, history, branches, remotes, stage, commit, push
- ~~`init` tool~~ ✅ — Initialize new Git repository (git init; supports bare)
- ~~`clone` tool~~ ✅ — Clone repository from URL (git clone; config + dry-run)
- ~~`get_show` tool~~ ✅ — Show commit details (message, author, diff)
- ~~`get_config` tool~~ ✅ — Read Git configuration (key or all)
- ~~`branch_rename` tool~~ ✅ — Rename branch (protected branches blocked; dry-run)

---

## Current Status

| Area | Status |
|------|--------|
| Read tools | ✅ Complete |
| Write tools | ✅ stage, unstage, commit, push, force_push, pull, checkout, create_branch, delete_branch, merge, stash, fetch, reset, cherry_pick, revert, tag, rebase, remote, init, clone |
| Safety layer | ✅ Config file + env + guard |
| Private server support | ✅ Via standard Git (SSH/HTTPS) |

### Available Now

**Read**
- `get_status` — Working tree and staged changes
- `get_commit_history` — Recent commits with author, date, message
- `get_diff` — Diffs for working tree, staged, or between refs
- `get_blame` — Line-by-line blame
- `get_branches` — Local and remote branches
- `get_remotes` — List remotes and URLs
- `get_reflog` — Reflog (recovery, lost commits, branch history)
- `get_show` — Show commit details (message, author, diff)
- `get_config` — Read Git configuration (key or all)
- `get_log` — Commit log with filters
- `get_describe` — Human-readable ref description (e.g. v1.2.3-5-gabc1234)
- `get_ls_files` — List tracked (or staged, others) files
- `get_shortlog` — Summarize commits by author
- `suggest_commit_message` — Staged diff for AI commit message suggestions

**Write**
- `stage`, `unstage`, `commit` — Stage and commit changes
- `push`, `force_push`, `pull` — Sync with remotes (guardrails applied; force_push opt-in)
- `checkout` — Switch branch or restore file
- `create_branch`, `delete_branch`, `branch_rename` — Branch management (protected branches blocked)
- `merge` — Merge a branch into current (cannot merge into protected branches)
- `stash` — Stash working changes (push/pop/list)
- `fetch` — Fetch from remote (updates refs, no merge)
- `reset` — Reset HEAD (soft/mixed only; --hard blocked)
- `cherry_pick` — Apply a commit onto current branch (protected branches blocked)
- `revert` — Create revert commit (protected branches blocked)
- `tag` — List tags or create lightweight/annotated tag
- `rebase` — Rebase current branch onto another (rebase/abort/continue; protected branches blocked)
- `remote` — Add, remove, set-url remotes (config file + dry-run; protected remotes blocked)
- `init` — Initialize new Git repository (bare or normal)
- `clone` — Clone repository from URL into local directory
- `mv` — Move or rename files (git mv; tracks rename for better diff history)
- `archive` — Create tar/zip archive of repo at a ref (release bundles; dry-run)
- `bisect` — Binary search to find bug-introducing commit (start/bad/good/reset/run; dry-run)
- `worktree` — Manage multiple working trees (add/list/remove; dry-run)
- `get_describe` — Human-readable ref description (e.g. v1.2.3-5-gabc1234)
- `get_ls_files` — List tracked (or staged, others) files
- `get_shortlog` — Summarize commits by author

---

## Phases

### Phase 1 — Foundation & Core Actions  
*Target: ~1 week* ✅

- ~~Safety layer (operation allowlist, protected branches)~~ ✅
- ~~Environment-based config (`GIT_MIND_*`)~~ ✅
- ~~Write tools: `stage`, `unstage`, `commit`~~ ✅
- ~~`get_remotes` read tool~~ ✅
- ~~Unit tests for stage, unstage, commit~~ ✅

### Phase 2 — Sync & Branching  
*Target: ~1 week* ✅

- ~~`push`, `pull` with safety checks~~ ✅
- ~~`checkout`, `create_branch`, `delete_branch`~~ ✅
- ~~Protected-branch enforcement~~ ✅
- ~~Unit tests for push, pull, checkout, create_branch, delete_branch~~ ✅

### Phase 3 — Merge, Stash & Polish  
*Target: ~1 week* ✅ Complete

- ~~`merge`~~ ✅
- ~~`stash` (push/pop/list)~~ ✅
- ~~`reset` (soft/mixed only)~~ ✅
- ~~`fetch`~~ ✅
- ~~Optional `force_push` behind config flag~~ ✅ (add `force_push` to GIT_MIND_ALLOWED_ACTIONS)
- ~~Dry-run support for critical ops~~ ✅ (`GIT_MIND_DRY_RUN=1`)
- ~~Client setup docs: Cursor, Claude, ChatGPT~~ ✅
- *Deferred:* Integration tests for remote operations (optional)

### Phase 4 — Release & Iteration  
*Target: Ongoing*

- npm publish
- ~~changelog~~ ✅ ([CHANGELOG.md](CHANGELOG.md))
- ~~contribution guide~~ ✅ ([CONTRIBUTING.md](CONTRIBUTING.md))
- Community feedback and iteration
- ~~`cherry_pick`, `revert`, `tag`~~ ✅
- ~~Optional: config file~~ ✅

---

## Feature Matrix

| Tool | Status | Risk |
|------|--------|------|
| get_status | ✅ | — |
| get_commit_history | ✅ | — |
| get_diff | ✅ | — |
| get_blame | ✅ | — |
| get_branches | ✅ | — |
| suggest_commit_message | ✅ | — |
| get_remotes | ✅ | — |
| get_reflog | ✅ | — |
| get_show | ✅ | — |
| get_config | ✅ | — |
| stage | ✅ | Low |
| unstage | ✅ | Low |
| commit | ✅ | Low |
| push | ✅ | Medium |
| pull | ✅ | Medium |
| checkout | ✅ | Low |
| create_branch | ✅ | Low |
| delete_branch | ✅ | Medium |
| branch_rename | ✅ | Low |
| merge | ✅ | Medium |
| stash | ✅ | Low |
| reset | ✅ | Medium (soft/mixed only) |
| fetch | ✅ | Low |
| cherry_pick | ✅ | Medium |
| revert | ✅ | Medium |
| tag | ✅ | Low |
| rebase | ✅ | Medium |
| remote | ✅ | Low |
| init | ✅ | Low |
| clone | ✅ | Medium |
| mv | ✅ | Low |
| archive | ✅ | Low |
| bisect | ✅ | Low |
| worktree | ✅ | Low |
| get_describe | ✅ | — |
| get_ls_files | ✅ | — |
| get_shortlog | ✅ | — |
| force_push | ✅ | High (opt-in via GIT_MIND_ALLOWED_ACTIONS) |

---

## Safety Model

- **Safe by default** — Destructive ops (`reset --hard`, `push --force`) blocked unless explicitly enabled
- **Protected branches** — Configurable list (e.g. `main`, `master`) where force/delete are blocked
- **Operation allowlist** — Only approved actions can run; configurable per environment

See [docs/safety.md](docs/safety.md) for details.

---

## Links

- [README](README.md) — Installation and usage
- [CHANGELOG](CHANGELOG.md) — Version history
- [CONTRIBUTING](CONTRIBUTING.md) — Contribution guide
- [LibreChat Integration](docs/integrations/librechat.md) — Setup for LibreChat

---

*Last updated: March 2, 2026*
