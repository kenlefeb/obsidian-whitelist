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
import { describe, it, expect, beforeEach, vi } from "vitest";
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
import type { ComplianceResult, Violation } from "../../src/compliance.js";
import type { WhitelistSettings } from "../../src/settings.js";
import { DEFAULT_SETTINGS } from "../../src/settings.js";
import {
	App,
	asStatusBarMock,
	createStatusBarMockElement,
	resetSetIcon,
	setIconCalls,
	type MockStatusBarElement,
} from "../mocks/obsidian.js";

// AICODE-NOTE: status-bar-indicator - vi.mock the click-path collaborators so the
// click handler tests (TDD Cycle 5) can resolve showComplianceModal on demand and
// assert writeComplianceNotification is invoked after. The default factory returns
// an immediately-resolving stub so cycles 2–4 (render branches) stay unaffected.
vi.mock("../../src/compliance-modal.js", () => ({
	showComplianceModal: vi.fn(async () => ""),
}));
vi.mock("../../src/notification-file.js", () => ({
	writeComplianceNotification: vi.fn(async () => {}),
}));

import { showComplianceModal } from "../../src/compliance-modal.js";
import { writeComplianceNotification } from "../../src/notification-file.js";

/** Helper to build a Violation for tests. */
export function makeViolation(
	overrides: Partial<Violation> = {},
): Violation {
	return {
		pluginId: "test-plugin",
		pluginName: "Test Plugin",
		reason: "not_on_whitelist",
		...overrides,
	};
}

/** Helper to build a ComplianceResult for tests. */
export function makeResult(
	overrides: Partial<ComplianceResult> = {},
): ComplianceResult {
	return {
		compliant: true,
		violations: [],
		...overrides,
	};
}

/** Helper to build a WhitelistSettings for tests. */
export function makeSettings(
	overrides: Partial<WhitelistSettings> = {},
): WhitelistSettings {
	return {
		...DEFAULT_SETTINGS,
		...overrides,
	};
}

// --------------------------------------------------------------------------
// Plugin harness — minimal WhitelistPlugin-shaped object the renderer needs.
// We do NOT instantiate the real plugin (it extends Obsidian's Plugin class
// and hooks onload); the renderer only touches a handful of fields, which
// this harness exposes via a simple object. `renderStatusBarIndicator` is
// typed `(plugin: WhitelistPlugin)` but structural typing in TS lets us pass
// the harness through an `as unknown as WhitelistPlugin` cast at the call site.
// --------------------------------------------------------------------------

interface StatusBarHarness {
	app: App;
	settings: WhitelistSettings;
	complianceResult: ComplianceResult | null;
	statusBarItem: HTMLElement | null;
	addStatusBarItem: () => HTMLElement;
	addStatusBarItemCalls: number;
	lastCreated: MockStatusBarElement | null;
}

function createHarness(
	settings: WhitelistSettings,
	result: ComplianceResult | null,
): StatusBarHarness {
	const harness: StatusBarHarness = {
		app: new App(),
		settings,
		complianceResult: result,
		statusBarItem: null,
		addStatusBarItemCalls: 0,
		lastCreated: null,
		addStatusBarItem() {
			harness.addStatusBarItemCalls += 1;
			const el = createStatusBarMockElement();
			harness.lastCreated = el;
			return el as unknown as HTMLElement;
		},
	};
	return harness;
}

// Helper to invoke the renderer with the harness. Keeps the cast in one place.
function render(harness: StatusBarHarness): void {
	renderStatusBarIndicator(
		harness as unknown as import("../../src/main.js").default,
	);
}

// --------------------------------------------------------------------------
// Sanity: constants/types export surface
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

// AICODE-NOTE: status-bar-indicator - StatusBarIndicatorState is the documented
// projection type; asserting the shape at compile time keeps the export honest.
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

// --------------------------------------------------------------------------
// Phase 2 / Cycle 1: computeIndicatorMode derivation
// --------------------------------------------------------------------------

describe("computeIndicatorMode", () => {
	it("is a function", () => {
		expect(typeof computeIndicatorMode).toBe("function");
	});

	// AICODE-NOTE: TEST-001 tests [FR-001, FR-002] - non-compliant always wins,
	// regardless of showCompliantIndicator, because FR-002 requires the warning
	// indicator to be always visible when violations exist.
	it("TEST-001 returns non_compliant when compliant === false regardless of showCompliantIndicator", () => {
		const result = makeResult({
			compliant: false,
			violations: [makeViolation(), makeViolation(), makeViolation()],
		});

		const modeWithShowOn: IndicatorMode = computeIndicatorMode(
			result,
			makeSettings({ showCompliantIndicator: true }),
		);
		const modeWithShowOff: IndicatorMode = computeIndicatorMode(
			result,
			makeSettings({ showCompliantIndicator: false }),
		);

		expect(modeWithShowOn).toBe("non_compliant");
		expect(modeWithShowOff).toBe("non_compliant");
	});

	// AICODE-NOTE: TEST-002 tests pre-scan edge case: before the boot scan
	// completes, complianceResult is null on the plugin instance; the renderer
	// must project that onto compliant_hidden so no element is attached.
	it("TEST-002 returns compliant_hidden when result is null (pre-scan edge case)", () => {
		const mode: IndicatorMode = computeIndicatorMode(null, makeSettings());
		expect(mode).toBe("compliant_hidden");
	});
});

// --------------------------------------------------------------------------
// Phase 2 / Cycle 2: Non-compliant render branch
// --------------------------------------------------------------------------

describe("renderStatusBarIndicator - non-compliant branch", () => {
	beforeEach(() => {
		resetSetIcon();
		vi.mocked(showComplianceModal).mockClear();
		vi.mocked(writeComplianceNotification).mockClear();
	});

	// AICODE-NOTE: TEST-003 tests [FR-001, UX-002] - label format matches
	// INDICATOR_LABEL_NON_COMPLIANT_FORMAT with actual violation count.
	it("TEST-003 renders status bar element with 'Non-compliant (3)' text for 3 violations", () => {
		const harness = createHarness(
			makeSettings(),
			makeResult({
				compliant: false,
				violations: [makeViolation(), makeViolation(), makeViolation()],
			}),
		);

		render(harness);

		expect(harness.statusBarItem).not.toBeNull();
		const el = asStatusBarMock(harness.statusBarItem);
		// Label text may be set on the root element or on a child span; accept either.
		const allTexts = [el._text, ...el._children.map((c) => c._text)];
		expect(allTexts).toContain("Non-compliant (3)");
	});

	// AICODE-NOTE: TEST-004 tests [FR-001, UX-001] - warning icon + CSS class applied
	// to the non-compliant element per data-model.md Constants.
	it("TEST-004 applies INDICATOR_CSS_CLASS_NON_COMPLIANT and warning icon via setIcon", () => {
		const harness = createHarness(
			makeSettings(),
			makeResult({
				compliant: false,
				violations: [makeViolation()],
			}),
		);

		render(harness);

		const el = asStatusBarMock(harness.statusBarItem);
		expect(el._classes.has(INDICATOR_CSS_CLASS_NON_COMPLIANT)).toBe(true);
		// setIcon called with the warning icon name
		const iconCall = setIconCalls.find(
			(c) => c.iconId === INDICATOR_ICON_NON_COMPLIANT,
		);
		expect(iconCall).toBeDefined();
	});

	// AICODE-NOTE: TEST-005 tests [FR-001] - each render attaches exactly one
	// status bar item; no duplicate addStatusBarItem calls per render.
	it("TEST-005 invokes addStatusBarItem exactly once per render", () => {
		const harness = createHarness(
			makeSettings(),
			makeResult({
				compliant: false,
				violations: [makeViolation()],
			}),
		);

		render(harness);

		expect(harness.addStatusBarItemCalls).toBe(1);
	});
});

// --------------------------------------------------------------------------
// Phase 3 / Cycle 3: Compliant-visible render branch
// --------------------------------------------------------------------------

describe("renderStatusBarIndicator - compliant_visible branch", () => {
	beforeEach(() => {
		resetSetIcon();
	});

	// AICODE-NOTE: TEST-006 tests [FR-003] - mode derivation when compliant + toggle on.
	it("TEST-006 computeIndicatorMode returns compliant_visible when compliant and showCompliantIndicator=true", () => {
		const mode = computeIndicatorMode(
			makeResult({ compliant: true, violations: [] }),
			makeSettings({ showCompliantIndicator: true }),
		);
		expect(mode).toBe("compliant_visible");
	});

	// AICODE-NOTE: TEST-007 tests [FR-003, UX-001] - compliant element has check icon,
	// Compliant label, and the compliant CSS class.
	it("TEST-007 renders element with 'Compliant' text, check icon, and INDICATOR_CSS_CLASS_COMPLIANT", () => {
		const harness = createHarness(
			makeSettings({ showCompliantIndicator: true }),
			makeResult({ compliant: true, violations: [] }),
		);

		render(harness);

		expect(harness.statusBarItem).not.toBeNull();
		const el = asStatusBarMock(harness.statusBarItem);
		expect(el._classes.has(INDICATOR_CSS_CLASS_COMPLIANT)).toBe(true);
		const allTexts = [el._text, ...el._children.map((c) => c._text)];
		expect(allTexts).toContain(INDICATOR_LABEL_COMPLIANT);
		const iconCall = setIconCalls.find(
			(c) => c.iconId === INDICATOR_ICON_COMPLIANT,
		);
		expect(iconCall).toBeDefined();
	});

	// AICODE-NOTE: TEST-008 tests [FR-005, UX-001] - compliant element is NOT clickable.
	// Click handler is reserved for the non-compliant state; FR-005 is scoped to the
	// warning indicator only.
	it("TEST-008 compliant element has NO click listener attached", () => {
		const harness = createHarness(
			makeSettings({ showCompliantIndicator: true }),
			makeResult({ compliant: true, violations: [] }),
		);

		render(harness);

		const el = asStatusBarMock(harness.statusBarItem);
		expect(el._events["click"]).toBeUndefined();
	});
});

// --------------------------------------------------------------------------
// Phase 4 / Cycle 4: Compliant-hidden render branch + re-render lifecycle
// --------------------------------------------------------------------------

describe("renderStatusBarIndicator - compliant_hidden branch", () => {
	beforeEach(() => {
		resetSetIcon();
	});

	// AICODE-NOTE: TEST-009 tests [FR-004] - mode derivation when compliant + toggle off.
	it("TEST-009 computeIndicatorMode returns compliant_hidden when compliant and showCompliantIndicator=false", () => {
		const mode = computeIndicatorMode(
			makeResult({ compliant: true, violations: [] }),
			makeSettings({ showCompliantIndicator: false }),
		);
		expect(mode).toBe("compliant_hidden");
	});

	// AICODE-NOTE: TEST-010 tests [FR-004] - no element attached, plugin.statusBarItem cleared.
	it("TEST-010 does NOT call addStatusBarItem and sets plugin.statusBarItem to null", () => {
		const harness = createHarness(
			makeSettings({ showCompliantIndicator: false }),
			makeResult({ compliant: true, violations: [] }),
		);

		render(harness);

		expect(harness.addStatusBarItemCalls).toBe(0);
		expect(harness.statusBarItem).toBeNull();
	});

	// AICODE-NOTE: TEST-011 tests [FR-004] - toggling showCompliantIndicator from true → false
	// detaches the previously rendered element (no orphan DOM node).
	it("TEST-011 toggling showCompliantIndicator true→false detaches previous element", () => {
		const harness = createHarness(
			makeSettings({ showCompliantIndicator: true }),
			makeResult({ compliant: true, violations: [] }),
		);

		render(harness);
		expect(harness.statusBarItem).not.toBeNull();
		const firstEl = asStatusBarMock(harness.statusBarItem);
		expect(firstEl._detached).toBe(false);

		// Toggle off and re-render
		harness.settings = makeSettings({ showCompliantIndicator: false });
		render(harness);

		expect(firstEl._detached).toBe(true);
		expect(harness.statusBarItem).toBeNull();
	});

	// AICODE-NOTE: TEST-012 tests [FR-003] - toggling showCompliantIndicator from false → true
	// creates a new compliant element.
	it("TEST-012 toggling showCompliantIndicator false→true creates a new compliant element", () => {
		const harness = createHarness(
			makeSettings({ showCompliantIndicator: false }),
			makeResult({ compliant: true, violations: [] }),
		);

		render(harness);
		expect(harness.statusBarItem).toBeNull();
		expect(harness.addStatusBarItemCalls).toBe(0);

		// Toggle on and re-render
		harness.settings = makeSettings({ showCompliantIndicator: true });
		render(harness);

		expect(harness.addStatusBarItemCalls).toBe(1);
		expect(harness.statusBarItem).not.toBeNull();
		const el = asStatusBarMock(harness.statusBarItem);
		expect(el._classes.has(INDICATOR_CSS_CLASS_COMPLIANT)).toBe(true);
	});
});

// --------------------------------------------------------------------------
// Phase 5 / Cycle 5: Click handler + modal reopen
// --------------------------------------------------------------------------

describe("renderStatusBarIndicator - click handler (non-compliant)", () => {
	beforeEach(() => {
		resetSetIcon();
		vi.mocked(showComplianceModal).mockReset();
		vi.mocked(writeComplianceNotification).mockReset();
	});

	// AICODE-NOTE: TEST-013 tests [FR-005, a11y] - clickable non-compliant element
	// carries role=button, tabIndex=0, and a click listener.
	it("TEST-013 non-compliant element has role=button, tabIndex=0, and a click listener", () => {
		vi.mocked(showComplianceModal).mockResolvedValue("");
		vi.mocked(writeComplianceNotification).mockResolvedValue(undefined);
		const harness = createHarness(
			makeSettings(),
			makeResult({
				compliant: false,
				violations: [makeViolation()],
			}),
		);

		render(harness);

		const el = asStatusBarMock(harness.statusBarItem);
		expect(el._attrs["role"]).toBe("button");
		expect(el.tabIndex).toBe(0);
		expect(Array.isArray(el._events["click"])).toBe(true);
		expect(el._events["click"].length).toBeGreaterThan(0);
	});

	// AICODE-NOTE: TEST-014 tests [FR-005] - click invokes showComplianceModal with the
	// CURRENT violations from plugin.complianceResult (not a stale snapshot).
	it("TEST-014 click invokes showComplianceModal with current plugin.complianceResult.violations", async () => {
		vi.mocked(showComplianceModal).mockResolvedValue("justification-text");
		vi.mocked(writeComplianceNotification).mockResolvedValue(undefined);

		const violations = [makeViolation({ pluginId: "a" }), makeViolation({ pluginId: "b" })];
		const harness = createHarness(
			makeSettings(),
			makeResult({ compliant: false, violations }),
		);

		render(harness);
		const el = asStatusBarMock(harness.statusBarItem);
		el._fire("click");
		// Let pending microtasks resolve
		await Promise.resolve();
		await Promise.resolve();

		expect(vi.mocked(showComplianceModal)).toHaveBeenCalledTimes(1);
		const [, passedViolations] = vi.mocked(showComplianceModal).mock.calls[0];
		expect(passedViolations).toBe(violations);
	});

	// AICODE-NOTE: TEST-015 tests [FR-005] - after the modal resolves, the click handler
	// forwards the justification to writeComplianceNotification.
	it("TEST-015 click invokes writeComplianceNotification with resolved justification", async () => {
		vi.mocked(showComplianceModal).mockResolvedValue("my-reason");
		vi.mocked(writeComplianceNotification).mockResolvedValue(undefined);

		const harness = createHarness(
			makeSettings({ notificationDirectory: "notify-dir" }),
			makeResult({
				compliant: false,
				violations: [makeViolation()],
			}),
		);

		render(harness);
		const el = asStatusBarMock(harness.statusBarItem);
		el._fire("click");
		// Await all pending microtasks for the async click handler
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(vi.mocked(writeComplianceNotification)).toHaveBeenCalledTimes(1);
		const args = vi.mocked(writeComplianceNotification).mock.calls[0];
		// Argument order from existing main.ts pattern:
		// (app, directory, violations, justification)
		expect(args[1]).toBe("notify-dir");
		expect(args[3]).toBe("my-reason");
	});

	// AICODE-NOTE: TEST-016 tests [FR-005] - re-entrant click while modal is still open
	// is a no-op. Guarded by a local modalOpen boolean in the click handler closure.
	it("TEST-016 re-entrant click while modal is open does not double-invoke showComplianceModal", async () => {
		// Make the modal promise pending until we resolve it manually.
		let resolveModal: ((value: string) => void) | null = null;
		vi.mocked(showComplianceModal).mockImplementation(
			() =>
				new Promise<string>((resolve) => {
					resolveModal = resolve;
				}),
		);
		vi.mocked(writeComplianceNotification).mockResolvedValue(undefined);

		const harness = createHarness(
			makeSettings(),
			makeResult({
				compliant: false,
				violations: [makeViolation()],
			}),
		);

		render(harness);
		const el = asStatusBarMock(harness.statusBarItem);

		// First click opens the modal (pending)
		el._fire("click");
		await Promise.resolve();
		expect(vi.mocked(showComplianceModal)).toHaveBeenCalledTimes(1);

		// Second click while pending — MUST NOT open a second modal
		el._fire("click");
		await Promise.resolve();
		expect(vi.mocked(showComplianceModal)).toHaveBeenCalledTimes(1);

		// Clean up the still-pending modal promise
		resolveModal?.("");
		await new Promise((resolve) => setTimeout(resolve, 0));
	});
});

// --------------------------------------------------------------------------
// Phase 6 / Cycle 6: Re-render lifecycle
// --------------------------------------------------------------------------

describe("renderStatusBarIndicator - re-render lifecycle", () => {
	beforeEach(() => {
		resetSetIcon();
		vi.mocked(showComplianceModal).mockReset();
		vi.mocked(writeComplianceNotification).mockReset();
		vi.mocked(showComplianceModal).mockResolvedValue("");
		vi.mocked(writeComplianceNotification).mockResolvedValue(undefined);
	});

	// AICODE-NOTE: TEST-017 tests [FR-001, FR-002] - two consecutive renders in
	// non-compliant state detach the first element before creating the second.
	// Guards against orphan DOM nodes on re-render (research.md risk).
	it("TEST-017 two renders in non-compliant state detach the first element", () => {
		const harness = createHarness(
			makeSettings(),
			makeResult({
				compliant: false,
				violations: [makeViolation()],
			}),
		);

		render(harness);
		const first = asStatusBarMock(harness.statusBarItem);
		expect(first._detached).toBe(false);

		render(harness);
		const second = asStatusBarMock(harness.statusBarItem);

		expect(first._detached).toBe(true);
		expect(second).not.toBe(first);
		expect(harness.addStatusBarItemCalls).toBe(2);
	});

	// AICODE-NOTE: TEST-018 tests [FR-003, FR-004] - transitioning from non-compliant
	// to compliant produces the correct compliant_visible or compliant_hidden element
	// per showCompliantIndicator.
	it("TEST-018 non-compliant → compliant transitions honor showCompliantIndicator", () => {
		// Case A: transition into compliant_visible
		const harnessA = createHarness(
			makeSettings({ showCompliantIndicator: true }),
			makeResult({ compliant: false, violations: [makeViolation()] }),
		);
		render(harnessA);
		expect(
			asStatusBarMock(harnessA.statusBarItem)._classes.has(
				INDICATOR_CSS_CLASS_NON_COMPLIANT,
			),
		).toBe(true);
		harnessA.complianceResult = makeResult({ compliant: true, violations: [] });
		render(harnessA);
		expect(harnessA.statusBarItem).not.toBeNull();
		expect(
			asStatusBarMock(harnessA.statusBarItem)._classes.has(
				INDICATOR_CSS_CLASS_COMPLIANT,
			),
		).toBe(true);

		// Case B: transition into compliant_hidden
		const harnessB = createHarness(
			makeSettings({ showCompliantIndicator: false }),
			makeResult({ compliant: false, violations: [makeViolation()] }),
		);
		render(harnessB);
		const firstB = asStatusBarMock(harnessB.statusBarItem);
		harnessB.complianceResult = makeResult({ compliant: true, violations: [] });
		render(harnessB);
		expect(firstB._detached).toBe(true);
		expect(harnessB.statusBarItem).toBeNull();
	});
});

// --------------------------------------------------------------------------
// Phase 7 / Cycle 7: Accessibility, mobile touch target, CSS contract
// --------------------------------------------------------------------------

describe("renderStatusBarIndicator - accessibility + mobile", () => {
	beforeEach(() => {
		resetSetIcon();
		vi.mocked(showComplianceModal).mockReset();
		vi.mocked(writeComplianceNotification).mockReset();
		vi.mocked(showComplianceModal).mockResolvedValue("");
		vi.mocked(writeComplianceNotification).mockResolvedValue(undefined);
	});

	// AICODE-NOTE: TEST-019 tests [FR-005, a11y] - non-compliant aria-label uses
	// the documented INDICATOR_ARIA_NON_COMPLIANT_FORMAT with the exact count.
	it("TEST-019 non-compliant aria-label equals 'Non-compliant: 3 plugin violations. Click to view.' for 3 violations", () => {
		const harness = createHarness(
			makeSettings(),
			makeResult({
				compliant: false,
				violations: [makeViolation(), makeViolation(), makeViolation()],
			}),
		);

		render(harness);

		const el = asStatusBarMock(harness.statusBarItem);
		expect(el._attrs["aria-label"]).toBe(
			"Non-compliant: 3 plugin violations. Click to view.",
		);
	});

	// AICODE-NOTE: TEST-020 tests [a11y] - compliant_visible element is a status
	// region (not a button) and exposes INDICATOR_ARIA_COMPLIANT.
	it("TEST-020 compliant_visible element has role=status and aria-label='Compliant'", () => {
		const harness = createHarness(
			makeSettings({ showCompliantIndicator: true }),
			makeResult({ compliant: true, violations: [] }),
		);

		render(harness);

		const el = asStatusBarMock(harness.statusBarItem);
		expect(el._attrs["role"]).toBe("status");
		expect(el._attrs["aria-label"]).toBe(INDICATOR_ARIA_COMPLIANT);
	});

	// AICODE-NOTE: TEST-021 tests [a11y] - Enter key on focused non-compliant
	// element invokes the same handler as click.
	it("TEST-021 Enter key on non-compliant element invokes the click handler", async () => {
		vi.mocked(showComplianceModal).mockResolvedValue("");
		const harness = createHarness(
			makeSettings(),
			makeResult({
				compliant: false,
				violations: [makeViolation()],
			}),
		);

		render(harness);
		const el = asStatusBarMock(harness.statusBarItem);
		expect(Array.isArray(el._events["keydown"])).toBe(true);
		el._fire("keydown", { key: "Enter", preventDefault: () => {} });
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(vi.mocked(showComplianceModal)).toHaveBeenCalledTimes(1);
	});

	// AICODE-NOTE: TEST-022 tests [a11y] - Space key on focused non-compliant
	// element invokes the same handler as click.
	it("TEST-022 Space key on non-compliant element invokes the click handler", async () => {
		vi.mocked(showComplianceModal).mockResolvedValue("");
		const harness = createHarness(
			makeSettings(),
			makeResult({
				compliant: false,
				violations: [makeViolation()],
			}),
		);

		render(harness);
		const el = asStatusBarMock(harness.statusBarItem);
		el._fire("keydown", { key: " ", preventDefault: () => {} });
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(vi.mocked(showComplianceModal)).toHaveBeenCalledTimes(1);
	});

	// AICODE-NOTE: TEST-023 tests [a11y, visual contract] - INDICATOR_CSS_CLASS_NON_COMPLIANT
	// is applied. The class carries the MIN_CONTRAST_RATIO ≥ 4.5 contract declared in
	// styles.css (IMPL-011) — the test validates the runtime hook, not the CSS engine.
	it("TEST-023 non-compliant element is assigned INDICATOR_CSS_CLASS_NON_COMPLIANT (contrast contract)", () => {
		const harness = createHarness(
			makeSettings(),
			makeResult({
				compliant: false,
				violations: [makeViolation()],
			}),
		);

		render(harness);
		const el = asStatusBarMock(harness.statusBarItem);

		expect(el._classes.has(INDICATOR_CSS_CLASS_NON_COMPLIANT)).toBe(true);
		// MIN_CONTRAST_RATIO is the contract value encoded in styles.css (IMPL-011).
		expect(MIN_CONTRAST_RATIO).toBeGreaterThanOrEqual(4.5);
	});

	// AICODE-NOTE: TEST-024 tests [mobile] - the non-compliant element honors the
	// ≥44 CSS px minimum touch target. Enforcement lives in styles.css via the
	// INDICATOR_CSS_CLASS_NON_COMPLIANT rule (IMPL-011); the unit test asserts the
	// class is present and the constant matches the documented minimum.
	it("TEST-024 non-compliant element class enforces MOBILE_TOUCH_TARGET_MIN_PX via styles.css", async () => {
		const harness = createHarness(
			makeSettings(),
			makeResult({
				compliant: false,
				violations: [makeViolation()],
			}),
		);

		render(harness);
		const el = asStatusBarMock(harness.statusBarItem);

		expect(el._classes.has(INDICATOR_CSS_CLASS_NON_COMPLIANT)).toBe(true);
		expect(MOBILE_TOUCH_TARGET_MIN_PX).toBeGreaterThanOrEqual(44);

		// Verify styles.css actually contains a rule that wires the class to a
		// ≥44px minimum touch target — guards against the CSS rule being removed.
		const fs = await import("node:fs/promises");
		const css = await fs.readFile("styles.css", "utf-8");
		expect(css).toMatch(
			new RegExp(`\\.${INDICATOR_CSS_CLASS_NON_COMPLIANT}`),
		);
		expect(css).toMatch(/min-height:\s*44px/);
	});
});
