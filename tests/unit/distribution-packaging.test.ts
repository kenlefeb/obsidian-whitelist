/**
 * AICODE-NOTE: distribution-packaging TEST-001..TEST-027 cover Phases 2-7 of
 * tasks.md. Each test RED-fires before the matching IMPL-### in
 * scripts/lib/package-builder.mjs turns it GREEN.
 *
 * Conventions:
 * - Every test that touches the filesystem uses the per-test `mkdtemp` helper
 *   which creates a fresh directory under `os.tmpdir()` with the `sbi-pkg-`
 *   prefix. Matching the feature folder prefix makes stray temp dirs easy to
 *   find during debugging.
 * - `afterEach` removes every temp dir this file allocated so tests stay
 *   isolated (CLAUDE.md "Tests must be isolated").
 * - No subprocess spawning. Functions are imported directly from
 *   `scripts/lib/package-builder.mjs` and exercised against temp fixtures.
 * - `scripts/lib/package-builder.mjs` is a plain ESM module outside the
 *   tsconfig `include` glob. Vitest loads it directly; TS sees it via
 *   Node module resolution with `allowJs` from tsconfig.json.
 */
import { afterEach, describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as fssync from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
	getZipFilename,
	getTemplateDataJson,
	stageEntries,
	writeZip,
	cleanupStaging,
	runPackage,
	ZIP_FILENAME_FORMAT,
	REQUIRED_ENTRIES,
	OPTIONAL_ENTRIES,
	TEMPLATE_DATA_JSON,
	EXIT_CODE_SUCCESS,
	EXIT_CODE_FAILURE,
	SUCCESS_MESSAGE_FORMAT,
	TS_FAILURE_MESSAGE,
	FS_FAILURE_MESSAGE_FORMAT,
	// @ts-expect-error -- plain .mjs module loaded via Node resolution + allowJs
} from "../../scripts/lib/package-builder.mjs";
import { DEFAULT_SETTINGS, mergeSettings } from "../../src/settings.ts";

// AICODE-NOTE: Track every temp dir allocated during a test so afterEach can
// remove them even if the test throws before its own cleanup runs.
const allocatedTempDirs: string[] = [];

/**
 * Creates a fresh temp directory for a single test. Prefix `sbi-pkg-` matches
 * the distribution-packaging feature so ad-hoc debugging searches find them.
 */
async function mkdtemp(): Promise<string> {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sbi-pkg-"));
	allocatedTempDirs.push(dir);
	return dir;
}

/**
 * Builds a fake project root with stub manifest.json and main.js. Optionally
 * writes a styles.css file when `withStyles` is true.
 */
async function makeFakeProjectRoot(opts: {
	manifestId?: string;
	withStyles?: boolean;
	mainJsContent?: string;
	stylesContent?: string;
} = {}): Promise<string> {
	const root = await mkdtemp();
	const manifestId = opts.manifestId ?? "obsidian-whitelist";
	await fs.writeFile(
		path.join(root, "manifest.json"),
		JSON.stringify({
			id: manifestId,
			name: "Plugin Whitelist",
			version: "1.0.0",
			minAppVersion: "0.15.0",
			description: "test",
			author: "test",
			isDesktopOnly: false,
		}),
	);
	await fs.writeFile(
		path.join(root, "main.js"),
		opts.mainJsContent ?? "module.exports = { default: {} };\n",
	);
	if (opts.withStyles) {
		await fs.writeFile(
			path.join(root, "styles.css"),
			opts.stylesContent ?? ".sbi-test { color: red; }\n",
		);
	}
	return root;
}

afterEach(async () => {
	while (allocatedTempDirs.length > 0) {
		const dir = allocatedTempDirs.pop();
		if (!dir) continue;
		await fs.rm(dir, { recursive: true, force: true });
	}
});

// ---------------------------------------------------------------------------
// Zip parsing helpers
//
// AICODE-NOTE: Minimal zip reader written against the PKWARE APPNOTE spec so
// tests don't need a new devDependency. Parses the End-of-Central-Directory
// record at the tail of the file, walks the Central Directory, and resolves
// each entry's compressed size / offset there. This is REQUIRED because
// archiver uses data descriptors -- the Local File Header writes compSize=0
// and the real size shows up in the Central Directory. A naive LFH-based
// parser (like an earlier draft here) breaks on those data-descriptor entries.
//
// Supported compression methods: 0 (stored), 8 (deflate). That's what
// archiver@7 produces for us.
// ---------------------------------------------------------------------------

interface ZipEntry {
	name: string;
	compressedSize: number;
	uncompressedSize: number;
	localHeaderOffset: number;
	method: number;
}

async function parseCentralDirectory(zipPath: string): Promise<ZipEntry[]> {
	const buf = await fs.readFile(zipPath);
	const EOCD_SIG = 0x06054b50;
	const CD_SIG = 0x02014b50;

	// Find EOCD by scanning backwards (comment up to 65535 bytes allowed).
	let eocdOffset = -1;
	const maxScan = Math.min(buf.length, 65557);
	for (let i = buf.length - 22; i >= buf.length - maxScan && i >= 0; i--) {
		if (buf.readUInt32LE(i) === EOCD_SIG) {
			eocdOffset = i;
			break;
		}
	}
	if (eocdOffset < 0) throw new Error("EOCD not found");

	const cdEntries = buf.readUInt16LE(eocdOffset + 10);
	const cdOffset = buf.readUInt32LE(eocdOffset + 16);

	const entries: ZipEntry[] = [];
	let cursor = cdOffset;
	for (let i = 0; i < cdEntries; i++) {
		if (buf.readUInt32LE(cursor) !== CD_SIG) {
			throw new Error(`bad CD signature at offset ${cursor}`);
		}
		const method = buf.readUInt16LE(cursor + 10);
		const compressedSize = buf.readUInt32LE(cursor + 20);
		const uncompressedSize = buf.readUInt32LE(cursor + 24);
		const nameLen = buf.readUInt16LE(cursor + 28);
		const extraLen = buf.readUInt16LE(cursor + 30);
		const commentLen = buf.readUInt16LE(cursor + 32);
		const localHeaderOffset = buf.readUInt32LE(cursor + 42);
		const name = buf.toString("utf8", cursor + 46, cursor + 46 + nameLen);
		entries.push({
			name,
			compressedSize,
			uncompressedSize,
			localHeaderOffset,
			method,
		});
		cursor += 46 + nameLen + extraLen + commentLen;
	}
	return entries;
}

async function listZipEntries(zipPath: string): Promise<string[]> {
	const entries = await parseCentralDirectory(zipPath);
	return entries.map((e) => e.name);
}

async function readZipEntryBytes(
	zipPath: string,
	entryName: string,
): Promise<Buffer> {
	const buf = await fs.readFile(zipPath);
	const entries = await parseCentralDirectory(zipPath);
	const entry = entries.find((e) => e.name === entryName);
	if (!entry) throw new Error(`entry ${entryName} not found in zip`);

	// Read the Local File Header to compute where the actual data starts --
	// LFH's nameLen + extraLen may differ from the CD copies, per spec.
	const lfhOffset = entry.localHeaderOffset;
	const LFH_SIG = 0x04034b50;
	if (buf.readUInt32LE(lfhOffset) !== LFH_SIG) {
		throw new Error(`bad LFH signature at offset ${lfhOffset}`);
	}
	const lfhNameLen = buf.readUInt16LE(lfhOffset + 26);
	const lfhExtraLen = buf.readUInt16LE(lfhOffset + 28);
	const dataStart = lfhOffset + 30 + lfhNameLen + lfhExtraLen;

	const compressed = buf.subarray(
		dataStart,
		dataStart + entry.compressedSize,
	);

	if (entry.method === 0) {
		return Buffer.from(compressed);
	}
	if (entry.method === 8) {
		const zlib = await import("node:zlib");
		return zlib.inflateRawSync(compressed);
	}
	throw new Error(`unsupported compression method ${entry.method}`);
}

// ---------------------------------------------------------------------------
// Import-smoke tests -- sanity checks that module-level exports resolve.
// ---------------------------------------------------------------------------

describe("distribution-packaging: module exports", () => {
	it("exports all required helper functions", () => {
		expect(typeof getZipFilename).toBe("function");
		expect(typeof getTemplateDataJson).toBe("function");
		expect(typeof stageEntries).toBe("function");
		expect(typeof writeZip).toBe("function");
		expect(typeof cleanupStaging).toBe("function");
		expect(typeof runPackage).toBe("function");
	});

	it("exports all data-model constants", () => {
		expect(typeof ZIP_FILENAME_FORMAT).toBe("string");
		expect(Array.isArray(REQUIRED_ENTRIES)).toBe(true);
		expect(REQUIRED_ENTRIES).toEqual(["main.js", "manifest.json", "data.json"]);
		expect(Array.isArray(OPTIONAL_ENTRIES)).toBe(true);
		expect(OPTIONAL_ENTRIES).toEqual(["styles.css"]);
		expect(typeof TEMPLATE_DATA_JSON).toBe("object");
		expect(EXIT_CODE_SUCCESS).toBe(0);
		expect(EXIT_CODE_FAILURE).toBe(1);
		expect(typeof SUCCESS_MESSAGE_FORMAT).toBe("string");
		expect(typeof TS_FAILURE_MESSAGE).toBe("string");
		expect(typeof FS_FAILURE_MESSAGE_FORMAT).toBe("string");
	});
});

describe("distribution-packaging: mkdtemp helper", () => {
	it("allocates a writable temp directory under os.tmpdir()", async () => {
		const dir = await mkdtemp();
		expect(dir.startsWith(os.tmpdir())).toBe(true);
		// Sanity: the directory actually exists and is writable.
		await fs.writeFile(path.join(dir, "probe.txt"), "ok");
		const contents = await fs.readFile(path.join(dir, "probe.txt"), "utf8");
		expect(contents).toBe("ok");
	});

	it("allocates distinct directories on successive calls", async () => {
		const a = await mkdtemp();
		const b = await mkdtemp();
		expect(a).not.toBe(b);
	});
});

// ---------------------------------------------------------------------------
// TDD Cycle 1: Filename Derivation + Template Generation (TEST-001..TEST-004)
// ---------------------------------------------------------------------------

describe("TDD Cycle 1: getZipFilename + getTemplateDataJson", () => {
	it("TEST-001 [US1]: getZipFilename({ id: 'obsidian-whitelist' }) returns 'obsidian-whitelist.zip' (FR-006)", () => {
		expect(getZipFilename({ id: "obsidian-whitelist" })).toBe(
			"obsidian-whitelist.zip",
		);
	});

	it("TEST-002 [US1]: getZipFilename derives filename from manifest.id, not hardcoded", () => {
		expect(getZipFilename({ id: "some-other-plugin" })).toBe(
			"some-other-plugin.zip",
		);
		expect(getZipFilename({ id: "my-plugin-2" })).toBe("my-plugin-2.zip");
	});

	it("TEST-003 [US1]: getTemplateDataJson() structurally equals DEFAULT_SETTINGS (drift guard, FR-004)", () => {
		const template = getTemplateDataJson();
		expect(template).toEqual(DEFAULT_SETTINGS);
	});

	it("TEST-004 [US1]: getTemplateDataJson() does NOT include developer's working data.json values (leak guard)", () => {
		const template = getTemplateDataJson();
		expect(template.whitelist).toEqual([]);
		expect(template.blacklist).toEqual([]);
		expect(template.showCompliantIndicator).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// TDD Cycle 2: Staging Required Entries (TEST-005..TEST-008)
// ---------------------------------------------------------------------------

describe("TDD Cycle 2: stageEntries -- required entries", () => {
	it("TEST-005 [US1]: stageEntries copies main.js from projectRoot to stagingDir/main.js", async () => {
		const projectRoot = await makeFakeProjectRoot({
			mainJsContent: "// fake main\n",
		});
		const stagingDir = await mkdtemp();
		await stageEntries(stagingDir, projectRoot);
		const copied = await fs.readFile(
			path.join(stagingDir, "main.js"),
			"utf8",
		);
		expect(copied).toBe("// fake main\n");
	});

	it("TEST-006 [US1]: stageEntries copies manifest.json from projectRoot to stagingDir/manifest.json", async () => {
		const projectRoot = await makeFakeProjectRoot({ manifestId: "sbi-cycle-2" });
		const stagingDir = await mkdtemp();
		await stageEntries(stagingDir, projectRoot);
		const copied = JSON.parse(
			await fs.readFile(path.join(stagingDir, "manifest.json"), "utf8"),
		);
		expect(copied.id).toBe("sbi-cycle-2");
	});

	it("TEST-007 [US1]: stageEntries writes a data.json whose parsed contents equal getTemplateDataJson() (FR-004)", async () => {
		const projectRoot = await makeFakeProjectRoot();
		const stagingDir = await mkdtemp();
		await stageEntries(stagingDir, projectRoot);
		const bundledDataJson = JSON.parse(
			await fs.readFile(path.join(stagingDir, "data.json"), "utf8"),
		);
		expect(bundledDataJson).toEqual(getTemplateDataJson());
	});

	it("TEST-008 [US1]: stageEntries returns a PackageEntry[] containing all REQUIRED_ENTRIES", async () => {
		const projectRoot = await makeFakeProjectRoot();
		const stagingDir = await mkdtemp();
		const entries = await stageEntries(stagingDir, projectRoot);
		expect(Array.isArray(entries)).toBe(true);
		const names = entries.map((e: { name: string }) => e.name);
		for (const required of REQUIRED_ENTRIES) {
			expect(names).toContain(required);
		}
	});
});

// ---------------------------------------------------------------------------
// TDD Cycle 3: Zip Production + Pre-existing Cleanup (TEST-009..TEST-013)
// ---------------------------------------------------------------------------

describe("TDD Cycle 3: writeZip + runPackage lifecycle", () => {
	it("TEST-009 [US1]: writeZip produces a non-empty zip file and returns byte size", async () => {
		const projectRoot = await makeFakeProjectRoot();
		const stagingDir = await mkdtemp();
		await stageEntries(stagingDir, projectRoot);
		const outDir = await mkdtemp();
		const zipPath = path.join(outDir, "test.zip");
		const size = await writeZip(stagingDir, zipPath);
		expect(typeof size).toBe("number");
		expect(size).toBeGreaterThan(0);
		const stat = await fs.stat(zipPath);
		expect(stat.size).toBeGreaterThan(0);
		expect(stat.size).toBe(size);
	});

	it("TEST-010 [US1]: produced zip contains all REQUIRED_ENTRIES", async () => {
		const projectRoot = await makeFakeProjectRoot();
		const stagingDir = await mkdtemp();
		await stageEntries(stagingDir, projectRoot);
		const outDir = await mkdtemp();
		const zipPath = path.join(outDir, "test.zip");
		await writeZip(stagingDir, zipPath);
		const entries = await listZipEntries(zipPath);
		for (const required of REQUIRED_ENTRIES) {
			expect(entries).toContain(required);
		}
	});

	it("TEST-011 [US1]: runPackage removes a pre-existing zip with the target filename before writing", async () => {
		const projectRoot = await makeFakeProjectRoot();
		// Pre-create a stale zip with known marker bytes.
		const stalePath = path.join(projectRoot, "obsidian-whitelist.zip");
		await fs.writeFile(stalePath, "STALE-CONTENT-NOT-A-VALID-ZIP");
		const stalePreSize = (await fs.stat(stalePath)).size;
		const result = await runPackage({ projectRoot });
		// The new zip replaced the stale one -- size differs, and the file is
		// a valid zip this time (contains REQUIRED_ENTRIES).
		const newSize = (await fs.stat(result.absolutePath)).size;
		expect(newSize).not.toBe(stalePreSize);
		const entries = await listZipEntries(result.absolutePath);
		for (const required of REQUIRED_ENTRIES) {
			expect(entries).toContain(required);
		}
	});

	it("TEST-012 [US1]: runPackage returns { filename, absolutePath, sizeBytes } shape on success", async () => {
		const projectRoot = await makeFakeProjectRoot();
		const result = await runPackage({ projectRoot });
		expect(typeof result.filename).toBe("string");
		expect(result.filename).toBe("obsidian-whitelist.zip");
		expect(typeof result.absolutePath).toBe("string");
		expect(path.isAbsolute(result.absolutePath)).toBe(true);
		expect(result.absolutePath.endsWith("obsidian-whitelist.zip")).toBe(true);
		expect(typeof result.sizeBytes).toBe("number");
		expect(result.sizeBytes).toBeGreaterThan(0);
	});

	it("TEST-013 [US1]: runPackage cleans up the temp staging directory on success", async () => {
		const projectRoot = await makeFakeProjectRoot();
		// Capture temp dirs before / after runPackage so we can assert no
		// sbi-pkg-build- directories survive. runPackage creates its own
		// staging dir under os.tmpdir() with the `sbi-pkg-build-` prefix;
		// no such dir may remain after the call.
		const beforeEntries = new Set(await fs.readdir(os.tmpdir()));
		await runPackage({ projectRoot });
		const afterEntries = await fs.readdir(os.tmpdir());
		const newDirs = afterEntries.filter((e) => !beforeEntries.has(e));
		for (const dir of newDirs) {
			expect(dir.startsWith("sbi-pkg-build-")).toBe(false);
		}
	});
});

// ---------------------------------------------------------------------------
// TDD Cycle 4: Zip Layout Compatibility (TEST-014..TEST-016)
// ---------------------------------------------------------------------------

describe("TDD Cycle 4: Zip layout compatibility for Obsidian", () => {
	it("TEST-014 [US2]: zip uses a flat layout -- no directory prefix in any entry name", async () => {
		const projectRoot = await makeFakeProjectRoot({ withStyles: true });
		const result = await runPackage({ projectRoot });
		const entries = await listZipEntries(result.absolutePath);
		expect(entries.length).toBeGreaterThan(0);
		for (const name of entries) {
			expect(name).not.toContain("/");
			expect(name).not.toContain("\\");
		}
	});

	it("TEST-015 [US2]: bundled manifest.json is parseable JSON with a matching id field", async () => {
		const projectRoot = await makeFakeProjectRoot({
			manifestId: "layout-test-plugin",
		});
		const result = await runPackage({ projectRoot });
		const manifestBytes = await readZipEntryBytes(
			result.absolutePath,
			"manifest.json",
		);
		const manifest = JSON.parse(manifestBytes.toString("utf8"));
		expect(manifest.id).toBe("layout-test-plugin");
	});

	it("TEST-016 [US2]: bundled main.js is non-empty", async () => {
		const projectRoot = await makeFakeProjectRoot({
			mainJsContent: "module.exports = { default: function () {} };\n",
		});
		const result = await runPackage({ projectRoot });
		const mainBytes = await readZipEntryBytes(result.absolutePath, "main.js");
		expect(mainBytes.length).toBeGreaterThan(0);
		expect(mainBytes.toString("utf8")).toContain("module.exports");
	});
});

// ---------------------------------------------------------------------------
// TDD Cycle 5: Template Round-Trip Compatibility (TEST-017..TEST-018)
// ---------------------------------------------------------------------------

describe("TDD Cycle 5: Template data.json round-trip via mergeSettings", () => {
	it("TEST-017 [US3]: bundled data.json round-trips through JSON.parse -> mergeSettings unchanged", async () => {
		const projectRoot = await makeFakeProjectRoot();
		const result = await runPackage({ projectRoot });
		const dataBytes = await readZipEntryBytes(result.absolutePath, "data.json");
		const parsed = JSON.parse(dataBytes.toString("utf8"));
		const merged = mergeSettings(parsed);
		expect(merged).toEqual(DEFAULT_SETTINGS);
	});

	it("TEST-018 [US3]: mutated template data.json round-trips through mergeSettings with exact whitelist/blacklist values", () => {
		const customized = {
			whitelist: ["plugin-a", "plugin-b"],
			blacklist: ["plugin-c"],
			notificationDirectory: ".obsidian-whitelist/notifications/",
			showCompliantIndicator: false,
		};
		const serialized = JSON.stringify(customized);
		const reparsed = JSON.parse(serialized);
		const merged = mergeSettings(reparsed);
		expect(merged.whitelist).toEqual(["plugin-a", "plugin-b"]);
		expect(merged.blacklist).toEqual(["plugin-c"]);
	});
});

// ---------------------------------------------------------------------------
// TDD Cycle 6: Optional styles.css inclusion (TEST-019..TEST-020)
// ---------------------------------------------------------------------------

describe("TDD Cycle 6: Optional styles.css inclusion", () => {
	it("TEST-019 [US4]: stageEntries includes styles.css in staging dir AND PackageEntry[] when present", async () => {
		const projectRoot = await makeFakeProjectRoot({
			withStyles: true,
			stylesContent: ".test { color: blue; }\n",
		});
		const stagingDir = await mkdtemp();
		const entries = await stageEntries(stagingDir, projectRoot);
		const stagedCss = await fs.readFile(
			path.join(stagingDir, "styles.css"),
			"utf8",
		);
		expect(stagedCss).toBe(".test { color: blue; }\n");
		const names = entries.map((e: { name: string }) => e.name);
		expect(names).toContain("styles.css");
	});

	it("TEST-020 [US4]: produced zip contains styles.css when source file is present", async () => {
		const projectRoot = await makeFakeProjectRoot({ withStyles: true });
		const result = await runPackage({ projectRoot });
		const entries = await listZipEntries(result.absolutePath);
		expect(entries).toContain("styles.css");
	});
});

// ---------------------------------------------------------------------------
// TDD Cycle 7: Optional styles.css absence (TEST-021..TEST-023)
// ---------------------------------------------------------------------------

describe("TDD Cycle 7: Optional styles.css absence", () => {
	it("TEST-021 [US5]: stageEntries does NOT include styles.css and does NOT throw when absent", async () => {
		const projectRoot = await makeFakeProjectRoot({ withStyles: false });
		const stagingDir = await mkdtemp();
		const entries = await stageEntries(stagingDir, projectRoot);
		const names = entries.map((e: { name: string }) => e.name);
		expect(names).not.toContain("styles.css");
		// Confirm no styles.css landed in staging dir.
		const stagedExists = fssync.existsSync(path.join(stagingDir, "styles.css"));
		expect(stagedExists).toBe(false);
	});

	it("TEST-022 [US5]: produced zip omits styles.css when absent but still contains all REQUIRED_ENTRIES", async () => {
		const projectRoot = await makeFakeProjectRoot({ withStyles: false });
		const result = await runPackage({ projectRoot });
		const entries = await listZipEntries(result.absolutePath);
		expect(entries).not.toContain("styles.css");
		for (const required of REQUIRED_ENTRIES) {
			expect(entries).toContain(required);
		}
	});

	it("TEST-023 [US5]: runPackage returns success (no throw) when styles.css is absent", async () => {
		const projectRoot = await makeFakeProjectRoot({ withStyles: false });
		await expect(runPackage({ projectRoot })).resolves.toMatchObject({
			filename: "obsidian-whitelist.zip",
		});
	});
});

// ---------------------------------------------------------------------------
// TDD Cycle 8: Failure modes + cleanup (TEST-024..TEST-027)
// ---------------------------------------------------------------------------

describe("TDD Cycle 8: Failure modes + cleanup", () => {
	it("TEST-024 [US1]: runPackage throws and removes staging dir when projectRoot/main.js is missing", async () => {
		const projectRoot = await mkdtemp();
		// Write manifest but no main.js
		await fs.writeFile(
			path.join(projectRoot, "manifest.json"),
			JSON.stringify({ id: "missing-main-plugin" }),
		);
		const before = new Set(await fs.readdir(os.tmpdir()));
		await expect(runPackage({ projectRoot })).rejects.toThrow();
		const after = await fs.readdir(os.tmpdir());
		const newDirs = after.filter((e) => !before.has(e));
		for (const dir of newDirs) {
			expect(dir.startsWith("sbi-pkg-build-")).toBe(false);
		}
	});

	it("TEST-025 [US1]: runPackage throws and removes staging dir when target zip path is not writable", async () => {
		const projectRoot = await makeFakeProjectRoot();
		// Pre-create a DIRECTORY at the target zip path so createWriteStream fails.
		const targetZip = path.join(projectRoot, "obsidian-whitelist.zip");
		await fs.mkdir(targetZip, { recursive: true });
		// Put a child file inside to make the directory "non-empty".
		await fs.writeFile(path.join(targetZip, "sentinel"), "x");
		const before = new Set(await fs.readdir(os.tmpdir()));
		await expect(runPackage({ projectRoot })).rejects.toThrow();
		const after = await fs.readdir(os.tmpdir());
		const newDirs = after.filter((e) => !before.has(e));
		for (const dir of newDirs) {
			expect(dir.startsWith("sbi-pkg-build-")).toBe(false);
		}
	});

	it("TEST-026 [US1]: cleanupStaging is idempotent -- calling on already-removed directory does NOT throw", async () => {
		const dir = await mkdtemp();
		await cleanupStaging(dir);
		// Second call on the now-removed directory should not throw.
		await expect(cleanupStaging(dir)).resolves.toBeUndefined();
		// Also calling on a never-existed path should not throw.
		await expect(
			cleanupStaging(path.join(os.tmpdir(), "sbi-pkg-does-not-exist-xyzzy")),
		).resolves.toBeUndefined();
	});

	it("TEST-027 [US1]: package.json#scripts.package chains tsc, esbuild, and node scripts/package.mjs with && (FR-003)", async () => {
		// Resolve project root from this test file's location.
		const here = fileURLToPath(import.meta.url);
		const projectRoot = path.resolve(path.dirname(here), "..", "..");
		const pkgJson = JSON.parse(
			await fs.readFile(path.join(projectRoot, "package.json"), "utf8"),
		);
		const packageScript = pkgJson.scripts?.package;
		expect(typeof packageScript).toBe("string");
		expect(packageScript).toContain("tsc");
		expect(packageScript).toContain("esbuild.config.mjs");
		expect(packageScript).toContain("node scripts/package.mjs");
		// The && chain guarantees TS failure aborts before packaging runs.
		expect(packageScript).toContain("&&");
		// Specifically: tsc must precede esbuild which must precede package.mjs.
		const tscIdx = packageScript.indexOf("tsc");
		const esbuildIdx = packageScript.indexOf("esbuild.config.mjs");
		const packageIdx = packageScript.indexOf("scripts/package.mjs");
		expect(tscIdx).toBeGreaterThanOrEqual(0);
		expect(esbuildIdx).toBeGreaterThan(tscIdx);
		expect(packageIdx).toBeGreaterThan(esbuildIdx);
	});
});
