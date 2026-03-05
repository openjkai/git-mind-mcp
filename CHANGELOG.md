# Changelog

All notable changes to Git Mind MCP are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-04

### Added

- **`remote` tool** — Add, remove, or set URL of remotes; config file (`protectedRemotes`) + dry-run; cannot remove protected remotes (default: origin)
- **`protectedRemotes` config** — Config file and `GIT_MIND_PROTECTED_REMOTES` env; default `["origin"]`
- **`rebase` tool** — Rebase current branch onto another; supports `action`: rebase/abort/continue; protected branches blocked
- **Optional config file** — Load from `git-mind.config.json` or `.git-mind.json`; env vars override; `GIT_MIND_CONFIG_FILE` for custom path
- **Dry-run mode** — `GIT_MIND_DRY_RUN=1` simulates push, pull, merge, delete_branch, reset, cherry_pick, revert, rebase without executing
- **Client setup docs** — Guides for [Cursor](docs/setup/cursor.md), [Claude Desktop](docs/setup/claude-desktop.md), [ChatGPT](docs/setup/chatgpt.md)
- **`force_push` tool** — Opt-in force push (requires `force_push` in `GIT_MIND_ALLOWED_ACTIONS`)
- **`cherry_pick`**, **`revert`**, **`tag`** tools

### Changed

- **Node.js >= 22** required (was Node 20+)
- Safety layer extended: config file + env + guard
- Reset tool: enhanced ref validation to prevent flag injection

### Fixed

- Internal slashes preserved in branch names for `toLocalBranchName`

---

## [1.x] - 2026-02

### Added

- **Read tools**: `get_status`, `get_commit_history`, `get_diff`, `get_blame`, `get_branches`, `get_remotes`, `suggest_commit_message`
- **Write tools**: `stage`, `unstage`, `commit`, `push`, `pull`, `checkout`, `create_branch`, `delete_branch`, `merge`, `stash`, `fetch`, `reset`
- **Safety**: `GIT_MIND_ALLOWED_ACTIONS`, `GIT_MIND_PROTECTED_BRANCHES`, `GIT_MIND_STRICT_MODE`
- LibreChat integration docs

[2.0.0]: https://github.com/your-username/git-mind-mcp/compare/v1.0.0...v2.0.0
