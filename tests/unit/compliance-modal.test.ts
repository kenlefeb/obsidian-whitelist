/**
 * AICODE-NOTE: INIT-002 creates test file with imports for compliance-notification-modal.
 * Tests focus on exported constants and Promise-based logic;
 * Modal UI rendering is verified manually (see plan.md Testing Approach).
 */
import { describe, it, expect } from "vitest";
import {
	ComplianceModal,
	showComplianceModal,
	REASON_DISPLAY_TEXT,
	MODAL_TITLE,
	SUBMIT_BUTTON_LABEL,
	JUSTIFICATION_PLACEHOLDER,
} from "../../src/compliance-modal.js";
import type { Violation } from "../../src/compliance.js";
import { App } from "../mocks/obsidian.js";

/** Helper to build a Violation for tests */
function makeViolation(overrides: Partial<Violation> = {}): Violation {
	return {
		pluginId: "test-plugin",
		pluginName: "Test Plugin",
		reason: "not_on_whitelist",
		...overrides,
	};
}

describe("compliance-modal constants", () => {
	it("exports are defined", () => {
		expect(REASON_DISPLAY_TEXT).toBeDefined();
		expect(MODAL_TITLE).toBeDefined();
		expect(SUBMIT_BUTTON_LABEL).toBeDefined();
		expect(JUSTIFICATION_PLACEHOLDER).toBeDefined();
	});

	// AICODE-NOTE: TEST-001 tests [FR-002, UX-002] - reason text mapping
	it("REASON_DISPLAY_TEXT maps reasons to user-friendly text", () => {
		expect(REASON_DISPLAY_TEXT.not_on_whitelist).toBe("Not on approved list");
		expect(REASON_DISPLAY_TEXT.on_blacklist).toBe("On blocked list");
	});
});

describe("showComplianceModal", () => {
	it("is a function", () => {
		expect(typeof showComplianceModal).toBe("function");
	});

	// AICODE-NOTE: TEST-002 tests [FR-005] - Promise-based API
	it("returns a Promise", () => {
		const app = new App();
		const result = showComplianceModal(app, [makeViolation()]);
		expect(result).toBeInstanceOf(Promise);
	});
});

describe("ComplianceModal", () => {
	it("can be instantiated", () => {
		const app = new App();
		const modal = new ComplianceModal(app, [makeViolation()]);
		expect(modal).toBeInstanceOf(ComplianceModal);
	});
});
