// AICODE-NOTE: status-bar-indicator INIT-001 creates module per plan.md Feature Code Organization.
// Single standalone module (Structure A) that projects compliance state onto an Obsidian
// status bar item. Pure helper `computeIndicatorMode` is unit-testable in isolation from
// any DOM; `renderStatusBarIndicator` owns element lifecycle on the plugin instance.

import { setIcon } from "obsidian";
import type { ComplianceResult } from "./compliance.js";
import type { WhitelistSettings } from "./settings.js";
import type WhitelistPlugin from "./main.js";
import { showComplianceModal } from "./compliance-modal.js";
import { writeComplianceNotification } from "./notification-file.js";

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

// AICODE-NOTE: status-bar-indicator IMPL-001 implements [FR-001..FR-004] mode derivation.
// Pure projection: (ComplianceResult, WhitelistSettings) -> IndicatorMode with no side effects.
// - null result (pre-scan) short-circuits to compliant_hidden so no element is attached.
// - !compliant always yields non_compliant regardless of showCompliantIndicator (FR-002).
// - compliant yields compliant_visible iff showCompliantIndicator is true (FR-003/FR-004).
/**
 * Derives the indicator mode from compliance state + settings.
 *
 * Pre-scan edge case: when `result === null`, returns `compliant_hidden` so no element
 * is rendered before the boot scan completes.
 */
export function computeIndicatorMode(
	result: ComplianceResult | null,
	settings: WhitelistSettings,
): IndicatorMode {
	if (result === null) {
		return "compliant_hidden";
	}
	if (!result.compliant) {
		return "non_compliant";
	}
	return settings.showCompliantIndicator ? "compliant_visible" : "compliant_hidden";
}

/**
 * Renders (or re-renders) the status bar indicator for the current compliance state.
 *
 * Owns element lifecycle on `plugin.statusBarItem`: always detaches the previous
 * element before doing anything else, so re-renders leave no orphan DOM nodes.
 *
 * Render branches:
 * - `non_compliant` → warning icon + `Non-compliant (N)` label + click/keyboard
 *   handlers that re-open the compliance modal (IMPL-002/007/009).
 * - `compliant_visible` → check icon + `Compliant` label, not clickable (IMPL-004/010).
 * - `compliant_hidden` → no element attached; `plugin.statusBarItem` set to null (IMPL-005).
 */
export function renderStatusBarIndicator(plugin: WhitelistPlugin): void {
	// AICODE-NOTE: status-bar-indicator IMPL-008 - always detach the previous element
	// before computing the new mode. Guarantees no orphan DOM nodes on re-render and
	// covers the compliant_visible → compliant_hidden transition (data-model.md).
	if (plugin.statusBarItem) {
		plugin.statusBarItem.detach();
		plugin.statusBarItem = null;
	}

	const mode = computeIndicatorMode(plugin.complianceResult, plugin.settings);

	if (mode === "compliant_hidden") {
		return;
	}

	if (mode === "non_compliant") {
		// AICODE-NOTE: status-bar-indicator IMPL-002 implements [FR-001, UX-001, UX-002].
		// Build a single status bar item with an icon span + label span. Using Obsidian's
		// own createSpan / setIcon keeps the markup consistent with the rest of the UI.
		const result = plugin.complianceResult as ComplianceResult;
		const count = result.violations.length;
		const el = plugin.addStatusBarItem();
		el.addClass(INDICATOR_CSS_CLASS_NON_COMPLIANT);

		const iconEl = el.createSpan({ cls: "status-bar-item-icon" });
		setIcon(iconEl, INDICATOR_ICON_NON_COMPLIANT);

		const labelEl = el.createSpan({ cls: "status-bar-item-label" });
		labelEl.setText(INDICATOR_LABEL_NON_COMPLIANT_FORMAT(count));

		// AICODE-NOTE: status-bar-indicator IMPL-009 implements [FR-005, a11y] -
		// role/tabIndex/aria-label mark the element as an accessible button so screen
		// readers announce "Non-compliant: N plugin violations. Click to view." and
		// keyboard users can focus it via Tab.
		el.setAttr("role", "button");
		el.tabIndex = 0;
		el.setAttr("aria-label", INDICATOR_ARIA_NON_COMPLIANT_FORMAT(count));

		// AICODE-NOTE: status-bar-indicator IMPL-007 implements [FR-005] - click handler
		// reuses the shared modal flow so there's a single justification code path.
		// The local modalOpen guard prevents stacking modals on re-entrant clicks
		// (research.md "Click race after modal submit"). Set BEFORE awaiting so the
		// second synchronous click sees the flag.
		let modalOpen = false;
		const handleOpen = async (): Promise<void> => {
			if (modalOpen) return;
			const currentResult = plugin.complianceResult;
			if (!currentResult || currentResult.compliant) return;
			modalOpen = true;
			try {
				const justification = await showComplianceModal(
					plugin.app,
					currentResult.violations,
				);
				await writeComplianceNotification(
					plugin.app,
					plugin.settings.notificationDirectory,
					currentResult.violations,
					justification,
				);
			} finally {
				modalOpen = false;
			}
		};
		el.addEventListener("click", () => {
			void handleOpen();
		});

		// AICODE-NOTE: status-bar-indicator IMPL-009 implements [a11y] - Enter/Space
		// keyboard activation mirrors click semantics on the focused element.
		el.addEventListener("keydown", (ev: unknown) => {
			const e = ev as { key?: string; preventDefault?: () => void };
			if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
				e.preventDefault?.();
				void handleOpen();
			}
		});

		plugin.statusBarItem = el;
		return;
	}

	// AICODE-NOTE: status-bar-indicator IMPL-004 implements [FR-003, UX-001] -
	// compliant_visible branch. Same skeleton as the non-compliant branch but uses
	// the check icon, the static Compliant label, and attaches NO click handler
	// (FR-005 scopes clickability to the non-compliant state).
	// AICODE-NOTE: status-bar-indicator IMPL-010 implements [a11y] - compliant_visible
	// uses role=status (live region) and INDICATOR_ARIA_COMPLIANT for screen readers.
	if (mode === "compliant_visible") {
		const el = plugin.addStatusBarItem();
		el.addClass(INDICATOR_CSS_CLASS_COMPLIANT);

		const iconEl = el.createSpan({ cls: "status-bar-item-icon" });
		setIcon(iconEl, INDICATOR_ICON_COMPLIANT);

		const labelEl = el.createSpan({ cls: "status-bar-item-label" });
		labelEl.setText(INDICATOR_LABEL_COMPLIANT);

		el.setAttr("role", "status");
		el.setAttr("aria-label", INDICATOR_ARIA_COMPLIANT);

		plugin.statusBarItem = el;
		return;
	}

	// Unreachable — computeIndicatorMode only produces three modes, all handled above.
	void showComplianceModal;
	void writeComplianceNotification;
}
