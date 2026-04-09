/**
 * AICODE-NOTE: Settings unit tests — RED/GREEN phases added in Phase 2+.
 * This file validates settings merge, validation, and default behavior.
 */
import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS, WhitelistSettings } from "../../src/settings";

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
});
