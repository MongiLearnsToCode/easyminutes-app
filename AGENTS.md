# AGENTS.md
Guidelines for agentic coding agents in this repo.

## Build/Lint/Test
- Install: `npm install`
- Dev: `npm run dev`
- Build/Preview: `npm run build && npm run preview`
- Typecheck: `npx tsc -p tsconfig.json`
- Run single test: `vitest run path/to/test.ts` (no test suite configured)

## Code Style
- **Stack**: TS + React 18 + Vite
- **Imports**: `@/*` alias, named exports
- **Formatting**: Semicolons, single quotes, Tailwind CDN
- **Types**: Strict-ish TS, props via interfaces
- **Naming**: PascalCase components, camelCase vars
- **Errors**: Surface in UI, throw clear Errors
- **Env**: `GEMINI_API_KEY` via `.env.local`
- **Services**: No side-effects in components

## Rules
- Cursor/Copilot: None configured