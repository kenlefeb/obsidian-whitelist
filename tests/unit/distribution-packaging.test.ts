/**
 * AICODE-NOTE: distribution-packaging INIT-007 creates the test skeleton with
 * Vitest imports and a per-test mkdtemp helper. Real RED tests for Phases 2-7
 * arrive in subsequent TDD cycles.
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
import * as os from "node:os";
import * as path from "node:path";
import {
	getZipFilename,
	getTemplateDataJson,
	stageEntries,
	writeZip,
	cleanupStaging,
	runPackage,
	REQUIRED_ENTRIES,
	OPTIONAL_ENTRIES,
	TEMPLATE_DATA_JSON,
	EXIT_CODE_SUCCESS,
	EXIT_CODE_FAILURE,
	// @ts-expect-error -- plain .mjs module loaded via Node resolution + allowJs
} from "../../scripts/lib/package-builder.mjs";

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

afterEach(async () => {
	while (allocatedTempDirs.length > 0) {
		const dir = allocatedTempDirs.pop();
		if (dir) {
			await fs.rm(dir, { recursive: true, force: true });
		}
	}
});

// --------------------------------------------------------------------------
// Phase 1 INIT-007 import-smoke tests. Real behavioral RED tests arrive in
// Phase 2+ TDD cycles.
// --------------------------------------------------------------------------

describe("package-builder constants", () => {
	it("exports REQUIRED_ENTRIES with main.js, manifest.json, data.json", () => {
		expect(REQUIRED_ENTRIES).toContain("main.js");
		expect(REQUIRED_ENTRIES).toContain("manifest.json");
		expect(REQUIRED_ENTRIES).toContain("data.json");
	});

	it("exports OPTIONAL_ENTRIES with styles.css", () => {
		expect(OPTIONAL_ENTRIES).toContain("styles.css");
	});

	it("exports TEMPLATE_DATA_JSON with empty whitelist/blacklist defaults", () => {
		expect(TEMPLATE_DATA_JSON.whitelist).toEqual([]);
		expect(TEMPLATE_DATA_JSON.blacklist).toEqual([]);
		expect(TEMPLATE_DATA_JSON.showCompliantIndicator).toBe(false);
	});

	it("exports EXIT_CODE_SUCCESS=0 and EXIT_CODE_FAILURE=1", () => {
		expect(EXIT_CODE_SUCCESS).toBe(0);
		expect(EXIT_CODE_FAILURE).toBe(1);
	});
});

describe("package-builder helper exports", () => {
	it("exports all six helper functions as functions", () => {
		expect(typeof getZipFilename).toBe("function");
		expect(typeof getTemplateDataJson).toBe("function");
		expect(typeof stageEntries).toBe("function");
		expect(typeof writeZip).toBe("function");
		expect(typeof cleanupStaging).toBe("function");
		expect(typeof runPackage).toBe("function");
	});

	it("mkdtemp helper creates a fresh temp dir under os.tmpdir()", async () => {
		const dir = await mkdtemp();
		expect(dir).toContain("sbi-pkg-");
		expect(dir.startsWith(os.tmpdir())).toBe(true);
	});
});
