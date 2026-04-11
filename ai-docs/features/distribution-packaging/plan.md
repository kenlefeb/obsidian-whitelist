# Implementation Plan: Distribution Packaging

## Purpose
Provide an `npm run package` script that builds the plugin and produces a deployable zip (`<manifest.id>.zip`) containing `main.js`, `manifest.json`, a clean template `data.json`, and (if present) `styles.css`.

## Summary
Add a single ESM build script `scripts/package.mjs` plus an `archiver` dev dependency. The script orchestrates `tsc → esbuild → stage → zip`, generating a fresh template `data.json` from inline canonical defaults rather than copying the developer's working `./data.json` (research.md). A unit test asserts the inline defaults match `DEFAULT_SETTINGS` from `src/settings.ts` so the source of truth stays single.

## Technical Context

**Language:** Node.js ESM (`.mjs`); existing TypeScript source unchanged

**Framework:** Node 18+ standard library (`fs`, `path`, `os`, `child_process`, `process`) + `archiver` ^7 (dev-only)

**Storage:** Filesystem only — temp staging dir under `os.tmpdir()`, final zip written to project root

**API Layer:** N/A — CLI script invoked via npm

**Testing:** Vitest unit test colocated under `tests/unit/distribution-packaging.test.ts`. Tests invoke the script's exported functions directly (no subprocess) by extracting the staging/zip logic into a small importable module.

**Deployment:** N/A — produces an artifact for IS admins to deploy by hand

**Constraints:**
- MUST NOT include the developer's working `./data.json` (research.md risk)
- MUST run `tsc -noEmit -skipLibCheck` first and abort on TS errors (FR-003)
- Zip filename MUST be derived from `manifest.json#id` (FR-006)
- `styles.css` is optional (FR-005) — `fs.existsSync` gate
- Cleanup MUST run on every exit path including SIGINT

## Implementation Mapping

### Component Architecture

| Source artifact | Code module | Notes |
|-----------------|-------------|-------|
| `npm run package` script entry | `package.json#scripts.package` | Chains `tsc && esbuild && node scripts/package.mjs` |
| `scripts/package.mjs` | New ESM script | Thin runner: invokes `runPackage()` from the importable module, prints success/failure, sets exit code |
| `scripts/lib/package-builder.mjs` | New ESM module | Pure(-ish) functions: `getZipFilename(manifest)`, `getTemplateDataJson()`, `stageEntries(stagingDir)`, `writeZip(stagingDir, zipPath)`, `cleanupStaging(stagingDir)`, `runPackage(opts)` |
| Template `data.json` content | Inline constant in `package-builder.mjs` | Asserted equal to `DEFAULT_SETTINGS` by unit test |
| Test entrypoint | `tests/unit/distribution-packaging.test.ts` | Imports `package-builder.mjs` directly; uses `os.tmpdir()` per test |

### Data Models
- No persistent entities. `DistributionPackage` and `PackageEntry` (data-model.md) live as inline JSDoc/TypeScript-via-JSDoc shapes inside `package-builder.mjs`.
- `TemplateSettings` is a JSON literal whose shape mirrors `WhitelistSettings` from `src/settings.ts`.

### API Operations
- `runPackage({ projectRoot, includeStyles? }): Promise<{ filename, absolutePath, sizeBytes }>` — main entry; throws on failure
- `getZipFilename(manifest): string` — pure helper (FR-006)
- `getTemplateDataJson(): WhitelistSettingsLike` — pure helper returning the inline defaults (FR-004)
- `stageEntries(stagingDir, projectRoot): Promise<PackageEntry[]>` — copies `main.js`, `manifest.json`, optional `styles.css`; writes `data.json`
- `writeZip(stagingDir, zipPath): Promise<number>` — uses `archiver`; resolves with byte size
- `cleanupStaging(stagingDir): Promise<void>` — `fs.rm(stagingDir, { recursive: true, force: true })`

### State Management
- No persistent state. The script's state machine (data-model.md PackageStep) is implicit in step ordering.
- A top-level `try/finally` in `runPackage` guarantees `cleanupStaging` runs on both success and failure.
- `process.on("SIGINT")` handler in `scripts/package.mjs` invokes the same cleanup before re-raising the signal.

### Error Handling Approach
- TS compile failure (FR-003): `tsc` already exits non-zero — handled by the `&&` chain in `package.json`. The package script never starts.
- esbuild failure: same — handled by the `&&` chain.
- fs failures inside `runPackage`: caught at top level, formatted with `FS_FAILURE_MESSAGE_FORMAT` (data-model.md), printed to stderr, exit 1
- Pre-existing zip with the target name: removed at the start of `runPackage` (research.md "Stale zip")
- Required source file missing after build (e.g., `main.js` somehow absent): treated as fs failure with the same handler

## Feature Code Organization

```
scripts/
├── package.mjs                  # NEW: thin runner + SIGINT handler
└── lib/
    └── package-builder.mjs      # NEW: pure-ish staging/zip helpers

tests/
└── unit/
    └── distribution-packaging.test.ts   # NEW: unit + integration tests

package.json                     # MODIFIED: add `package` script + archiver devDep
```

**Selected Structure:** Structure A (Standalone Module) — feature is a pure build-tool concern with zero runtime overlap; isolating it under `scripts/` keeps the plugin's `src/` tree free of build code, mirroring the existing `esbuild.config.mjs` location.

## Testing Approach

- **Test Structure:** Single Vitest file `tests/unit/distribution-packaging.test.ts`. No subprocess spawning — functions are imported directly from `scripts/lib/package-builder.mjs` and exercised against per-test temp directories created with `fs.mkdtemp(os.tmpdir() + "/sbi-pkg-")`.
- **Unit coverage**:
  1. [US1] `getZipFilename` returns `${manifest.id}.zip` (FR-006)
  2. [US1] `getTemplateDataJson()` returns an object structurally equal to `DEFAULT_SETTINGS` imported from `../../src/settings.ts` — guards against drift between the inline copy and the source of truth (FR-004)
  3. [US1] `getTemplateDataJson()` does NOT include any of the developer's working `./data.json` keys (e.g., asserts whitelist is `[]`, not `["whitelist"]`) — research.md leak guard
  4. [US1] `stageEntries` copies `main.js`, `manifest.json`, and writes `data.json` into the staging dir (FR-002)
  5. [US2] `stageEntries` includes `styles.css` when it exists in the project root (FR-005)
  6. [US3] `stageEntries` skips `styles.css` and still succeeds when the file is absent (edge case scenario 5)
  7. [US1] `writeZip` produces a valid zip whose entries match `REQUIRED_ENTRIES` (read back with `archiver`'s sibling reader or `unzipper`) — at minimum assert the zip file exists and is non-empty
  8. [US1] `runPackage` removes a pre-existing zip with the target filename before writing the new one
  9. [US1] `runPackage` returns `{ filename, absolutePath, sizeBytes }` shape on success
  10. [US1] `runPackage` cleans up the staging dir on success (asserts the temp dir no longer exists)
  11. [US1] `runPackage` cleans up the staging dir on failure (force a failure by passing a non-writable `projectRoot`; assert temp dir is removed)
- **Integration sanity (optional, single test)**: Run `tsc --version` to confirm the chain prerequisite, then call `runPackage` against the real `projectRoot` and assert the produced zip contains all required entries. Skip if running in CI without a built `main.js`.

## Implementation Notes

- **Single source of truth for defaults**: The inline `TEMPLATE_DATA_JSON` in `package-builder.mjs` MUST be a literal copy of `DEFAULT_SETTINGS`. The drift-guard test (Test #2) is the enforcement mechanism. Do NOT dynamically import `src/settings.ts` from a `.mjs` script — the file extension mismatch and TS compilation requirement add friction without value for a 4-field constant.
- **Why not just copy `./data.json`**: The developer's working `data.json` is not the canonical default and is git-tracked with dev state. Bundling it would leak local config into every distribution. Generating fresh defaults eliminates the risk entirely.
- **Why `archiver` and not a shell `zip` command**: Cross-platform — `zip` is not always present on Windows dev machines. `archiver` works identically on macOS, Linux, and Windows.
- **Edge case coverage**: All five spec.md acceptance scenarios + both edge cases are covered by the test list above.
- **Scalability**: The zip contains 3-4 small files. No performance concerns. `archiver` streams to disk, so memory use is constant.
- **Existing module reuse**: `manifest.json` is read with `fs.readFile` (no helper exists yet — and none is needed for a single read). `package.json` script chain reuses the existing `tsc` + `esbuild.config.mjs` invocations from the current `build` script.
- **Documentation**: After this feature ships, update `ai-docs/README.md` and (optionally) `README.md` to mention `npm run package` as the deployment workflow for IS admins.
