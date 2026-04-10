# Setup - Status Bar Indicator

## Install
No new dependencies. Uses existing Obsidian Plugin API and project toolchain.

```bash
npm install   # if not already done
```

## Config
No additional configuration. Reads existing `WhitelistSettings.showCompliantIndicator` (defaults to `false` in `src/settings.ts`).

## Run
```bash
npm run dev    # esbuild watch mode
```

## Test
```bash
npm run test                              # full Vitest suite
npm run test -- status-bar-indicator      # filter to this feature
```
