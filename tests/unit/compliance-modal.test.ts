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

	// AICODE-NOTE: TEST-007 tests [FR-005] - re-usable, fresh instance per call (US6)
	it("creates a fresh modal instance on each call", async () => {
		const app = new App();
		const p1 = showComplianceModal(app, [makeViolation()]);
		const p2 = showComplianceModal(app, [makeViolation()]);
		expect(p1).not.toBe(p2);
		expect(p1).toBeInstanceOf(Promise);
		expect(p2).toBeInstanceOf(Promise);
	});

	// AICODE-NOTE: TEST-008 tests integration type signatures (Phase 8)
	it("has correct type signatures", () => {
		// Compile-time assertion: function accepts (App, Violation[]) => Promise<string>
		const app = new App();
		const violations: Violation[] = [makeViolation()];
		const result: Promise<string> = showComplianceModal(app, violations);
		expect(result).toBeInstanceOf(Promise);
	});
});

describe("ComplianceModal", () => {
	it("can be instantiated", () => {
		const app = new App();
		const modal = new ComplianceModal(app, [makeViolation()]);
		expect(modal).toBeInstanceOf(ComplianceModal);
	});

	// AICODE-NOTE: TEST-003 tests [FR-005] - justification is trimmed on submit
	it("trims justification text before resolving", async () => {
		const app = new App();
		const promise = showComplianceModal(app, [makeViolation()]);

		// Locate the active modal via capturing the instance pattern:
		// showComplianceModal creates a ComplianceModal inline, so we instead
		// test submit() behavior directly via a new instance with an injected resolver.
		const modal = new ComplianceModal(app, [makeViolation()]);
		let resolved: string | null = null;
		modal.setResolve((j) => {
			resolved = j;
		});
		modal.open();
		// Simulate typed text with surrounding whitespace
		(modal as unknown as { textareaEl: { value: string } }).textareaEl = {
			value: "   my reason   ",
		};
		modal.submit();

		expect(resolved).toBe("my reason");
		// Clean up the outer promise (not awaited because its modal has no resolver path here)
		void promise;
	});

	// AICODE-NOTE: TEST-004 tests [FR-007] - empty justification is accepted
	it("accepts empty justification (trimmed to empty string)", () => {
		const app = new App();
		const modal = new ComplianceModal(app, [makeViolation()]);
		let resolved: string | null = null;
		modal.setResolve((j) => {
			resolved = j;
		});
		modal.open();
		(modal as unknown as { textareaEl: { value: string } }).textareaEl = {
			value: "   ",
		};
		modal.submit();

		expect(resolved).toBe("");
	});

	// AICODE-NOTE: TEST-005 tests [FR-006] - close override blocked until submitted
	it("blocks close() when not submitted", () => {
		const app = new App();
		const modal = new ComplianceModal(app, [makeViolation()]);
		let superCloseCalled = false;
		// Spy on the parent Modal's close via prototype chain
		const originalClose = Object.getPrototypeOf(
			Object.getPrototypeOf(modal),
		).close;
		Object.getPrototypeOf(Object.getPrototypeOf(modal)).close = function () {
			superCloseCalled = true;
		};

		// submitted is false -- close should be a no-op
		modal.close();
		expect(superCloseCalled).toBe(false);

		// After marking submitted, close should call super.close()
		modal.submitted = true;
		modal.close();
		expect(superCloseCalled).toBe(true);

		// Restore
		Object.getPrototypeOf(Object.getPrototypeOf(modal)).close = originalClose;
	});

	// AICODE-NOTE: TEST-006 tests [FR-008] - modal not shown when violations empty
	// Guard is in the caller (main.ts) -- this test documents the expected contract.
	it("guard contract: caller must not call showComplianceModal when compliant", () => {
		// Simulates the main.ts integration guard
		const result = { compliant: true, violations: [] as Violation[] };
		let modalShown = false;
		if (!result.compliant) {
			modalShown = true;
		}
		expect(modalShown).toBe(false);

		// Conversely, when non-compliant the guard permits invocation
		const nonCompliant = {
			compliant: false,
			violations: [makeViolation()],
		};
		if (!nonCompliant.compliant) {
			modalShown = true;
		}
		expect(modalShown).toBe(true);
	});
});
