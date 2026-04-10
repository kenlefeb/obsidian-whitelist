// AICODE-NOTE: INIT-001 creates ComplianceModal class and showComplianceModal function per plan.md
// AICODE-NOTE: INIT-003 defines constants from data-model.md (REASON_DISPLAY_TEXT, MODAL_TITLE, etc.)
// AICODE-NOTE: IMPL-001 renders header/violation list, IMPL-002 adds textarea/button, IMPL-003 wires submit, IMPL-005 blocks close

import { ButtonComponent, Modal } from "obsidian";
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
	private textareaEl: HTMLTextAreaElement | null = null;

	constructor(app: App, violations: Violation[]) {
		super(app);
		this.violations = violations;
		this.justification = "";
		this.submitted = false;
	}

	// AICODE-NOTE: IMPL-001 implements [FR-001, FR-002, FR-003] - renders header + scrollable violation list
	// AICODE-NOTE: IMPL-002 implements [FR-004] - renders justification textarea
	// AICODE-NOTE: IMPL-003 implements [FR-005, FR-007] - renders submit button wired to submit()
	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		// Header: MODAL_TITLE + violation count (FR-001, UX-001)
		contentEl.createEl("h2", { text: MODAL_TITLE });

		// Violation description paragraph (UX-001 - professional, non-punitive)
		const count = this.violations.length;
		const descText =
			count === 1
				? "The following plugin does not comply with your organization's policy:"
				: `The following ${count} plugins do not comply with your organization's policy:`;
		contentEl.createEl("p", { text: descText });

		// Scrollable violation list (FR-002, FR-003)
		const listEl = contentEl.createDiv({ cls: "compliance-violation-list" });
		for (const violation of this.violations) {
			const itemEl = listEl.createDiv({ cls: "compliance-violation-item" });
			itemEl.createEl("span", {
				cls: "compliance-violation-name",
				text: violation.pluginName,
			});
			itemEl.createEl("span", {
				cls: "compliance-violation-reason",
				text: REASON_DISPLAY_TEXT[violation.reason],
			});
		}

		// Justification textarea (FR-004)
		const textarea = contentEl.createEl("textarea", {
			cls: "compliance-justification-input",
		}) as HTMLTextAreaElement;
		textarea.placeholder = JUSTIFICATION_PLACEHOLDER;
		textarea.rows = 4;
		this.textareaEl = textarea;

		// Submit button (FR-005, UX-003)
		const buttonRow = contentEl.createDiv({ cls: "compliance-button-row" });
		new ButtonComponent(buttonRow)
			.setButtonText(SUBMIT_BUTTON_LABEL)
			.setCta()
			.onClick(() => this.submit());
	}

	// AICODE-NOTE: IMPL-005 implements [FR-006] - override close to block dismissal until submitted
	// Obsidian routes both Escape key and background click through close(), so this
	// single override handles both dismissal paths.
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

	// AICODE-NOTE: IMPL-003 implements [FR-005, FR-007] - submit handler trims + allows empty
	/**
	 * Called by submit handler to resolve the Promise and close.
	 * Captures and trims the textarea value, sets submitted flag so close() succeeds.
	 */
	submit(): void {
		// Read live value from textarea if rendered; fall back to existing field for tests
		const rawValue = this.textareaEl?.value ?? this.justification;
		this.justification = rawValue.trim();
		this.submitted = true;
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
 * Each call creates a fresh ComplianceModal instance (FR-005 re-open support).
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
