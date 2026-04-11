// AICODE-NOTE: distribution-packaging INIT-002 creates module per plan.md
// "Structure A (Standalone Module)". Lives under scripts/ to keep build
// concerns out of src/. The thin runner scripts/package.mjs imports
// runPackage from here.
//
// AICODE-NOTE: INIT-004 defines constants per data-model.md Constants table.
// TEMPLATE_DATA_JSON is an inline literal copy of DEFAULT_SETTINGS from
// src/settings.ts. Per plan.md Implementation Notes, we do NOT dynamically
// import the TS file -- a drift-guard unit test (TEST-003) will enforce
// structural equality with the source of truth.
//
// AICODE-NOTE: INIT-005 scaffolds helper function stubs. Real behavior
// arrives in Phase 2+ TDD cycles (IMPL-001..IMPL-013 in tasks.md).

/**
 * Format for the output zip filename. Derived from `manifest.id` per FR-006.
 * Usage: `${manifestId}.zip`
 */
export const ZIP_FILENAME_FORMAT = "${manifestId}.zip";

/**
 * Entries that MUST be present in every distribution zip (FR-002).
 * @type {readonly string[]}
 */
export const REQUIRED_ENTRIES = Object.freeze([
	"main.js",
	"manifest.json",
	"data.json",
]);

/**
 * Entries that are included only if present on disk at packaging time (FR-005).
 * @type {readonly string[]}
 */
export const OPTIONAL_ENTRIES = Object.freeze(["styles.css"]);

/**
 * Inline literal copy of `DEFAULT_SETTINGS` from `src/settings.ts`.
 *
 * This is the canonical template `data.json` that ships in every distribution
 * zip. IS admins edit this file post-extraction to configure their whitelist /
 * blacklist before deploying to user vaults (FR-004).
 *
 * AICODE-NOTE: Do NOT dynamically import src/settings.ts from this .mjs file.
 * The drift-guard test (TEST-003 in tests/unit/distribution-packaging.test.ts)
 * imports DEFAULT_SETTINGS and asserts structural equality. If either side
 * changes, the test fails loudly -- fix BOTH.
 */
export const TEMPLATE_DATA_JSON = Object.freeze({
	whitelist: [],
	blacklist: [],
	notificationDirectory: ".obsidian-whitelist/notifications/",
	showCompliantIndicator: false,
});

/** Process exit code on successful packaging run (ux.md success path). */
export const EXIT_CODE_SUCCESS = 0;

/** Process exit code on any failure during packaging (ux.md failure paths). */
export const EXIT_CODE_FAILURE = 1;

/**
 * Template for the success message printed on stdout (UX-001).
 * Placeholders: `${filename}`, `${sizeBytes}`, `${absolutePath}`.
 */
export const SUCCESS_MESSAGE_FORMAT =
	"\u2713 Created ${filename} (${sizeBytes} bytes) at ${absolutePath}";

/** Error message printed when `tsc -noEmit` fails (FR-003, ux.md validation_error). */
export const TS_FAILURE_MESSAGE =
	"Error: TypeScript compilation failed. Fix the errors above and re-run `npm run package`.";

/**
 * Template for filesystem failure messages (ux.md permission_denied).
 * Placeholders: `${path}`, `${errorCode}`.
 */
export const FS_FAILURE_MESSAGE_FORMAT =
	"Error: cannot write ${path}: ${errorCode}. Check filesystem permissions and disk space, then re-run `npm run package`.";

// AICODE-TODO: IMPL-001 implement zip filename derivation from manifest.id (FR-006).
/**
 * Derives the output zip filename from a plugin manifest (FR-006).
 * STUB: throws until IMPL-001 lands.
 */
export function getZipFilename(manifest) {
	void manifest;
	throw new Error("getZipFilename: not implemented (IMPL-001)");
}

// AICODE-TODO: IMPL-002 implement template data.json generation (FR-004).
/**
 * Returns a deep clone of the canonical template data.json object (FR-004).
 * STUB: throws until IMPL-002 lands.
 */
export function getTemplateDataJson() {
	throw new Error("getTemplateDataJson: not implemented (IMPL-002)");
}

// AICODE-TODO: IMPL-003 + IMPL-009 implement staging of REQUIRED_ENTRIES and
// optional OPTIONAL_ENTRIES (FR-002, FR-005).
/**
 * Copies REQUIRED_ENTRIES and any present OPTIONAL_ENTRIES from `projectRoot`
 * into `stagingDir`, and writes a fresh template `data.json` into `stagingDir`.
 * STUB: throws until IMPL-003 lands.
 */
export async function stageEntries(stagingDir, projectRoot) {
	void stagingDir;
	void projectRoot;
	throw new Error("stageEntries: not implemented (IMPL-003)");
}

// AICODE-TODO: IMPL-004 implement zip writing via dynamic import('archiver').
/**
 * Writes a zip archive containing every file in `stagingDir` at a flat layout
 * (no directory prefix) to `zipPath`, resolving with the written byte size.
 * STUB: throws until IMPL-004 lands.
 */
export async function writeZip(stagingDir, zipPath) {
	void stagingDir;
	void zipPath;
	throw new Error("writeZip: not implemented (IMPL-004)");
}

// AICODE-TODO: IMPL-011 implement idempotent staging cleanup via fs.rm force.
/**
 * Removes a staging directory recursively. Idempotent -- calling on an
 * already-removed path does NOT throw.
 * STUB: throws until IMPL-011 lands.
 */
export async function cleanupStaging(stagingDir) {
	void stagingDir;
	throw new Error("cleanupStaging: not implemented (IMPL-011)");
}

// AICODE-TODO: IMPL-005 + IMPL-012 implement orchestration with try/finally.
/**
 * Main entry point. Reads the project manifest, derives the zip filename,
 * removes any pre-existing zip with the target name, creates a temp staging
 * dir, stages entries, writes the zip, and cleans up on every exit path.
 * STUB: throws until IMPL-005 lands.
 */
export async function runPackage(opts) {
	void opts;
	throw new Error("runPackage: not implemented (IMPL-005)");
}
