/**
 * AICODE-NOTE: Settings unit tests -- RED/GREEN phases added in Phase 2+.
 * This file validates settings merge, validation, and default behavior.
 */
import { describe, it, expect } from "vitest";
import {
	DEFAULT_SETTINGS,
	DEFAULT_NOTIFICATION_DIR,
	WhitelistSettings,
	mergeSettings,
} from "../../src/settings";

describe("WhitelistSettings", () => {
	describe("DEFAULT_SETTINGS", () => {
		it("has expected default values per data-model.md", () => {
			expect(DEFAULT_SETTINGS.whitelist).toEqual([]);
			expect(DEFAULT_SETTINGS.blacklist).toEqual([]);
			expect(DEFAULT_SETTINGS.notificationDirectory).toBe(
				".obsidian-whitelist/notifications/"
			);
			expect(DEFAULT_SETTINGS.showCompliantIndicator).toBe(false);
		});

		it("satisfies WhitelistSettings interface", () => {
			const settings: WhitelistSettings = DEFAULT_SETTINGS;
			expect(settings).toBeDefined();
		});
	});

	// AICODE-NOTE: TEST-001 tests [FR-001, FR-002] - null/undefined data returns defaults
	describe("mergeSettings", () => {
		it("TEST-001: returns DEFAULT_SETTINGS when given null or undefined", () => {
			const fromNull = mergeSettings(null as unknown as Partial<WhitelistSettings>);
			expect(fromNull).toEqual(DEFAULT_SETTINGS);

			const fromUndefined = mergeSettings(undefined as unknown as Partial<WhitelistSettings>);
			expect(fromUndefined).toEqual(DEFAULT_SETTINGS);
		});

		// AICODE-NOTE: TEST-002 tests [FR-002] - partial data merged with defaults
		it("TEST-002: merges partial data with defaults, filling missing fields", () => {
			const partial: Partial<WhitelistSettings> = {
				whitelist: ["dataview", "obsidian-git"],
			};
			const result = mergeSettings(partial);
			expect(result.whitelist).toEqual(["dataview", "obsidian-git"]);
			expect(result.blacklist).toEqual([]);
			expect(result.notificationDirectory).toBe(DEFAULT_NOTIFICATION_DIR);
			expect(result.showCompliantIndicator).toBe(false);
		});

		// AICODE-NOTE: TEST-003 tests [FR-004] - empty notificationDirectory replaced with default
		it("TEST-003: replaces empty notificationDirectory with DEFAULT_NOTIFICATION_DIR", () => {
			const withEmptyDir: Partial<WhitelistSettings> = {
				notificationDirectory: "",
				whitelist: ["some-plugin"],
			};
			const result = mergeSettings(withEmptyDir);
			expect(result.notificationDirectory).toBe(DEFAULT_NOTIFICATION_DIR);
			expect(result.whitelist).toEqual(["some-plugin"]);
		});
	});
});
