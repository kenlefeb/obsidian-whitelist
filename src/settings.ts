import { App, PluginSettingTab, Setting } from "obsidian";
import WhitelistPlugin from "./main.js";

// AICODE-NOTE: WhitelistSettings refactored per data-model.md.
// Fields renamed: allowed->whitelist, prohibited->blacklist.
// EnforcementMode enum removed per research.md -- enforcement driven by list presence.
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

/** Default whitelist -- empty, no plugins pre-approved */
export const DEFAULT_WHITELIST: string[] = [];

/** Default blacklist -- empty, no plugins pre-blocked */
export const DEFAULT_BLACKLIST: string[] = [];

export const DEFAULT_SETTINGS: WhitelistSettings = {
	whitelist: [...DEFAULT_WHITELIST],
	blacklist: [...DEFAULT_BLACKLIST],
	notificationDirectory: DEFAULT_NOTIFICATION_DIR,
	showCompliantIndicator: DEFAULT_SHOW_COMPLIANT,
};

// AICODE-NOTE: IMPL-001/011 implements [FR-001, FR-002, FR-004] - merge loaded data with defaults
// AICODE-NOTE: Only picks known WhitelistSettings fields to strip unknown properties from data.json
/**
 * Merges partially loaded settings with defaults.
 * Handles null/undefined input, missing fields, empty notificationDirectory,
 * and extra unknown fields (stripped).
 */
export function mergeSettings(
	loaded: Partial<WhitelistSettings> | null | undefined,
): WhitelistSettings {
	const data = loaded ?? {};
	const merged: WhitelistSettings = {
		whitelist: Array.isArray(data.whitelist)
			? data.whitelist
			: DEFAULT_SETTINGS.whitelist,
		blacklist: Array.isArray(data.blacklist)
			? data.blacklist
			: DEFAULT_SETTINGS.blacklist,
		notificationDirectory: typeof data.notificationDirectory === "string"
			? data.notificationDirectory
			: DEFAULT_SETTINGS.notificationDirectory,
		showCompliantIndicator: typeof data.showCompliantIndicator === "boolean"
			? data.showCompliantIndicator
			: DEFAULT_SETTINGS.showCompliantIndicator,
	};
	// FR-004: empty notification directory falls back to default
	if (!merged.notificationDirectory || merged.notificationDirectory.trim() === "") {
		merged.notificationDirectory = DEFAULT_NOTIFICATION_DIR;
	}
	return merged;
}

// AICODE-NOTE: IMPL-003 implements [FR-006] - validate plugin ID before add
// AICODE-NOTE: IMPL-012 adds cross-list check per CHK009
/**
 * Validates a plugin ID before adding to a list.
 * Returns error message string if invalid, null if valid.
 * No self-exclusion: plugin's own ID is allowed per CHK002.
 */
export function validatePluginId(
	id: string,
	list: string[],
	otherList: string[],
): string | null {
	const trimmed = id.trim();
	if (trimmed === "") {
		return "Plugin ID cannot be empty";
	}
	if (list.includes(trimmed)) {
		return `"${trimmed}" is already in this list`;
	}
	// CHK009: cross-list duplicate rejection
	if (otherList.includes(trimmed)) {
		return `"${trimmed}" is already in the other list`;
	}
	return null;
}

// AICODE-NOTE: IMPL-004 implements [FR-006] - add plugin ID to list
/**
 * Adds a plugin ID to a list after validation.
 * Returns new list and optional error message.
 */
export function addPluginId(
	list: string[],
	id: string,
	otherList: string[],
): { list: string[]; error?: string } {
	const error = validatePluginId(id, list, otherList);
	if (error) {
		return { list, error };
	}
	return { list: [...list, id.trim()] };
}

// AICODE-NOTE: IMPL-005 implements [FR-006] - remove plugin ID from list
/**
 * Removes a plugin ID from a list. Returns new list.
 */
export function removePluginId(list: string[], id: string): string[] {
	return list.filter((item) => item !== id);
}

// AICODE-NOTE: IMPL-006/007/008/009/010 implements [FR-003, FR-005, UX-001, UX-002, UX-003]
// WhitelistSettingTab with whitelist, blacklist, notifications, and display sections.
export class WhitelistSettingTab extends PluginSettingTab {
	plugin: WhitelistPlugin;

	constructor(app: App, plugin: WhitelistPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// --- Whitelist Section ---
		this.renderListSection(
			containerEl,
			"Whitelist",
			"Add plugin to whitelist",
			"Enter a community plugin ID to approve",
			"whitelist",
			"blacklist",
		);

		// --- Blacklist Section (IMPL-008) ---
		this.renderListSection(
			containerEl,
			"Blacklist",
			"Add plugin to blacklist",
			"Enter a community plugin ID to block",
			"blacklist",
			"whitelist",
		);

		// --- Notifications Section (IMPL-009) ---
		new Setting(containerEl)
			.setName("Notifications")
			.setHeading();

		new Setting(containerEl)
			.setName("Notification directory")
			.setDesc(
				"Vault-relative path for compliance notification files. " +
				"Leave empty to use default."
			)
			.addText((text) => {
				text.setPlaceholder(DEFAULT_NOTIFICATION_DIR);
				text.setValue(this.plugin.settings.notificationDirectory);
				text.onChange(async (value) => {
					this.plugin.settings.notificationDirectory = value;
					await this.plugin.saveSettings();
				});
			});

		// --- Display Section (IMPL-010) ---
		new Setting(containerEl)
			.setName("Display")
			.setHeading();

		new Setting(containerEl)
			.setName("Show compliant status bar indicator")
			.setDesc(
				"When enabled, shows an indicator in the status bar when " +
				"all installed plugins are compliant."
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.showCompliantIndicator);
				toggle.onChange(async (value) => {
					this.plugin.settings.showCompliantIndicator = value;
					await this.plugin.saveSettings();
				});
			});
	}

	/**
	 * Renders a complete list management section: heading, input, button, entries.
	 */
	private renderListSection(
		container: HTMLElement,
		heading: string,
		inputName: string,
		inputDesc: string,
		listName: "whitelist" | "blacklist",
		otherListName: "whitelist" | "blacklist",
	): void {
		new Setting(container)
			.setName(heading)
			.setHeading();

		let inputValue = "";
		const errorEl = container.createEl("div", { cls: "setting-error" });

		new Setting(container)
			.setName(inputName)
			.setDesc(inputDesc)
			.addText((text) => {
				text.setPlaceholder("Plugin ID");
				text.onChange((value) => {
					inputValue = value;
				});
			})
			.addButton((btn) => {
				btn.setButtonText("Add");
				btn.onClick(() => {
					const result = addPluginId(
						this.plugin.settings[listName],
						inputValue,
						this.plugin.settings[otherListName],
					);
					if (result.error) {
						errorEl.setText(result.error);
					} else {
						errorEl.setText("");
						this.plugin.settings[listName] = result.list;
						void this.plugin.saveSettings();
						this.display();
					}
				});
			});

		this.renderPluginList(container, this.plugin.settings[listName], listName);
	}

	/**
	 * Renders a list of plugin IDs with trash buttons for removal.
	 */
	private renderPluginList(
		container: HTMLElement,
		list: string[],
		listName: "whitelist" | "blacklist",
	): void {
		const listContainer = container.createDiv({ cls: "plugin-list" });
		for (const pluginId of list) {
			new Setting(listContainer)
				.setName(pluginId)
				.addButton((btn) => {
					btn.setIcon("trash");
					btn.setTooltip("Remove");
					btn.onClick(() => {
						this.plugin.settings[listName] = removePluginId(
							this.plugin.settings[listName],
							pluginId,
						);
						void this.plugin.saveSettings();
						this.display();
					});
				});
		}
	}
}
