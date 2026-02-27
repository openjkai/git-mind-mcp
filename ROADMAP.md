# Git Mind MCP — Roadmap

A powerful MCP server for Git actions — enabling AI assistants (Cursor, Claude, ChatGPT) to safely control repositories including private and self-hosted remotes.

---

## Vision

Git Mind MCP aims to be the go-to MCP server for Git intelligence and actions. It provides read operations (status, diff, blame, branches) and write workflows (stage, unstage, commit, push, pull, checkout, merge, stash, fetch, reset, branching) with built-in guardrails to prevent destructive operations.

---

## Current Status

| Area | Status |
|------|--------|
| Read tools | ✅ Complete |
| Write tools | ✅ stage, unstage, commit, push, pull, checkout, create_branch, delete_branch, merge, stash, fetch, reset |
| Safety layer | ✅ Config + guard |
| Private server support | ✅ Via standard Git (SSH/HTTPS) |

### Available Now

**Read**
- `get_status` — Working tree and staged changes
- `get_commit_history` — Recent commits with author, date, message
- `get_diff` — Diffs for working tree, staged, or between refs
- `get_blame` — Line-by-line blame
- `get_branches` — Local and remote branches
- `get_remotes` — List remotes and URLs
- `suggest_commit_message` — Staged diff for AI commit message suggestions

**Write**
- `stage`, `unstage`, `commit` — Stage and commit changes
- `push`, `pull` — Sync with remotes (guardrails applied)
- `checkout` — Switch branch or restore file
- `create_branch`, `delete_branch` — Branch management (protected branches blocked)
- `merge` — Merge a branch into current (cannot merge into protected branches)
- `stash` — Stash working changes (push/pop/list)
- `fetch` — Fetch from remote (updates refs, no merge)
- `reset` — Reset HEAD (soft/mixed only; --hard blocked)

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
*Target: ~1 week* ✅ (merge, stash, reset, fetch done)

- ~~`merge`~~ ✅
- ~~`stash` (push/pop/list)~~ ✅
- ~~`reset` (soft/mixed only)~~ ✅
- ~~`fetch`~~ ✅
- Optional `force_push` behind config flag
- Dry-run support for critical ops
- Client setup docs: Cursor, Claude, ChatGPT
- Integration tests for remote operations (optional)

### Phase 4 — Release & Iteration  
*Target: Ongoing*

- npm publish, changelog, contribution guide
- Community feedback and iteration
- Optional: config file, `cherry_pick`, `revert`, `tag`

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
| stage | ✅ | Low |
| unstage | ✅ | Low |
| commit | ✅ | Low |
| push | ✅ | Medium |
| pull | ✅ | Medium |
| checkout | ✅ | Low |
| create_branch | ✅ | Low |
| delete_branch | ✅ | Medium |
| merge | ✅ | Medium |
| stash | ✅ | Low |
| reset | ✅ | Medium (soft/mixed only) |
| fetch | ✅ | Low |
| force_push | 🔲 | High |

---

## Safety Model

- **Safe by default** — Destructive ops (`reset --hard`, `push --force`) blocked unless explicitly enabled
- **Protected branches** — Configurable list (e.g. `main`, `master`) where force/delete are blocked
- **Operation allowlist** — Only approved actions can run; configurable per environment

See [docs/safety.md](docs/safety.md) for details.

---

## Links

- [README](README.md) — Installation and usage
- [LibreChat Integration](docs/integrations/librechat.md) — Setup for LibreChat

---

*Last updated: February 25, 2025*
