# Setup - Distribution Packaging

## Install
Adds one dev dependency.

```bash
npm install --save-dev archiver@^7
```

(`@types/archiver` is optional — the script is plain `.mjs` and uses dynamic import, so no compile-time types are needed.)

## Config
- `package.json` gains a `package` script: `tsc -noEmit -skipLibCheck && node esbuild.config.mjs production && node scripts/package.mjs`.
- No new environment variables. No new config files.

## Run
```bash
npm run package
```
On success the script writes `obsidian-whitelist.zip` to the project root and prints its absolute path.

## Test
```bash
npm run test                              # full Vitest suite
npm run test -- distribution-packaging    # filter to this feature
```

The integration test runs `npm run package` against a temp working dir (or invokes `scripts/package.mjs` directly with a stubbed manifest) and asserts:
- Exit code 0 on success / 1 on failure
- Required entries present in the zip
- `data.json` inside the zip equals `DEFAULT_SETTINGS`
- `styles.css` included when present, omitted when absent
