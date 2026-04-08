# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Obsidian Plugin Whitelist — an Obsidian community plugin that enforces allowed/prohibited plugin lists. Users configure enforcement modes (strict, lax, warn, off) and plugin ID lists via a settings tab.

## Build Commands

- `npm install` — install dependencies
- `npm run dev` — compile with esbuild in watch mode (development)
- `npm run build` — type-check with tsc then bundle for production
- `npm run lint` — run ESLint (uses `eslint-plugin-obsidianmd` recommended config)

No test framework is configured. Testing is manual: copy `main.js`, `manifest.json`, `styles.css` into a vault's `.obsidian/plugins/obsidian-whitelist/` and reload Obsidian.

## Architecture

Two source files in `src/`:

- **`src/main.ts`** — `WhitelistPlugin` (extends `Plugin`) handles lifecycle (`onload`/`onunload`), settings persistence, and delegates enforcement to an `Enforcer` class (currently a stub). Displays compliance status in the status bar.
- **`src/settings.ts`** — `WhitelistSettings` interface, `EnforcementMode` enum, `DEFAULT_SETTINGS`, and `WhitelistSettingTab` (the settings UI with dropdowns and text areas for allowed/prohibited plugin lists).

esbuild bundles `src/main.ts` into `main.js` at the repo root. The `obsidian` package and CodeMirror modules are externalized (provided by Obsidian at runtime).

## Key Design Details

- Enforcement modes: `strict`, `lax`, `warn`, `off` — the `Enforcer` class is where enforcement logic should be implemented.
- Settings store two lists of plugin IDs: `allowed` and `prohibited`.
- The plugin is not desktop-only (`isDesktopOnly: false`), so code must remain mobile-compatible.
- CI runs lint and build on Node 20.x and 22.x via GitHub Actions.

## Conventions from AGENTS.md

- Keep `main.ts` minimal (lifecycle only); delegate feature logic to separate modules.
- Use `this.register*` helpers for all event/interval/DOM cleanup.
- Command IDs must be stable once released.
- No network calls without clear user-facing reason and documentation.
- Prefer sentence case for UI text.
