// AICODE-NOTE: INIT-001 creates ComplianceModal class stub and showComplianceModal function per plan.md
// AICODE-NOTE: INIT-003 defines constants from data-model.md (REASON_DISPLAY_TEXT, MODAL_TITLE, etc.)

import { Modal } from "obsidian";
import type { App } from "obsidian";
import type { Violation, ViolationReason } from "./compliance.js";

/**
 * Display text for each violation reason.
 * Maps ViolationReason enum values to user-friendly descriptions.
 * Source: data-model.md Constants table (FR-002, UX-002)
 */
export const REASON_DISPLAY_TEXT: Record<ViolationReason, string> = {
	not_on_whitelist: "Not on approved list",
	on_blacklist: "On blocked list",
};

/** Modal title text (UX-001) */
export const MODAL_TITLE = "Plugin Compliance Notice";

/** Submit button label (UX-003) */
export const SUBMIT_BUTTON_LABEL = "Acknowledge";

/** Justification textarea placeholder (FR-004) */
export const JUSTIFICATION_PLACEHOLDER =
	"Optional: explain why these plugins are installed";

/**
 * Blocking modal that displays compliance violations and collects
 * an optional justification message from the user.
 *
 * Close is blocked until the user submits via the Acknowledge button.
 */
export class ComplianceModal extends Modal {
	violations: Violation[];
	justification: string;
	submitted: boolean;

	private resolvePromise: ((justification: string) => void) | null = null;

	constructor(app: App, violations: Violation[]) {
		super(app);
		this.violations = violations;
		this.justification = "";
		this.submitted = false;
	}

	// AICODE-TODO: IMPL-001 renders header, violation list, justification input, submit button
	onOpen(): void {
		// Stub -- implemented in IMPL-001
	}

	// AICODE-TODO: IMPL-005 overrides close to block dismissal until submitted
	close(): void {
		if (this.submitted) {
			super.close();
		}
		// Block close when not submitted (FR-006)
	}

	/**
	 * Sets the resolve callback so showComplianceModal can await submission.
	 */
	setResolve(resolve: (justification: string) => void): void {
		this.resolvePromise = resolve;
	}

	/**
	 * Called by submit handler to resolve the Promise and close.
	 */
	submit(): void {
		this.submitted = true;
		this.justification = this.justification.trim();
		if (this.resolvePromise) {
			this.resolvePromise(this.justification);
		}
		this.close();
	}
}

/**
 * Creates and displays a ComplianceModal, returning a Promise that
 * resolves with the user's justification text when they submit.
 *
 * @param app - Obsidian App instance
 * @param violations - Non-empty array of compliance violations to display
 * @returns Promise resolving to trimmed justification string (may be empty)
 */
export function showComplianceModal(
	app: App,
	violations: Violation[],
): Promise<string> {
	return new Promise<string>((resolve) => {
		const modal = new ComplianceModal(app, violations);
		modal.setResolve(resolve);
		modal.open();
	});
}
