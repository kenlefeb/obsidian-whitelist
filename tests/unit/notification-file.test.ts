/**
 * AICODE-NOTE: Notification file unit tests — INIT-002 creates file with imports.
 * RED/GREEN phases added in Phase 2+.
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
	type ComplianceEvent,
} from "../../src/notification-file.js";
import type { Violation } from "../../src/compliance.js";
import { App, Notice } from "obsidian";

// AICODE-NOTE: Placeholder to keep unused imports available for Phase 2+ tests.
// Remove or inline once TEST-001 is implemented.
void buildComplianceEvent;
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _CE = ComplianceEvent;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _V = Violation;

describe("notification-file", () => {
	it("INIT-002 placeholder — replaced by TEST-001 in Phase 2", () => {
		expect(true).toBe(true);
	});
});
