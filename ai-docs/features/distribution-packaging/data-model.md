# Data Model - Distribution Packaging

## Entities

### DistributionPackage
The zip artifact written to the project root.

| Field | Type | Required | Source | Notes |
|-------|------|----------|--------|-------|
| filename | string | yes | `manifest.json#id` + `.zip` | e.g., `obsidian-whitelist.zip` (FR-006) |
| absolutePath | string | yes | `path.resolve(filename)` | Printed on success (UX-001) |
| sizeBytes | number | yes | `fs.statSync(filename).size` | Printed on success |
| contents | PackageEntry[] | yes | derived from staging step | Required + optional entries below |

### PackageEntry
A single file inside the zip.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | yes | Entry path inside the zip (no directory prefix; flat layout) |
| sourcePath | string | yes | Absolute or project-relative path on disk |
| optional | boolean | yes | True only for `styles.css` |

### TemplateSettings [Dependency]
Defined in `ai-docs/features/plugin-settings/data-model.md` as `WhitelistSettings`. The packaging script bundles a JSON serialization of the canonical defaults:
- `whitelist: []`
- `blacklist: []`
- `notificationDirectory: ".obsidian-whitelist/notifications/"`
- `showCompliantIndicator: false`

The template MUST equal `DEFAULT_SETTINGS` exported from `src/settings.ts` (FR-004) — enforced by unit test, not runtime import.

## Enums

### PackageStep
- `compiling` — `tsc -noEmit -skipLibCheck` running
- `bundling` — `node esbuild.config.mjs production` running
- `staging` — Files being copied / generated into the temp staging dir
- `zipping` — `archiver` writing the zip
- `success` — Zip exists at project root, exit 0
- `failed` — One of the prior steps failed; temp dir cleaned, exit 1

## States & Transitions

| From | Trigger | To |
|------|---------|----|
| `idle` | User runs `npm run package` | `compiling` |
| `compiling` | `tsc` exit 0 | `bundling` |
| `compiling` | `tsc` exit ≠ 0 | `failed` (FR-003) |
| `bundling` | esbuild success | `staging` |
| `bundling` | esbuild error | `failed` |
| `staging` | All required entries copied | `zipping` |
| `staging` | fs error (e.g., missing `main.js` after build) | `failed` |
| `zipping` | `archiver` finalize success | `success` |
| `zipping` | fs error writing zip | `failed` |

State machine is implicit in script step ordering; no persistent storage required.

## Constants

| Name | Value | Source |
|------|-------|--------|
| ZIP_FILENAME_FORMAT | `` `${manifestId}.zip` `` | FR-006 |
| REQUIRED_ENTRIES | `["main.js", "manifest.json", "data.json"]` | FR-002 |
| OPTIONAL_ENTRIES | `["styles.css"]` | FR-005 |
| TEMPLATE_DATA_JSON | Serialization of `DEFAULT_SETTINGS` from `src/settings.ts` | FR-004 |
| EXIT_CODE_SUCCESS | `0` | ux.md success path |
| EXIT_CODE_FAILURE | `1` | ux.md failure paths |
| SUCCESS_MESSAGE_FORMAT | `` `✓ Created ${filename} (${sizeBytes} bytes) at ${absolutePath}` `` | UX-001 |
| TS_FAILURE_MESSAGE | `"Error: TypeScript compilation failed. Fix the errors above and re-run \`npm run package\`."` | FR-003, ux.md validation_error |
| FS_FAILURE_MESSAGE_FORMAT | `` `Error: cannot write ${path}: ${errorCode}. Check filesystem permissions and disk space, then re-run \`npm run package\`.` `` | ux.md permission_denied |

## Validation Rules

- `filename` MUST end with `.zip` and contain no path separators.
- `REQUIRED_ENTRIES` MUST all exist in the zip; absence of any required entry MUST fail the build (FR-002).
- `TEMPLATE_DATA_JSON` MUST round-trip through `JSON.parse` and structurally equal `DEFAULT_SETTINGS` (enforced by unit test, FR-004).
- `OPTIONAL_ENTRIES` are included if and only if the source file exists at packaging time (FR-005).
- The packaging script MUST NOT read or include the project's working `./data.json` — only the inline template (research.md risk).
- The packaging script MUST remove any pre-existing zip with the target filename before writing the new one (research.md "Stale zip on failure").
- On any failure, the temp staging directory MUST be removed before exit (ux.md exit-path cleanup).
