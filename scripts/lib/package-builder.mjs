// AICODE-NOTE: distribution-packaging IMPL-001..IMPL-012 -- pure(-ish) helpers
// that stage the plugin's distributable files and write them into a zip. Per
// plan.md "Structure A (Standalone Module)", this lives under scripts/ to keep
// build concerns out of src/. The thin runner scripts/package.mjs imports
// runPackage from here.
//
// AICODE-NOTE: TEMPLATE_DATA_JSON is an inline literal copy of DEFAULT_SETTINGS
// from src/settings.ts. Per plan.md Implementation Notes, we do NOT dynamically
// import the TS file -- a drift-guard unit test (TEST-003) enforces structural
// equality with the source of truth.
//
// AICODE-NOTE: getTemplateDataJson() is the ONLY path by which a data.json
// lands in the distribution zip. The script MUST NEVER read the repo's working
// ./data.json (research.md leak guard; TEST-004 enforces).

import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

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

/**
 * Temp staging dir prefix. Distinct from the test's `sbi-pkg-` prefix so tests
 * can differentiate builder-owned staging dirs from test-owned fixture roots.
 */
const STAGING_DIR_PREFIX = "sbi-pkg-build-";

/**
 * @typedef {object} PluginManifest
 * @property {string} id - Plugin id from manifest.json; drives the zip filename.
 */

/**
 * @typedef {object} PackageEntry
 * @property {string} name - Entry path inside the zip (flat; no directory prefix).
 * @property {string} sourcePath - Absolute or project-relative path on disk.
 * @property {boolean} optional - True only for OPTIONAL_ENTRIES members.
 */

/**
 * @typedef {object} PackageResult
 * @property {string} filename - The zip filename (e.g., "obsidian-whitelist.zip").
 * @property {string} absolutePath - Absolute path to the written zip.
 * @property {number} sizeBytes - Size of the written zip in bytes.
 */

/**
 * @typedef {object} RunPackageOptions
 * @property {string} projectRoot - Absolute path to the project root containing
 *   manifest.json, main.js, and optionally styles.css.
 * @property {boolean} [includeStyles] - Reserved; styles inclusion is gated on
 *   filesystem existence regardless.
 */

// AICODE-NOTE: IMPL-001 implements FR-006 -- zip filename is `${manifest.id}.zip`
/**
 * Derives the output zip filename from a plugin manifest (FR-006).
 *
 * @param {PluginManifest} manifest
 * @returns {string}
 */
export function getZipFilename(manifest) {
	if (!manifest || typeof manifest.id !== "string" || manifest.id.length === 0) {
		throw new Error("getZipFilename: manifest.id is required");
	}
	return `${manifest.id}.zip`;
}

// AICODE-NOTE: IMPL-002 implements FR-004 -- returns a fresh copy of the
// inline canonical defaults so callers cannot mutate TEMPLATE_DATA_JSON.
/**
 * Returns a deep clone of the canonical template data.json object (FR-004).
 * Must structurally equal DEFAULT_SETTINGS from src/settings.ts (drift guarded
 * by TEST-003).
 *
 * @returns {{
 *   whitelist: string[];
 *   blacklist: string[];
 *   notificationDirectory: string;
 *   showCompliantIndicator: boolean;
 * }}
 */
export function getTemplateDataJson() {
	return {
		whitelist: [...TEMPLATE_DATA_JSON.whitelist],
		blacklist: [...TEMPLATE_DATA_JSON.blacklist],
		notificationDirectory: TEMPLATE_DATA_JSON.notificationDirectory,
		showCompliantIndicator: TEMPLATE_DATA_JSON.showCompliantIndicator,
	};
}

// AICODE-NOTE: IMPL-003 + IMPL-009 implement FR-002 + FR-005 -- copy required
// entries (main.js, manifest.json), write a fresh data.json from the inline
// template, and conditionally include styles.css via an fs.existsSync gate.
// IMPL-007 (Phase 3 US2) is satisfied automatically: every entry name is a
// flat filename with no directory prefix.
/**
 * Copies REQUIRED_ENTRIES and any present OPTIONAL_ENTRIES from `projectRoot`
 * into `stagingDir`, and writes a fresh template `data.json` into `stagingDir`.
 *
 * @param {string} stagingDir
 * @param {string} projectRoot
 * @returns {Promise<PackageEntry[]>}
 */
export async function stageEntries(stagingDir, projectRoot) {
	/** @type {PackageEntry[]} */
	const entries = [];

	// Copy main.js and manifest.json from projectRoot.
	// data.json is NOT copied from projectRoot -- always generated fresh from
	// getTemplateDataJson() so the developer's working ./data.json cannot leak
	// into the distribution (research.md, TEST-004).
	for (const name of REQUIRED_ENTRIES) {
		const destPath = path.join(stagingDir, name);
		if (name === "data.json") {
			const template = getTemplateDataJson();
			await fsp.writeFile(destPath, JSON.stringify(template, null, 2), "utf8");
			entries.push({
				name,
				sourcePath: destPath,
				optional: false,
			});
			continue;
		}
		const sourcePath = path.join(projectRoot, name);
		await fsp.copyFile(sourcePath, destPath);
		entries.push({
			name,
			sourcePath,
			optional: false,
		});
	}

	// Optional entries: include iff the source file exists on disk.
	for (const name of OPTIONAL_ENTRIES) {
		const sourcePath = path.join(projectRoot, name);
		if (fs.existsSync(sourcePath)) {
			const destPath = path.join(stagingDir, name);
			await fsp.copyFile(sourcePath, destPath);
			entries.push({
				name,
				sourcePath,
				optional: true,
			});
		}
	}

	return entries;
}

// AICODE-NOTE: IMPL-004 implements FR-002 + FR-006 zip writing. Uses dynamic
// import('archiver') interop because archiver ships CJS and this module is
// .mjs (research.md). Flat layout -- each file is appended with its basename
// so extraction lands files directly in .obsidian/plugins/<id>/ (FR-002 US2).
/**
 * Writes a zip archive containing every file in `stagingDir` at a flat layout
 * (no directory prefix) to `zipPath`, resolving with the written byte size.
 *
 * @param {string} stagingDir
 * @param {string} zipPath
 * @returns {Promise<number>}
 */
export async function writeZip(stagingDir, zipPath) {
	const archiverMod = await import("archiver");
	const archiver = archiverMod.default;

	return await new Promise((resolve, reject) => {
		const output = fs.createWriteStream(zipPath);
		const archive = archiver("zip", { zlib: { level: 9 } });

		let settled = false;
		const settle = (fn) => {
			if (settled) return;
			settled = true;
			fn();
		};

		output.on("close", () => {
			settle(() => {
				try {
					const size = fs.statSync(zipPath).size;
					resolve(size);
				} catch (err) {
					reject(err);
				}
			});
		});
		output.on("error", (err) => settle(() => reject(err)));
		archive.on("error", (err) => settle(() => reject(err)));
		archive.on("warning", (err) => {
			// Non-blocking warnings (e.g., ENOENT on a stat) should still fail
			// the build rather than silently skip files.
			settle(() => reject(err));
		});

		archive.pipe(output);

		// Append every file in the staging dir with a flat name.
		const dirEntries = fs.readdirSync(stagingDir, { withFileTypes: true });
		for (const dirent of dirEntries) {
			if (!dirent.isFile()) continue;
			const filePath = path.join(stagingDir, dirent.name);
			archive.file(filePath, { name: dirent.name });
		}

		archive.finalize().catch((err) => settle(() => reject(err)));
	});
}

// AICODE-NOTE: IMPL-011 implements FR-003 cleanup -- idempotent via `force: true`.
/**
 * Removes a staging directory recursively. Idempotent -- calling on an
 * already-removed path does NOT throw (uses `force: true`).
 *
 * @param {string} stagingDir
 * @returns {Promise<void>}
 */
export async function cleanupStaging(stagingDir) {
	if (!stagingDir) return;
	await fsp.rm(stagingDir, { recursive: true, force: true });
}

// AICODE-NOTE: IMPL-005 + IMPL-012 implement FR-001..FR-006 orchestration.
// try/finally guarantees cleanupStaging runs on every exit path (success or
// failure), honoring the "exit-path cleanup" rule from ux.md / data-model.md.
// Pre-existing zip is removed BEFORE staging starts (research.md "Stale zip").
/**
 * Main entry point. Reads the project manifest, derives the zip filename,
 * removes any pre-existing zip with the target name, creates a temp staging
 * dir, stages entries, writes the zip, and cleans up on every exit path.
 *
 * @param {RunPackageOptions} opts
 * @returns {Promise<PackageResult>}
 */
export async function runPackage(opts) {
	if (!opts || typeof opts.projectRoot !== "string") {
		throw new Error("runPackage: opts.projectRoot is required");
	}
	const projectRoot = opts.projectRoot;

	// Read manifest -- drives the zip filename per FR-006.
	const manifestPath = path.join(projectRoot, "manifest.json");
	const manifestRaw = await fsp.readFile(manifestPath, "utf8");
	const manifest = JSON.parse(manifestRaw);
	const filename = getZipFilename(manifest);
	const absolutePath = path.resolve(projectRoot, filename);

	// Remove any pre-existing zip with the target filename BEFORE writing the
	// new one (research.md "Stale zip on failure"). Use rm with force so a
	// missing file is a no-op; pass recursive: false so if something unexpected
	// (like a directory) sits at the path, we fail loudly instead of nuking it.
	if (fs.existsSync(absolutePath)) {
		const stat = fs.statSync(absolutePath);
		if (stat.isFile()) {
			await fsp.rm(absolutePath, { force: true });
		}
		// If it's a directory, leave it -- writeZip's createWriteStream will
		// fail, which is the correct behavior for TEST-025.
	}

	const stagingDir = await fsp.mkdtemp(
		path.join(os.tmpdir(), STAGING_DIR_PREFIX),
	);

	try {
		await stageEntries(stagingDir, projectRoot);
		const sizeBytes = await writeZip(stagingDir, absolutePath);
		return {
			filename,
			absolutePath,
			sizeBytes,
		};
	} finally {
		await cleanupStaging(stagingDir);
	}
}
