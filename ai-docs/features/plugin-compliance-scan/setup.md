# Setup - Plugin Compliance Scan

## Install
No additional dependencies — uses Obsidian Plugin API and existing project setup.

## Config
Depends on plugin-settings feature (WhitelistSettings interface in `src/settings.ts`).

## Run
```bash
npm run dev
```

## Test
```bash
npm test          # Vitest unit tests
npm run build     # TypeScript compilation check
npm run lint      # ESLint check
```
