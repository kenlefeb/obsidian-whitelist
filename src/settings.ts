import { App, PluginSettingTab, Setting } from "obsidian";
import WhitelistPlugin from "./main.js";

// AICODE-NOTE: WhitelistSettings refactored per data-model.md.
// Fields renamed: allowed→whitelist, prohibited→blacklist.
// EnforcementMode enum removed per research.md — enforcement driven by list presence.
// New fields: notificationDirectory, showCompliantIndicator.

export interface WhitelistSettings {
	whitelist: string[];
	blacklist: string[];
	notificationDirectory: string;
	showCompliantIndicator: boolean;
}

/** Default notification directory path within vault */
export const DEFAULT_NOTIFICATION_DIR = ".obsidian-whitelist/notifications/";

/** Whether to show status bar indicator when all plugins are compliant */
export const DEFAULT_SHOW_COMPLIANT = false;

/** Default whitelist — empty, no plugins pre-approved */
export const DEFAULT_WHITELIST: string[] = [];

/** Default blacklist — empty, no plugins pre-blocked */
export const DEFAULT_BLACKLIST: string[] = [];

export const DEFAULT_SETTINGS: WhitelistSettings = {
	whitelist: [...DEFAULT_WHITELIST],
	blacklist: [...DEFAULT_BLACKLIST],
	notificationDirectory: DEFAULT_NOTIFICATION_DIR,
	showCompliantIndicator: DEFAULT_SHOW_COMPLIANT,
};

// AICODE-TODO: WhitelistSettingTab.display() will be rebuilt in Phase 2+ TDD cycles.
// Current display() is a minimal placeholder after removing EnforcementMode UI.
export class WhitelistSettingTab extends PluginSettingTab {
	plugin: WhitelistPlugin;

	constructor(app: App, plugin: WhitelistPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Plugin settings")
			.setDesc(
				"Configure whitelist, blacklist, and notification preferences. " +
				"Full UI coming in next iteration."
			);
	}
}
