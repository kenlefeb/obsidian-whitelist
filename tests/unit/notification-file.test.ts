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

describe("buildNotificationFilename", () => {
	// AICODE-NOTE: TEST-008 tests [FR-003] - sanitized timestamp in compliance-<ts>.json format
	it("TEST-008 returns compliance-<sanitized-timestamp>.json with colons and dots replaced by hyphens", () => {
		const date = new Date("2026-04-09T18:35:25.123Z");
		const filename = buildNotificationFilename(date);

		expect(filename).toBe("compliance-2026-04-09T18-35-25-123Z.json");
		expect(filename.startsWith(FILENAME_PREFIX)).toBe(true);
		expect(filename.endsWith(FILENAME_EXTENSION)).toBe(true);
		expect(filename).not.toContain(":");
		expect(filename.match(/\./g)).toHaveLength(1);
	});

	// AICODE-NOTE: TEST-009 tests [FR-003] - unique filenames per distinct timestamp
	it("TEST-009 returns different filenames for different dates", () => {
		const d1 = new Date("2026-04-09T18:35:25.123Z");
		const d2 = new Date("2026-04-09T18:35:25.124Z");
		const d3 = new Date("2026-04-10T00:00:00.000Z");

		const f1 = buildNotificationFilename(d1);
		const f2 = buildNotificationFilename(d2);
		const f3 = buildNotificationFilename(d3);

		expect(f1).not.toBe(f2);
		expect(f2).not.toBe(f3);
		expect(f1).not.toBe(f3);
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

		expect(parsed).toHaveProperty("timestamp");
		expect(parsed).toHaveProperty("vaultName");
		expect(parsed).toHaveProperty("violations");
		expect(parsed).toHaveProperty("justification");

		expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(parsed.vaultName).toBe("test-vault");
		expect(parsed.justification).toBe("needed for work");

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

	// AICODE-NOTE: TEST-006 tests [FR-004] - mkdir invoked when directory missing
	it("TEST-006 calls adapter.mkdir when directory does not exist", async () => {
		const existsSpy = vi.spyOn(app.vault.adapter, "exists").mockResolvedValue(false);
		const mkdirSpy = vi.spyOn(app.vault.adapter, "mkdir").mockResolvedValue(undefined);
		vi.spyOn(app.vault.adapter, "write").mockResolvedValue(undefined);

		await writeComplianceNotification(app, "compliance", sampleViolations, "because");

		expect(existsSpy).toHaveBeenCalledWith("compliance");
		expect(mkdirSpy).toHaveBeenCalledTimes(1);
		expect(mkdirSpy).toHaveBeenCalledWith("compliance");
	});

	// AICODE-NOTE: TEST-007 tests [FR-004] - mkdir skipped when directory exists
	it("TEST-007 does NOT call adapter.mkdir when directory exists", async () => {
		const existsSpy = vi.spyOn(app.vault.adapter, "exists").mockResolvedValue(true);
		const mkdirSpy = vi.spyOn(app.vault.adapter, "mkdir").mockResolvedValue(undefined);
		vi.spyOn(app.vault.adapter, "write").mockResolvedValue(undefined);

		await writeComplianceNotification(app, "compliance", sampleViolations, "because");

		expect(existsSpy).toHaveBeenCalledWith("compliance");
		expect(mkdirSpy).not.toHaveBeenCalled();
	});

	// AICODE-NOTE: TEST-010 tests [FR-002] - empty justification produces valid JSON with empty string field
	it("TEST-010 writes valid JSON with empty string justification when justification is empty", async () => {
		const writeSpy = vi.spyOn(app.vault.adapter, "write").mockResolvedValue(undefined);

		await writeComplianceNotification(app, "compliance", sampleViolations, "");

		expect(writeSpy).toHaveBeenCalledTimes(1);
		const [, content] = writeSpy.mock.calls[0];
		const parsed = JSON.parse(content);
		expect(parsed.justification).toBe("");
		expect(typeof parsed.justification).toBe("string");
	});
});

void ERROR_NOTICE_PREFIX;
