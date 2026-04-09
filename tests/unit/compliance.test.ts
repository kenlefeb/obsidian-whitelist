/**
 * AICODE-NOTE: Compliance scan unit tests -- INIT-002 creates file with imports.
 * RED/GREEN phases added in Phase 2+.
 * Pure function tests: pass data in, assert on output, no mocking needed.
 */
import { describe, it, expect } from "vitest";
import {
	runComplianceScan,
	type ComplianceResult,
	type Violation,
	type ViolationReason,
} from "../../src/compliance.js";
import type { WhitelistSettings } from "../../src/settings.js";

/** Helper to build settings with defaults */
function makeSettings(
	overrides: Partial<WhitelistSettings> = {},
): WhitelistSettings {
	return {
		whitelist: [],
		blacklist: [],
		notificationDirectory: ".obsidian-whitelist/notifications/",
		showCompliantIndicator: false,
		...overrides,
	};
}

/** Helper to build manifests */
function makeManifests(
	...ids: string[]
): Record<string, { id: string; name: string }> {
	const result: Record<string, { id: string; name: string }> = {};
	for (const id of ids) {
		result[id] = { id, name: `Plugin ${id}` };
	}
	return result;
}

const SELF_ID = "obsidian-whitelist";

describe("runComplianceScan", () => {
	it("should be importable and callable", () => {
		const settings = makeSettings();
		const result = runComplianceScan(settings, {}, SELF_ID);

		expect(result).toBeDefined();
		expect(result.compliant).toBe(true);
		expect(result.violations).toEqual([]);
	});

	// AICODE-NOTE: TEST-001 tests [FR-001, FR-003, FR-007] - whitelist enforcement
	describe("US1: Whitelist Enforcement", () => {
		it("TEST-001: flags plugins not on whitelist with reason 'not_on_whitelist'", () => {
			const settings = makeSettings({
				whitelist: ["pluginA", "pluginB"],
			});
			const manifests = makeManifests("pluginA", "pluginB", "pluginC");

			const result = runComplianceScan(settings, manifests, SELF_ID);

			expect(result.compliant).toBe(false);
			expect(result.violations).toHaveLength(1);
			expect(result.violations[0]).toEqual({
				pluginId: "pluginC",
				pluginName: "Plugin pluginC",
				reason: "not_on_whitelist",
			});
		});
	});

	// AICODE-NOTE: TEST-002 tests [FR-001, FR-004, FR-007] - blacklist enforcement
	describe("US2: Blacklist Enforcement", () => {
		it("TEST-002: flags plugins on blacklist with reason 'on_blacklist'", () => {
			const settings = makeSettings({
				blacklist: ["pluginX"],
			});
			const manifests = makeManifests("pluginA", "pluginX");

			const result = runComplianceScan(settings, manifests, SELF_ID);

			expect(result.compliant).toBe(false);
			expect(result.violations).toHaveLength(1);
			expect(result.violations[0]).toEqual({
				pluginId: "pluginX",
				pluginName: "Plugin pluginX",
				reason: "on_blacklist",
			});
		});
	});

	// AICODE-NOTE: TEST-003 tests [FR-005] - blacklist precedence over whitelist
	describe("US3: Blacklist Precedence", () => {
		it("TEST-003: plugin on both lists gets exactly one 'on_blacklist' violation", () => {
			const settings = makeSettings({
				whitelist: ["pluginA"],
				blacklist: ["pluginA"],
			});
			const manifests = makeManifests("pluginA");

			const result = runComplianceScan(settings, manifests, SELF_ID);

			expect(result.compliant).toBe(false);
			expect(result.violations).toHaveLength(1);
			expect(result.violations[0]).toEqual({
				pluginId: "pluginA",
				pluginName: "Plugin pluginA",
				reason: "on_blacklist",
			});
		});

		it("TEST-003b: blacklisted plugin not on whitelist gets only 'on_blacklist'", () => {
			const settings = makeSettings({
				whitelist: ["pluginA"],
				blacklist: ["pluginX"],
			});
			const manifests = makeManifests("pluginA", "pluginX");

			const result = runComplianceScan(settings, manifests, SELF_ID);

			expect(result.compliant).toBe(false);
			expect(result.violations).toHaveLength(1);
			expect(result.violations[0]).toEqual({
				pluginId: "pluginX",
				pluginName: "Plugin pluginX",
				reason: "on_blacklist",
			});
		});
	});

	// AICODE-NOTE: TEST-004 tests [FR-006, FR-007] - no enforcement when lists empty
	describe("US4: No Enforcement When Lists Empty", () => {
		it("TEST-004: empty whitelist and empty blacklist returns compliant with plugins present", () => {
			const settings = makeSettings(); // both lists empty
			const manifests = makeManifests("pluginA", "pluginB", "pluginC");

			const result = runComplianceScan(settings, manifests, SELF_ID);

			expect(result.compliant).toBe(true);
			expect(result.violations).toHaveLength(0);
		});
	});

	// AICODE-NOTE: TEST-005 tests [FR-003, FR-006] - whitelist-only enforcement
	describe("US5: Whitelist-Only Enforcement", () => {
		it("TEST-005: only whitelist enforced when blacklist empty", () => {
			const settings = makeSettings({
				whitelist: ["pluginA"],
				// blacklist empty by default
			});
			const manifests = makeManifests("pluginA", "pluginB");

			const result = runComplianceScan(settings, manifests, SELF_ID);

			expect(result.compliant).toBe(false);
			expect(result.violations).toHaveLength(1);
			expect(result.violations[0]).toEqual({
				pluginId: "pluginB",
				pluginName: "Plugin pluginB",
				reason: "not_on_whitelist",
			});
			// Verify no on_blacklist violations appear
			const blacklistViolations = result.violations.filter(
				(v) => v.reason === "on_blacklist",
			);
			expect(blacklistViolations).toHaveLength(0);
		});
	});

	// AICODE-NOTE: TEST-006 tests [FR-004, FR-006] - blacklist-only enforcement
	describe("US6: Blacklist-Only Enforcement", () => {
		it("TEST-006: only blacklist enforced when whitelist empty", () => {
			const settings = makeSettings({
				blacklist: ["pluginX"],
				// whitelist empty by default
			});
			const manifests = makeManifests("pluginA", "pluginB", "pluginX");

			const result = runComplianceScan(settings, manifests, SELF_ID);

			expect(result.compliant).toBe(false);
			// Only pluginX should be flagged; pluginA and pluginB are fine
			// because no whitelist is enforced
			expect(result.violations).toHaveLength(1);
			expect(result.violations[0]).toEqual({
				pluginId: "pluginX",
				pluginName: "Plugin pluginX",
				reason: "on_blacklist",
			});
			// Verify no not_on_whitelist violations appear
			const whitelistViolations = result.violations.filter(
				(v) => v.reason === "not_on_whitelist",
			);
			expect(whitelistViolations).toHaveLength(0);
		});
	});

	// AICODE-NOTE: TEST-007 tests [FR-007] - empty manifests returns compliant
	describe("US7: No Plugins Installed", () => {
		it("TEST-007: empty manifests returns compliant with no violations", () => {
			const settings = makeSettings({
				whitelist: ["pluginA"],
				blacklist: ["pluginX"],
			});
			const manifests = {}; // No plugins installed

			const result = runComplianceScan(settings, manifests, SELF_ID);

			expect(result.compliant).toBe(true);
			expect(result.violations).toHaveLength(0);
		});
	});

	// AICODE-NOTE: TEST-008 tests [FR-001] - self-exclusion
	describe("Edge Cases", () => {
		it("TEST-008: whitelist plugin itself is excluded from compliance checking", () => {
			const settings = makeSettings({
				whitelist: ["pluginA"],
			});
			// Include self in manifests -- should be excluded from checking
			const manifests = makeManifests("pluginA", SELF_ID);

			const result = runComplianceScan(settings, manifests, SELF_ID);

			// Self should NOT appear as violation even though it's not on whitelist
			expect(result.compliant).toBe(true);
			expect(result.violations).toHaveLength(0);
		});

		// AICODE-NOTE: TEST-009 tests [FR-002] - installed-but-disabled checked
		it("TEST-009: installed-but-disabled plugins are checked against lists", () => {
			// The function receives manifests (all installed), not enabledPlugins
			// This test verifies the function checks ALL manifests passed to it
			const settings = makeSettings({
				whitelist: ["pluginA"],
			});
			// pluginB represents an installed-but-disabled plugin
			// It appears in manifests because manifests = all installed
			const manifests = makeManifests("pluginA", "pluginB");

			const result = runComplianceScan(settings, manifests, SELF_ID);

			expect(result.compliant).toBe(false);
			expect(result.violations).toHaveLength(1);
			expect(result.violations[0].pluginId).toBe("pluginB");
		});

		// AICODE-NOTE: TEST-010 tests [FR-008] - callable with WhitelistSettings, returns ComplianceResult
		it("TEST-010: callable with WhitelistSettings and returns valid ComplianceResult", () => {
			const settings: WhitelistSettings = {
				whitelist: ["pluginA"],
				blacklist: ["pluginX"],
				notificationDirectory: ".obsidian-whitelist/notifications/",
				showCompliantIndicator: true,
			};
			const manifests = makeManifests("pluginA", "pluginB", "pluginX");

			const result: ComplianceResult = runComplianceScan(
				settings,
				manifests,
				SELF_ID,
			);

			// Verify return type shape
			expect(typeof result.compliant).toBe("boolean");
			expect(Array.isArray(result.violations)).toBe(true);
			// Verify violations have correct shape
			for (const v of result.violations) {
				expect(typeof v.pluginId).toBe("string");
				expect(typeof v.pluginName).toBe("string");
				expect(["not_on_whitelist", "on_blacklist"]).toContain(v.reason);
			}
			// Verify actual results: pluginX on_blacklist, pluginB not_on_whitelist
			expect(result.compliant).toBe(false);
			expect(result.violations).toHaveLength(2);
		});
	});
});
