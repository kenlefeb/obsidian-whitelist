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

describe("runComplianceScan", () => {
	it("should be importable and callable", () => {
		const settings: WhitelistSettings = {
			whitelist: [],
			blacklist: [],
			notificationDirectory: ".obsidian-whitelist/notifications/",
			showCompliantIndicator: false,
		};
		const result = runComplianceScan(settings, {}, "obsidian-whitelist");

		expect(result).toBeDefined();
		expect(result.compliant).toBe(true);
		expect(result.violations).toEqual([]);
	});
});
