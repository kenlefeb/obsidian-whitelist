# Research Notes - Distribution Packaging

## Key Decisions

- **Zip library**: Use Node's built-in `zlib` via the lightweight `archiver` npm package. `archiver` is the de-facto Node zip writer (3M+ weekly downloads), zero native deps, streams directly to a file. No reason to invent custom zip writing for ~5 files.
- **Script language**: Plain ESM `.mjs` script under repo root (`scripts/package.mjs`), invoked from `package.json` as `npm run package`. Matches the existing `esbuild.config.mjs` convention; no TypeScript build step needed for a build script.
- **Build invocation**: `package` script runs `tsc -noEmit -skipLibCheck && node esbuild.config.mjs production && node scripts/package.mjs`. Reuses the existing `build` semantics and adds the zip step. Failure of `tsc` or esbuild halts the chain via `&&` (FR-003).
- **Template `data.json` source**: Derive at packaging time from `DEFAULT_SETTINGS` in `src/settings.ts` (compiled from `main.js` is awkward — instead, the package script imports the TypeScript source via `tsx`/`jiti` OR re-declares the defaults inline and asserts them against the source via a unit test). Decision: re-declare defaults inline in `scripts/package.mjs` and add a unit test that asserts the inline copy matches `DEFAULT_SETTINGS`. Avoids a runtime TS loader for a one-line constant.
- **Why not reuse the repo's `data.json`**: The repo's `data.json` is the developer's local working settings (already contains `"whitelist": ["whitelist"]`, `showCompliantIndicator: true`). Bundling it would leak dev state into the distribution. Generate fresh defaults instead (FR-004).
- **Zip filename**: Read from `manifest.json#id` (currently "obsidian-whitelist") rather than hardcoding. If the manifest id changes, the package name follows automatically (FR-006).
- **Optional `styles.css`**: `fs.existsSync` check before staging. No error if missing — the plugin is fully functional without it (FR-005, edge case scenario 5). Currently `styles.css` exists in the repo from the status-bar-indicator feature, so the production zip will include it.

## Critical Risks

- **Dev `data.json` accidentally bundled**: If a future contributor changes the package script to copy `./data.json` directly, dev state leaks into distribution. → Mitigation: package script must NEVER read `./data.json`; covered by an integration test that asserts the bundled `data.json` equals the canonical defaults.
- **Stale zip on failure**: If a previous run left a zip and the new run fails partway, users could deploy stale binaries. → Mitigation: package script removes any pre-existing `obsidian-whitelist.zip` at the start of a run, and only writes the new zip after staging succeeds.
- **`archiver` ESM compatibility**: `archiver` ships CJS only. → Mitigation: use Node's built-in dynamic `import('archiver')` interop, which works in `.mjs` because Node provides default-export compat for CJS modules. Confirmed working pattern in similar Node tooling.

## Stack Compatibility

- Node 18+ + ESM `.mjs` scripts: ✔ (project already uses `esbuild.config.mjs` ESM)
- `archiver` 7.x as `devDependency`: ✔ (zero native deps, MIT licensed)
- Vitest unit test for the package script: ✔ (existing test infra; spawn the script in a temp dir)
- No new runtime dependencies — `archiver` is dev-only.
