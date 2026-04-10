/**
 * AICODE-NOTE: INIT-001 creates ComplianceEvent interface, constants, and function stubs
 * per data-model.md. RED/GREEN phases added in Phase 2+.
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
 *
 * @param vaultName - Obsidian vault name
 * @param violations - Violations detected by compliance scan
 * @param justification - User-provided justification (may be empty string)
 * @returns ComplianceEvent with current ISO timestamp
 */
// AICODE-TODO: IMPL-001 - implement per TEST-001/TEST-002 in Phase 2
export function buildComplianceEvent(
	_vaultName: string,
	_violations: Violation[],
	_justification: string,
): ComplianceEvent {
	throw new Error("Not implemented — see IMPL-001");
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
// AICODE-TODO: IMPL-005 - implement per TEST-008/TEST-009 in Phase 5
export function buildNotificationFilename(_date: Date): string {
	throw new Error("Not implemented — see IMPL-005");
}

/**
 * Write a compliance event as a JSON file to the vault-relative directory.
 *
 * Creates the directory recursively if it does not exist (FR-004).
 * Handles write failures gracefully via Notice + console.error — never throws (FR-005, UX-001).
 *
 * @param app - Obsidian App instance (for vault.adapter access)
 * @param directory - Vault-relative directory path
 * @param violations - Violations from compliance scan
 * @param justification - User justification from compliance modal
 */
// AICODE-TODO: IMPL-002/IMPL-004/IMPL-006/IMPL-008 - implement in Phase 2, 4, 5, 7
export async function writeComplianceNotification(
	_app: App,
	_directory: string,
	_violations: Violation[],
	_justification: string,
): Promise<void> {
	throw new Error("Not implemented — see IMPL-002");
}
