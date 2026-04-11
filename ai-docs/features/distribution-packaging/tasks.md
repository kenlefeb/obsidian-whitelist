# Tasks: Distribution Packaging

## Purpose
TDD task list for the `npm run package` build script. Adds `scripts/package.mjs` (thin runner), `scripts/lib/package-builder.mjs` (pure helpers), and unit tests in `tests/unit/distribution-packaging.test.ts`. Note: ui.md is intentionally absent — this is a CLI build tool with no UI components.

## Phase 1: Core Infrastructure

- [x] INIT-001 Add `archiver` ^7 as a devDependency: `npm install --save-dev archiver@^7` per setup.md
- [x] INIT-002 Create `scripts/lib/package-builder.mjs` with empty exports per plan.md Feature Code Organization
- [x] INIT-003 Create `scripts/package.mjs` thin runner skeleton (imports `runPackage` from `./lib/package-builder.mjs`, prints success/failure, sets exit code) per plan.md
- [x] INIT-004 Define constants in `scripts/lib/package-builder.mjs` per data-model.md Constants table: `ZIP_FILENAME_FORMAT`, `REQUIRED_ENTRIES`, `OPTIONAL_ENTRIES`, `TEMPLATE_DATA_JSON` (inline literal copy of `DEFAULT_SETTINGS`), `EXIT_CODE_SUCCESS`, `EXIT_CODE_FAILURE`, `SUCCESS_MESSAGE_FORMAT`, `TS_FAILURE_MESSAGE`, `FS_FAILURE_MESSAGE_FORMAT`
- [x] INIT-005 Scaffold helper function stubs in `scripts/lib/package-builder.mjs`: `getZipFilename(manifest)`, `getTemplateDataJson()`, `stageEntries(stagingDir, projectRoot)`, `writeZip(stagingDir, zipPath)`, `cleanupStaging(stagingDir)`, `runPackage(opts)` (no behavior yet)
- [x] INIT-006 Add `package` script to `package.json` chaining `tsc -noEmit -skipLibCheck && node esbuild.config.mjs production && node scripts/package.mjs` per plan.md Implementation Mapping
- [x] INIT-007 Create `tests/unit/distribution-packaging.test.ts` skeleton with Vitest imports and a `mkdtemp` helper that creates a per-test temp dir under `os.tmpdir()`
- [x] INIT-008 Add SIGINT handler in `scripts/package.mjs` that calls `cleanupStaging` before re-raising the signal (per plan.md State Management)

## Phase 2: User Story 1 - `npm run package` Produces Zip With Required Entries (P1)

> Spec scenario 1: Running `npm run package` produces a zip containing `main.js`, `manifest.json`, and `data.json`.

### TDD Cycle 1: Filename Derivation + Template Generation
**Coverage**:
- Requirements: FR-002, FR-004, FR-006, UX-001
- Data entities: `DistributionPackage`, `PackageEntry`, `TemplateSettings` [Dependency from `plugin-settings`]
- Constants: `ZIP_FILENAME_FORMAT`, `TEMPLATE_DATA_JSON`, `REQUIRED_ENTRIES`
- States: transition `idle → compiling`

#### RED Phase
- [x] TEST-001 [US1] Test `getZipFilename({ id: "obsidian-whitelist" })` returns `"obsidian-whitelist.zip"` per FR-006 in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-002 [US1] Test `getZipFilename` derives the filename from `manifest.id` (not hardcoded) — passing a different id yields a different filename in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-003 [US1] Test `getTemplateDataJson()` returns an object structurally equal to `DEFAULT_SETTINGS` imported from `../../src/settings.ts` (drift guard, FR-004) in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-004 [US1] Test `getTemplateDataJson()` does NOT include the developer's working `./data.json` values — asserts `whitelist === []`, `blacklist === []`, `showCompliantIndicator === false` (research.md leak guard) in `tests/unit/distribution-packaging.test.ts`

#### GREEN Phase
- [x] IMPL-001 [US1] Implement `getZipFilename` in `scripts/lib/package-builder.mjs` using `ZIP_FILENAME_FORMAT`
- [x] IMPL-002 [US1] Implement `getTemplateDataJson` in `scripts/lib/package-builder.mjs` returning `TEMPLATE_DATA_JSON` (inline literal)

### TDD Cycle 2: Staging Required Entries
**Coverage**:
- Requirements: FR-002
- Constants: `REQUIRED_ENTRIES`
- States: transition `bundling → staging`

#### RED Phase
- [x] TEST-005 [US1] Test `stageEntries(stagingDir, projectRoot)` copies `main.js` from `projectRoot` to `stagingDir/main.js` (uses fixture project root with stub `main.js`) in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-006 [US1] Test `stageEntries` copies `manifest.json` from `projectRoot` to `stagingDir/manifest.json` in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-007 [US1] Test `stageEntries` writes a `data.json` file in `stagingDir` whose parsed contents equal `getTemplateDataJson()` (FR-004) in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-008 [US1] Test `stageEntries` returns a `PackageEntry[]` containing all `REQUIRED_ENTRIES` in `tests/unit/distribution-packaging.test.ts`

#### GREEN Phase
- [x] IMPL-003 [US1] Implement `stageEntries` in `scripts/lib/package-builder.mjs` with required-entries copy/write logic

### TDD Cycle 3: Zip Production + Pre-existing Cleanup
**Coverage**:
- Requirements: FR-001, FR-002, FR-006, UX-001
- Constants: `SUCCESS_MESSAGE_FORMAT`, `EXIT_CODE_SUCCESS`
- States: transitions `staging → zipping`, `zipping → success`

#### RED Phase
- [x] TEST-009 [US1] Test `writeZip(stagingDir, zipPath)` produces a non-empty zip file at `zipPath` and returns the byte size in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-010 [US1] Test the produced zip contains all `REQUIRED_ENTRIES` (read back zip entry list and assert each name is present) in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-011 [US1] Test `runPackage({ projectRoot })` removes a pre-existing zip with the target filename before writing the new one (research.md "Stale zip on failure") in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-012 [US1] Test `runPackage` returns `{ filename, absolutePath, sizeBytes }` shape on success in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-013 [US1] Test `runPackage` cleans up the temp staging directory on success (assert `fs.existsSync(stagingDir) === false` after the call) in `tests/unit/distribution-packaging.test.ts`

#### GREEN Phase
- [x] IMPL-004 [US1] Implement `writeZip` in `scripts/lib/package-builder.mjs` using `archiver` with dynamic `import('archiver')` interop per research.md
- [x] IMPL-005 [US1] Implement `runPackage` in `scripts/lib/package-builder.mjs`: read manifest, derive filename, remove pre-existing zip, mkdtemp, call `stageEntries`, call `writeZip`, return result, run `cleanupStaging` in `try/finally`
- [x] IMPL-006 [US1] Wire `runPackage` into `scripts/package.mjs`: print `SUCCESS_MESSAGE_FORMAT` on success, exit `EXIT_CODE_SUCCESS`

## Phase 3: User Story 2 - Extracted Zip Loads in Obsidian (P1)

> Spec scenario 2: Extracting the zip into `.obsidian/plugins/obsidian-whitelist/` makes the plugin load on Obsidian boot. This is verified structurally — the zip must contain exactly the files Obsidian's plugin loader expects.

### TDD Cycle 4: Zip Layout Compatibility
**Coverage**:
- Requirements: FR-002 (the zip's structural contract with Obsidian's plugin loader)

#### RED Phase
- [x] TEST-014 [US2] Test the zip uses a flat layout (no directory prefix) — every entry name has no `/` separator — so extraction lands files directly in `.obsidian/plugins/obsidian-whitelist/` in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-015 [US2] Test the zip's `manifest.json` is parseable JSON and contains an `id` field matching the project's manifest (Obsidian loader requirement) in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-016 [US2] Test the zip's `main.js` is non-empty (Obsidian loader requirement) in `tests/unit/distribution-packaging.test.ts`

#### GREEN Phase
- [x] IMPL-007 [US2] Verify `stageEntries` in `scripts/lib/package-builder.mjs` writes entries with flat names (no `path.join` directory prefix) — adjust if `archiver` defaults differ

## Phase 4: User Story 3 - Customized `data.json` Persists (P2)

> Spec scenario 3: IS admin edits the bundled template `data.json` before deployment; plugin loads with those settings.

### TDD Cycle 5: Template Round-Trip Compatibility
**Coverage**:
- Requirements: FR-004
- Reused modules: `mergeSettings` from `src/settings.ts` (existing, plugin-settings feature)

#### RED Phase
- [x] TEST-017 [US3] Test the bundled `data.json` round-trips through `JSON.parse → mergeSettings` from `src/settings.ts` and yields `DEFAULT_SETTINGS` unchanged (template is a valid input to the existing settings loader) in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-018 [US3] Test that mutating the template `data.json` (e.g., `{ whitelist: ["plugin-a", "plugin-b"], blacklist: ["plugin-c"] }`) round-trips through `mergeSettings` and yields settings with those exact whitelist/blacklist values — proves the customization workflow works end-to-end in `tests/unit/distribution-packaging.test.ts`

#### GREEN Phase
- [x] IMPL-008 [US3] No code change required — `getTemplateDataJson` already produces a `mergeSettings`-compatible shape via the inline `TEMPLATE_DATA_JSON` literal. If TEST-017/018 fail, audit `TEMPLATE_DATA_JSON` against `WhitelistSettings` interface in `src/settings.ts`

## Phase 5: User Story 4 - `styles.css` Included When Present (P2)

> Spec scenario 4: Project has a `styles.css` file → zip includes it.

### TDD Cycle 6: Optional Styles Inclusion
**Coverage**:
- Requirements: FR-005
- Constants: `OPTIONAL_ENTRIES`

#### RED Phase
- [x] TEST-019 [US4] Test `stageEntries(stagingDir, projectRoot)` includes `styles.css` in the staging dir AND in the returned `PackageEntry[]` when `projectRoot/styles.css` exists (use a fixture project root with a stub styles.css) in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-020 [US4] Test the produced zip from `runPackage` contains `styles.css` as an entry when the source file is present in `tests/unit/distribution-packaging.test.ts`

#### GREEN Phase
- [x] IMPL-009 [US4] Extend `stageEntries` in `scripts/lib/package-builder.mjs` with the `OPTIONAL_ENTRIES` loop: `fs.existsSync` check before staging each optional entry

## Phase 6: User Story 5 - `styles.css` Absent → Zip Still Produced (P3)

> Spec scenario 5: Project has no `styles.css` file → zip is produced without it and the plugin still functions.

### TDD Cycle 7: Optional Styles Absence
**Coverage**:
- Requirements: FR-005
- Edge case: spec.md scenario 5

#### RED Phase
- [x] TEST-021 [US5] Test `stageEntries(stagingDir, projectRoot)` does NOT include `styles.css` and does NOT throw when `projectRoot/styles.css` is absent in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-022 [US5] Test the produced zip from `runPackage` does NOT contain `styles.css` as an entry when the source file is absent, AND the zip still contains all `REQUIRED_ENTRIES` in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-023 [US5] Test `runPackage` returns success (no error) when `styles.css` is absent in `tests/unit/distribution-packaging.test.ts`

#### GREEN Phase
- [x] IMPL-010 [US5] No additional code change expected — IMPL-009's existence gate handles this case. If TEST-021/022/023 fail, fix the existence check in `stageEntries`

## Phase 7: Failure Modes & Cleanup

### TDD Cycle 8: Build Failure + Cleanup
**Coverage**:
- Requirements: FR-003
- Constants: `TS_FAILURE_MESSAGE`, `FS_FAILURE_MESSAGE_FORMAT`, `EXIT_CODE_FAILURE`
- States: transitions `compiling → failed`, `bundling → failed`, `staging → failed`, `zipping → failed`
- Error types (ux.md): `validation_error`, `permission_denied`

#### RED Phase
- [x] TEST-024 [US1] Test `runPackage({ projectRoot })` throws and removes the temp staging directory when `projectRoot/main.js` is missing (simulates post-bundle failure) in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-025 [US1] Test `runPackage` throws and removes the temp staging directory when the target zip path is not writable (simulate by passing a `projectRoot` whose parent is read-only, or by stubbing `fs.createWriteStream` to throw) in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-026 [US1] Test `cleanupStaging(stagingDir)` is idempotent — calling it on an already-removed directory does NOT throw in `tests/unit/distribution-packaging.test.ts`
- [x] TEST-027 [US1] Test that `package.json#scripts.package` chains `tsc`, `esbuild`, and `node scripts/package.mjs` with `&&` so that a TypeScript failure aborts before the package script runs (FR-003) — assert by reading `package.json` and string-matching the chain in `tests/unit/distribution-packaging.test.ts`

#### GREEN Phase
- [x] IMPL-011 [US1] Implement `cleanupStaging` in `scripts/lib/package-builder.mjs` using `fs.rm(stagingDir, { recursive: true, force: true })` (idempotent)
- [x] IMPL-012 [US1] Wrap `runPackage` body in `try/finally` so `cleanupStaging` runs on every exit path
- [x] IMPL-013 [US1] In `scripts/package.mjs`, catch errors from `runPackage`, print `FS_FAILURE_MESSAGE_FORMAT` (or `TS_FAILURE_MESSAGE` for the compile path) to stderr, exit `EXIT_CODE_FAILURE`

## Execution Order

1. **Phase 1**: Core Infrastructure (blocks all stories)
2. **Phase 2** (US1, P1): Filename + template + staging + zip + lifecycle
3. **Phase 3** (US2, P1): Zip layout compatibility (depends on Phase 2)
4. **Phase 4** (US3, P2): Template round-trip with `mergeSettings`
5. **Phase 5** (US4, P2): Optional `styles.css` inclusion
6. **Phase 6** (US5, P3): Optional `styles.css` absence
7. **Phase 7**: Failure modes and cleanup (depends on Phase 2)

Within each story: RED → GREEN cycles.

## Notes

- All tests live in `tests/unit/distribution-packaging.test.ts` and use per-test temp dirs created via `fs.mkdtemp(os.tmpdir() + "/sbi-pkg-")`. Each test cleans up its own temp dir in an `afterEach`.
- No subprocess spawning — tests import `package-builder.mjs` directly. The `package.json` chain (TEST-027) is verified by string-matching, not by running `npm run package` from inside Vitest.
- `getTemplateDataJson()` MUST be the single source of truth for the bundled `data.json`. The drift-guard test (TEST-003) imports `DEFAULT_SETTINGS` from `src/settings.ts` and asserts structural equality — if either side changes, the test fails loudly.
- The script MUST NOT read or include the project's working `./data.json` (research.md risk; TEST-004 enforces).
- TEST-/IMPL- numbering is sequential across all user story phases.
- After this feature ships, update `ai-docs/README.md` to document the `npm run package` workflow for IS admins.
