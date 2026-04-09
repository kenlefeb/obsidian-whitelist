/**
 * AICODE-NOTE: INIT-002 creates test file with imports for compliance-notification-modal.
 * RED/GREEN phases added in Phase 2+.
 * Tests focus on exported constants and Promise-based logic;
 * Modal UI rendering is verified manually.
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
function makeViolation(
	overrides: Partial<Violation> = {},
): Violation {
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
});

describe("showComplianceModal", () => {
	it("is a function", () => {
		expect(typeof showComplianceModal).toBe("function");
	});
});

describe("ComplianceModal", () => {
	it("can be instantiated", () => {
		const app = new App();
		const modal = new ComplianceModal(app, [makeViolation()]);
		expect(modal).toBeInstanceOf(ComplianceModal);
	});
});
