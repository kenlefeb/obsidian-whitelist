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

		expect(typeof event.timestamp).toBe("string");
		const parsed = Date.parse(event.timestamp);
		expect(Number.isNaN(parsed)).toBe(false);
		expect(parsed).toBeGreaterThanOrEqual(before);
		expect(parsed).toBeLessThanOrEqual(after);
		expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
	});

	// AICODE-NOTE: TEST-002 tests [FR-002] - empty justification passed through as-is
	it("TEST-002 includes empty string justification as-is", () => {
		const event = buildComplianceEvent("my-vault", sampleViolations, "");
		expect(event.justification).toBe("");
	});
});

describe("writeComplianceNotification", () => {
	let app: App;

	beforeEach(() => {
		app = new App();
		Notice.reset();
	});

	// AICODE-NOTE: TEST-003 tests [FR-001, FR-006] - adapter.write is invoked with JSON content
	it("TEST-003 calls adapter.write with JSON content", async () => {
		const writeSpy = vi.spyOn(app.vault.adapter, "write").mockResolvedValue(undefined);

		await writeComplianceNotification(app, "compliance", sampleViolations, "because");

		expect(writeSpy).toHaveBeenCalledTimes(1);
		const [path, content] = writeSpy.mock.calls[0];
		expect(typeof path).toBe("string");
		expect(path).toContain("compliance/");
		expect(path).toContain(FILENAME_PREFIX);
		expect(path).toContain(FILENAME_EXTENSION);

		const parsed = JSON.parse(content);
		expect(parsed.vaultName).toBe("test-vault");
		expect(parsed.justification).toBe("because");
		expect(parsed.violations).toEqual(sampleViolations);
	});

	// AICODE-NOTE: TEST-004 tests [FR-001] - JSON content uses 2-space indentation constant
	it("TEST-004 writes JSON content with 2-space indentation", async () => {
		const writeSpy = vi.spyOn(app.vault.adapter, "write").mockResolvedValue(undefined);

		await writeComplianceNotification(app, "compliance", sampleViolations, "because");

		const [, content] = writeSpy.mock.calls[0];
		const lines = content.split("\n");
		expect(lines[0]).toBe("{");
		expect(lines[1]).toMatch(/^ {2}"/);
		expect(JSON_INDENT).toBe(2);
		const parsed = JSON.parse(content);
		expect(JSON.stringify(parsed, null, JSON_INDENT)).toBe(content);
	});

	// AICODE-NOTE: TEST-005 tests [FR-002] - written file has all required fields populated
	it("TEST-005 written file contains timestamp, vaultName, violations (with pluginId/pluginName/reason), and justification", async () => {
		const writeSpy = vi.spyOn(app.vault.adapter, "write").mockResolvedValue(undefined);

		await writeComplianceNotification(app, "compliance", sampleViolations, "needed for work");

		const [, content] = writeSpy.mock.calls[0];
		const parsed = JSON.parse(content);

		// Top-level fields
		expect(parsed).toHaveProperty("timestamp");
		expect(parsed).toHaveProperty("vaultName");
		expect(parsed).toHaveProperty("violations");
		expect(parsed).toHaveProperty("justification");

		// Timestamp is valid ISO 8601
		expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

		// Vault name populated from app.vault.getName()
		expect(parsed.vaultName).toBe("test-vault");

		// Justification stored verbatim
		expect(parsed.justification).toBe("needed for work");

		// Each violation exposes required fields
		expect(Array.isArray(parsed.violations)).toBe(true);
		expect(parsed.violations).toHaveLength(2);
		for (const v of parsed.violations) {
			expect(v).toHaveProperty("pluginId");
			expect(v).toHaveProperty("pluginName");
			expect(v).toHaveProperty("reason");
		}
		expect(parsed.violations[0]).toEqual(sampleViolations[0]);
		expect(parsed.violations[1]).toEqual(sampleViolations[1]);
	});
});

// AICODE-NOTE: Placeholders to keep unused imports available for later cycles.
void buildNotificationFilename;
void ERROR_NOTICE_PREFIX;
