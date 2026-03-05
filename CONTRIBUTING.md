# Contributing to Git Mind MCP

Thank you for considering contributing! This document outlines how to get started.

## Prerequisites

- **Node.js 22+** — Use nvm, fnm, or asdf. `.nvmrc` and `.node-version` specify Node 22.
- **Git** — For cloning and contributing.

## Getting Started

```bash
git clone https://github.com/your-username/git-mind-mcp.git
cd git-mind-mcp
npm install
npm run build
npm test
```

## Development Workflow

1. **Create a branch** — Use a descriptive branch name (e.g. `feat/add-remote-tool`, `fix/push-error-handling`).
2. **Make changes** — Edit code under `src/`. Follow existing patterns.
3. **Add tests** — Put tests in `__tests__/`. Use Vitest. Mirror the structure of `src/`.
4. **Run tests** — `npm test` or `npm run test:watch` for watch mode.
5. **Build** — `npm run build` ensures the build passes.
6. **CI** — `npm run ci` runs build + tests (same as CI pipeline).

## Code Style

- **TypeScript** — Strict mode. Use Zod for input validation.
- **Tools** — Each tool lives in `src/tools/<name>.ts`. Use `textResponse()` from `src/lib/response.ts`.
- **Safety** — All write tools must call `checkOperationAllowed()`. Critical ops respect `isProtectedBranch()` and `isDryRun()`.
- **Errors** — Use `formatGitError()` for user-facing messages.

## Adding a New Tool

1. Create `src/tools/<tool-name>.ts` with a Zod schema, guard checks, and handler.
2. Register in `src/tools/index.ts`.
3. Add tests in `__tests__/tools/<tool-name>.test.ts`.
4. Update `__tests__/tools/registration.test.ts` with the new tool name.
5. Update README, ROADMAP, and docs as needed.
6. Add to `GIT_MIND_ALLOWED_ACTIONS` docs if it's a write tool.

## Submitting Changes

1. Ensure all tests pass: `npm run ci`
2. Commit with a clear message (e.g. `feat: add remote add/remove tool`)
3. Open a pull request against `develop` (or `main` per project convention)
4. Reference any related issues

## Project Structure

```
src/
├── config/          # Configuration loading (env + file)
├── lib/              # Shared utilities (git, guard, response, format-git-error)
├── tools/            # MCP tool implementations
└── index.ts          # Server entry
__tests__/
├── tools/            # Tool tests
├── lib/              # Lib tests
└── config.test.ts
docs/
├── setup/            # Client setup (Cursor, Claude, ChatGPT)
├── integrations/     # LibreChat
└── safety.md
```

## Questions

Open an issue for questions, bugs, or feature requests.
