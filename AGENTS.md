AGENTS.md

Build/lint/test
- Install: npm install
- Dev server: npm run dev (Vite)
- Build: npm run build; Preview: npm run preview
- Lint/typecheck: npx tsc -p tsconfig.json; no linter configured
- Tests: none configured; to run a single test, add vitest/jest first

Code style
- Language: TypeScript + React 18, Vite, JSX runtime (react-jsx)
- Imports: absolute alias @/* maps to project root; prefer named imports; keep React import when using hooks/types
- Formatting: follow existing semicolons, single quotes in errors/strings vary; keep Tailwind via CDN; no CSS-in-JS
- Types: strict-ish TS (skipLibCheck true); Component props typed via interfaces; use explicit types for public functions; MeetingSummary in types.ts:1-17
- Naming: PascalCase for components (e.g., Dashboard), camelCase for variables/functions; files .tsx for React, .ts for services/types
- Errors: surface user-facing errors via state and messages; throw Error with messages in services; avoid console logs except on errors
- Env/keys: GEMINI_API_KEY provided via .env.local and injected in vite.config.ts:4-16; do not log keys
- API/services: Gemini via @google/genai in services/geminiService.ts:2-87; Supabase client in services/dbService.ts:1-91; keep side-effects out of components except hooks
- Data: MeetingSummary has created_at (not createdAt); persist through Supabase; do not mutate state directly
- UI: Tailwind classes via CDN; keep components pure and small; prefer useCallback/useMemo for perf sensitive paths

Cursor/Copilot rules
- No Cursor or Copilot rule files found; if added, mirror their guidance here
