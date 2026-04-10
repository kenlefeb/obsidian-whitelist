/**
 * AICODE-NOTE: status-bar-indicator INIT-006 creates test skeleton with the
 * Obsidian mock pattern from tests/unit/compliance-modal.test.ts.
 *
 * Tests are grouped by TDD cycle from tasks.md Phases 2–7. Each cycle goes
 * RED before the matching IMPL task in src/status-bar.ts turns it GREEN.
 *
 * Note: tasks.md references `tests/status-bar.test.ts`, but the actual test
 * layout for this repo is `tests/unit/*.test.ts` (see compliance-modal.test.ts,
 * notification-file.test.ts). Following the existing convention.
 */
import { describe, it, expect } from "vitest";
import {
	computeIndicatorMode,
	renderStatusBarIndicator,
	type IndicatorMode,
	type StatusBarIndicatorState,
	INDICATOR_ICON_NON_COMPLIANT,
	INDICATOR_ICON_COMPLIANT,
	INDICATOR_LABEL_COMPLIANT,
	INDICATOR_LABEL_NON_COMPLIANT_FORMAT,
	INDICATOR_ARIA_NON_COMPLIANT_FORMAT,
	INDICATOR_ARIA_COMPLIANT,
	INDICATOR_CSS_CLASS_NON_COMPLIANT,
	INDICATOR_CSS_CLASS_COMPLIANT,
	MOBILE_TOUCH_TARGET_MIN_PX,
	MIN_CONTRAST_RATIO,
} from "../../src/status-bar.js";

// --------------------------------------------------------------------------
// Sanity: constants/types export surface (Phase 1 INIT-006 skeleton)
// Real behavioral RED tests arrive in Phase 2+ TDD cycles.
// --------------------------------------------------------------------------

describe("status-bar constants", () => {
	it("exports all documented constants", () => {
		expect(INDICATOR_ICON_NON_COMPLIANT).toBe("alert-triangle");
		expect(INDICATOR_ICON_COMPLIANT).toBe("check-circle");
		expect(INDICATOR_LABEL_COMPLIANT).toBe("Compliant");
		expect(INDICATOR_ARIA_COMPLIANT).toBe("Compliant");
		expect(INDICATOR_CSS_CLASS_NON_COMPLIANT).toBe(
			"obsidian-whitelist-status-noncompliant",
		);
		expect(INDICATOR_CSS_CLASS_COMPLIANT).toBe(
			"obsidian-whitelist-status-compliant",
		);
		expect(MOBILE_TOUCH_TARGET_MIN_PX).toBe(44);
		expect(MIN_CONTRAST_RATIO).toBe(4.5);
	});

	it("format helpers interpolate the violation count", () => {
		expect(INDICATOR_LABEL_NON_COMPLIANT_FORMAT(3)).toBe("Non-compliant (3)");
		expect(INDICATOR_ARIA_NON_COMPLIANT_FORMAT(3)).toBe(
			"Non-compliant: 3 plugin violations. Click to view.",
		);
	});
});

describe("StatusBarIndicatorState type", () => {
	it("accepts the documented shape", () => {
		const state: StatusBarIndicatorState = {
			mode: "non_compliant",
			violationCount: 1,
			visible: true,
		};
		expect(state.mode).toBe("non_compliant");
	});
});

describe("computeIndicatorMode", () => {
	it("is a function (stub returns compliant_hidden until IMPL-001)", () => {
		expect(typeof computeIndicatorMode).toBe("function");
		const mode: IndicatorMode = computeIndicatorMode(
			null,
			{
				whitelist: [],
				blacklist: [],
				notificationDirectory: ".obsidian-whitelist/notifications/",
				showCompliantIndicator: false,
			},
		);
		expect(mode).toBe("compliant_hidden");
	});
});

describe("renderStatusBarIndicator", () => {
	it("is a function (stub is a no-op until IMPL-002+)", () => {
		expect(typeof renderStatusBarIndicator).toBe("function");
	});
});
