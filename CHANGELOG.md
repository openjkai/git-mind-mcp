# Changelog

## [Unreleased]

### Added

- `stash` — Stash working changes (push/pop/list)

## [1.1.0] - 2025-02-25

### Added

- `get_remotes` — List remotes and URLs
- `stage`, `unstage`, `commit` — Stage and commit changes
- `push`, `pull` — Sync with remotes (push: force-push to protected branches blocked; pull: normal sync)
- `checkout` — Switch branch or restore file
- `create_branch`, `delete_branch` — Branch management
- `merge` — Merge a branch into current (cannot merge into protected branches)
- Safety layer: operation allowlist, protected branches, strict mode

## [1.0.0] - 2025-02-18

### Added

- Initial release
- Read tools: get_status, get_commit_history, get_diff, get_blame, get_branches, suggest_commit_message
- stdio transport for MCP
- Optional repo path via CLI arg
