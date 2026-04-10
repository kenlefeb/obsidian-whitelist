/**
 * AICODE-NOTE: INIT-001 creates ComplianceEvent interface, constants, and function stubs
 * per data-model.md. Implementation added in Phase 2+ TDD cycles.
 *
 * Module responsibility: write compliance events as JSON files to vault-relative directory.
 * Separates pure functions (buildComplianceEvent, buildNotificationFilename) from
 * I/O wrapper (writeComplianceNotification) for maximum testability per plan.md.
 */

import type { App } from "obsidian";
import type { Violation } from "./compliance.js";

/**
 * Filename prefix for compliance notification files.
 * Source: ux.md Quantified UX Elements.
 */
export const FILENAME_PREFIX = "compliance-";

/**
 * Filename extension for compliance notification files.
 * Source: FR-001 (JSON format).
 */
export const FILENAME_EXTENSION = ".json";

/**
 * JSON.stringify indentation for readability during IS inspection.
 */
export const JSON_INDENT = 2;

/**
 * Prefix for the Notice displayed when a write fails.
 * Source: ux.md Error Presentation.
 */
export const ERROR_NOTICE_PREFIX = "Failed to write compliance notification: ";

/**
 * JSON object written to a notification file.
 * See data-model.md > Entities > ComplianceEvent.
 */
export interface ComplianceEvent {
	/** ISO 8601 timestamp produced via new Date().toISOString() (FR-002) */
	timestamp: string;
	/** Obsidian vault name from app.vault.getName() (FR-002) */
	vaultName: string;
	/** Violations from plugin-compliance-scan (FR-002) */
	violations: Violation[];
	/** User-provided justification; may be empty string (FR-002) */
	justification: string;
}

/**
 * Build a ComplianceEvent from its constituent parts.
 * Pure function — no I/O, no mocking required.
 */
// AICODE-NOTE: IMPL-001 implements [FR-001, FR-002] - pure constructor for ComplianceEvent
export function buildComplianceEvent(
	vaultName: string,
	violations: Violation[],
	justification: string,
): ComplianceEvent {
	return {
		timestamp: new Date().toISOString(),
		vaultName,
		violations,
		justification,
	};
}

/**
 * Build a filesystem-safe notification filename from a Date.
 * Pure function — no I/O, no mocking required.
 *
 * ISO format 2026-04-09T18:35:25.123Z contains `:` and `.` which are unsafe
 * on Windows. Both characters are replaced with `-` for cross-platform safety.
 *
 * @param date - Event timestamp
 * @returns Filename in form `compliance-<sanitized-timestamp>.json`
 */
// AICODE-NOTE: IMPL-005 implements [FR-003] - sanitize ISO timestamp for filesystem safety
export function buildNotificationFilename(date: Date): string {
	const sanitized = date.toISOString().replace(/[:.]/g, "-");
	return `${FILENAME_PREFIX}${sanitized}${FILENAME_EXTENSION}`;
}

/**
 * Write a compliance event as a JSON file to the vault-relative directory.
 *
 * Creates the directory recursively if it does not exist (FR-004).
 * Handles write failures gracefully via Notice + console.error — never throws (FR-005, UX-001).
 */
// AICODE-NOTE: IMPL-002 implements [FR-001, FR-006] - writes JSON event via adapter
// AICODE-NOTE: IMPL-004 implements [FR-004] - recursive mkdir when directory missing
// AICODE-NOTE: IMPL-006 implements [FR-003] - uses buildNotificationFilename for unique paths
// AICODE-TODO: IMPL-008 (Phase 7) - error handling via try/catch + Notice
export async function writeComplianceNotification(
	app: App,
	directory: string,
	violations: Violation[],
	justification: string,
): Promise<void> {
	const adapter = app.vault.adapter;

	const exists = await adapter.exists(directory);
	if (!exists) {
		await adapter.mkdir(directory);
	}

	const event = buildComplianceEvent(app.vault.getName(), violations, justification);
	const filename = buildNotificationFilename(new Date(event.timestamp));
	const path = `${directory}/${filename}`;
	const content = JSON.stringify(event, null, JSON_INDENT);
	await adapter.write(path, content);
}
