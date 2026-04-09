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
});
