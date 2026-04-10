// AICODE-NOTE: status-bar-indicator INIT-001 creates module per plan.md Feature Code Organization.
// Single standalone module (Structure A) that projects compliance state onto an Obsidian
// status bar item. Pure helper `computeIndicatorMode` is unit-testable in isolation from
// any DOM; `renderStatusBarIndicator` owns element lifecycle on the plugin instance.

import type { ComplianceResult } from "./compliance.js";
import type { WhitelistSettings } from "./settings.js";
import type WhitelistPlugin from "./main.js";

// AICODE-NOTE: status-bar-indicator INIT-002 defines IndicatorMode + StatusBarIndicatorState
// per data-model.md Enums/Entities. IndicatorMode is the strict derivation from
// (ComplianceResult, WhitelistSettings); StatusBarIndicatorState is the in-memory projection
// passed to render branches.

/**
 * Derived visual mode for the status bar indicator.
 * - `non_compliant`: vault has violations; warning indicator visible (FR-001, FR-002).
 * - `compliant_visible`: zero violations AND `showCompliantIndicator === true` (FR-003).
 * - `compliant_hidden`: zero violations AND `showCompliantIndicator === false` (FR-004);
 *   also used as the pre-scan edge case when `complianceResult === null`.
 */
export type IndicatorMode =
	| "non_compliant"
	| "compliant_visible"
	| "compliant_hidden";

/**
 * In-memory projection used by the renderer.
 * Not persisted. See data-model.md StatusBarIndicatorState.
 */
export interface StatusBarIndicatorState {
	mode: IndicatorMode;
	violationCount: number;
	visible: boolean;
}

// AICODE-NOTE: status-bar-indicator INIT-003 defines constants per data-model.md Constants table.
// Keep exported so tests can assert label/aria text without string duplication.

/** Obsidian icon name for the non-compliant warning indicator. */
export const INDICATOR_ICON_NON_COMPLIANT = "alert-triangle";

/** Obsidian icon name for the compliant checkmark indicator. */
export const INDICATOR_ICON_COMPLIANT = "check-circle";

/** Static label text rendered when compliant and visible. */
export const INDICATOR_LABEL_COMPLIANT = "Compliant";

/**
 * Formats the non-compliant label shown in the status bar.
 * Example: `Non-compliant (3)` when three violations are present.
 */
export function INDICATOR_LABEL_NON_COMPLIANT_FORMAT(count: number): string {
	return `Non-compliant (${count})`;
}

/**
 * Formats the ARIA label for the non-compliant indicator.
 * Example: `Non-compliant: 3 plugin violations. Click to view.`
 */
export function INDICATOR_ARIA_NON_COMPLIANT_FORMAT(count: number): string {
	return `Non-compliant: ${count} plugin violations. Click to view.`;
}

/** ARIA label rendered in compliant_visible mode. */
export const INDICATOR_ARIA_COMPLIANT = "Compliant";

/** CSS class applied to the non-compliant status bar element. */
export const INDICATOR_CSS_CLASS_NON_COMPLIANT =
	"obsidian-whitelist-status-noncompliant";

/** CSS class applied to the compliant status bar element. */
export const INDICATOR_CSS_CLASS_COMPLIANT =
	"obsidian-whitelist-status-compliant";

/** Minimum touch target size in CSS pixels for mobile accessibility (ux.md). */
export const MOBILE_TOUCH_TARGET_MIN_PX = 44;

/** Minimum WCAG AA contrast ratio for normal text (ux.md Visual standards). */
export const MIN_CONTRAST_RATIO = 4.5;

// AICODE-NOTE: status-bar-indicator INIT-004 scaffolds computeIndicatorMode + renderStatusBarIndicator.
// STUB - real behavior arrives in Phase 2+ TDD cycles (IMPL-001..IMPL-011 in tasks.md).

// AICODE-TODO: IMPL-001 implement mode derivation per data-model.md state transitions.
/**
 * Derives the indicator mode from compliance state + settings.
 * STUB: returns "compliant_hidden" so the renderer is a no-op until IMPL-001 lands.
 */
export function computeIndicatorMode(
	result: ComplianceResult | null,
	settings: WhitelistSettings,
): IndicatorMode {
	void result;
	void settings;
	return "compliant_hidden";
}

// AICODE-TODO: IMPL-002..IMPL-011 implement render branches, click handler,
// keyboard activation, ARIA attributes, and element lifecycle.
/**
 * Renders (or re-renders) the status bar indicator for the current compliance state.
 * STUB: no-op until Phase 2+ TDD cycles fill in the render branches.
 */
export function renderStatusBarIndicator(plugin: WhitelistPlugin): void {
	void plugin;
}
