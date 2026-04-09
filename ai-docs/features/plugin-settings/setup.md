# Setup - Plugin Settings

## Install
```bash
npm install
```
No additional dependencies required — uses Obsidian Plugin API only.

## Config
- `tsconfig.json` — existing, no changes needed
- `esbuild.config.mjs` — existing, no changes needed
- `manifest.json` — existing, `isDesktopOnly: false` already set

## Run
```bash
npm run dev
```
Copy built files to test vault: `.obsidian/plugins/obsidian-whitelist/`

## Test
```bash
npm run build   # TypeScript compilation check (tsc -noEmit)
npm run lint    # ESLint check
```
Note: Obsidian plugin testing requires manual verification in a vault or integration test harness. Unit tests for settings logic (merge, validation) can use Vitest with mocked Obsidian API.
