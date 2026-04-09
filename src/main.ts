import { Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	WhitelistSettings,
	WhitelistSettingTab,
	mergeSettings,
} from "./settings.js";

// AICODE-NOTE: Enforcer class removed per plan.md -- belongs to plugin-compliance-scan feature.
// WhitelistPlugin now only manages settings persistence. Compliance logic added later.

export default class WhitelistPlugin extends Plugin {
	settings: WhitelistSettings = DEFAULT_SETTINGS;

	async onload() {
		console.debug("Loading plugin");
		await this.loadSettings();
		this.addSettingTab(new WhitelistSettingTab(this.app, this));
	}

	onunload() {
		console.debug("Unloading plugin");
	}

	// AICODE-NOTE: IMPL-002 implements [FR-002, FR-004] - uses mergeSettings for robust loading
	async loadSettings() {
		const loaded = (await this.loadData()) as Partial<WhitelistSettings>;
		this.settings = mergeSettings(loaded);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
