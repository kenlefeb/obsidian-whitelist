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
	addPluginId,
	removePluginId,
	validatePluginId,
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

	// AICODE-NOTE: TEST-004 through TEST-007 test [FR-006] - plugin ID add/validate
	describe("addPluginId", () => {
		it("TEST-004: rejects empty string after trim", () => {
			const result = addPluginId([], "   ", []);
			expect(result.error).toBeDefined();
			expect(result.list).toEqual([]);
		});

		it("TEST-005: rejects duplicate ID already in target list", () => {
			const result = addPluginId(["dataview"], "dataview", []);
			expect(result.error).toBeDefined();
			expect(result.list).toEqual(["dataview"]);
		});

		it("TEST-006: trims whitespace and preserves original casing per CHK039", () => {
			const result = addPluginId([], "  DataView  ", []);
			expect(result.error).toBeUndefined();
			expect(result.list).toEqual(["DataView"]);
		});

		it("TEST-007: adds valid ID to whitelist array", () => {
			const result = addPluginId(["existing-plugin"], "dataview", []);
			expect(result.error).toBeUndefined();
			expect(result.list).toEqual(["existing-plugin", "dataview"]);
		});

		// AICODE-NOTE: TEST-009 tests [FR-006] - add to blacklist (same function, blacklist context)
		it("TEST-009: adds valid ID to blacklist array", () => {
			const blacklist = ["malicious-plugin"];
			const whitelist = ["dataview"];
			const result = addPluginId(blacklist, "sketchy-tool", whitelist);
			expect(result.error).toBeUndefined();
			expect(result.list).toEqual(["malicious-plugin", "sketchy-tool"]);
		});
	});

	describe("removePluginId", () => {
		// AICODE-NOTE: TEST-008 tests [FR-006] - remove from whitelist
		it("TEST-008: removes ID from whitelist array", () => {
			const result = removePluginId(
				["dataview", "obsidian-git", "templater"],
				"obsidian-git"
			);
			expect(result).toEqual(["dataview", "templater"]);
		});

		// AICODE-NOTE: TEST-010 tests [FR-006] - remove from blacklist
		it("TEST-010: removes ID from blacklist array", () => {
			const result = removePluginId(
				["malicious-plugin", "sketchy-tool"],
				"malicious-plugin"
			);
			expect(result).toEqual(["sketchy-tool"]);
		});
	});

	describe("validatePluginId - cross-list", () => {
		// AICODE-NOTE: TEST-016 tests [CHK009] - cross-list duplicate rejection
		it("TEST-016: rejects ID already present in the other list", () => {
			const error = validatePluginId("dataview", [], ["dataview"]);
			expect(error).not.toBeNull();
			expect(error).toContain("already");
		});
	});

	describe("validatePluginId - obsidian word check", () => {
		// AICODE-NOTE: TEST-017 tests [CHK032] - IDs containing "obsidian" rejected
		it("TEST-017: rejects IDs containing the word 'obsidian'", () => {
			const error1 = validatePluginId("my-obsidian-plugin", [], []);
			expect(error1).not.toBeNull();

			const error2 = validatePluginId("Obsidian-Tools", [], []);
			expect(error2).not.toBeNull();

			const error3 = validatePluginId("obsidiantools", [], []);
			expect(error3).not.toBeNull();
		});
	});

	// AICODE-NOTE: TEST-011/012 test [FR-003, FR-004] - notification directory save behavior
	describe("notification directory settings", () => {
		it("TEST-011: saving empty notification directory stores empty string (fallback on load)", () => {
			const settings: WhitelistSettings = {
				...DEFAULT_SETTINGS,
				notificationDirectory: "",
			};
			expect(settings.notificationDirectory).toBe("");

			const reloaded = mergeSettings(settings);
			expect(reloaded.notificationDirectory).toBe(DEFAULT_NOTIFICATION_DIR);
		});

		it("TEST-012: saving non-empty directory path persists the value", () => {
			const customDir = "custom/notifications/";
			const settings: WhitelistSettings = {
				...DEFAULT_SETTINGS,
				notificationDirectory: customDir,
			};
			expect(settings.notificationDirectory).toBe(customDir);

			const reloaded = mergeSettings(settings);
			expect(reloaded.notificationDirectory).toBe(customDir);
		});
	});

	// AICODE-NOTE: TEST-013 tests [FR-003, FR-005] - showCompliantIndicator toggle persistence
	describe("showCompliantIndicator toggle", () => {
		it("TEST-013: toggling showCompliantIndicator from false to true persists", () => {
			// Start with defaults (showCompliantIndicator: false)
			const settings: WhitelistSettings = { ...DEFAULT_SETTINGS };
			expect(settings.showCompliantIndicator).toBe(false);

			// Toggle to true
			settings.showCompliantIndicator = true;
			expect(settings.showCompliantIndicator).toBe(true);

			// After save/load cycle, mergeSettings preserves the value
			const reloaded = mergeSettings(settings);
			expect(reloaded.showCompliantIndicator).toBe(true);
		});
	});
});
