/**
 * AICODE-NOTE: Notification file unit tests — INIT-002 creates file with imports.
 * TDD cycles from Phase 2+ add tests incrementally.
 *
 * Pure function tests (buildComplianceEvent, buildNotificationFilename): no mocking.
 * I/O tests (writeComplianceNotification): use mocked Obsidian Vault adapter
 * and Notice constructor from tests/mocks/obsidian.ts (extended in INIT-003).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	buildComplianceEvent,
	buildNotificationFilename,
	writeComplianceNotification,
	FILENAME_PREFIX,
	FILENAME_EXTENSION,
	JSON_INDENT,
	ERROR_NOTICE_PREFIX,
} from "../../src/notification-file.js";
import type { Violation } from "../../src/compliance.js";
import { App, Notice } from "obsidian";

const sampleViolations: Violation[] = [
	{ pluginId: "bad-plugin", pluginName: "Bad Plugin", reason: "on_blacklist" },
	{ pluginId: "unknown-plugin", pluginName: "Unknown Plugin", reason: "not_on_whitelist" },
];

describe("buildComplianceEvent", () => {
	// AICODE-NOTE: TEST-001 tests [FR-001, FR-002] - ComplianceEvent shape and field population
	it("TEST-001 returns object with ISO timestamp, vaultName, violations, and justification", () => {
		const before = Date.now();
		const event = buildComplianceEvent("my-vault", sampleViolations, "just cause");
		const after = Date.now();

		expect(event.vaultName).toBe("my-vault");
		expect(event.violations).toEqual(sampleViolations);
		expect(event.justification).toBe("just cause");

		// Timestamp is valid ISO and within call window
		expect(typeof event.timestamp).toBe("string");
		const parsed = Date.parse(event.timestamp);
		expect(Number.isNaN(parsed)).toBe(false);
		expect(parsed).toBeGreaterThanOrEqual(before);
		expect(parsed).toBeLessThanOrEqual(after);
		// ISO 8601 format
		expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
	});

	// AICODE-NOTE: TEST-002 tests [FR-002] - empty justification passed through as-is
	it("TEST-002 includes empty string justification as-is", () => {
		const event = buildComplianceEvent("my-vault", sampleViolations, "");
		expect(event.justification).toBe("");
	});
});

// AICODE-NOTE: Placeholders to keep unused imports available for later cycles.
void buildNotificationFilename;
void writeComplianceNotification;
void FILENAME_PREFIX;
void FILENAME_EXTENSION;
void JSON_INDENT;
void ERROR_NOTICE_PREFIX;
void App;
void Notice;
void vi;
void beforeEach;
