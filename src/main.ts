import { Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	WhitelistSettings,
	WhitelistSettingTab,
} from "./settings.js";

// AICODE-NOTE: Enforcer class removed per plan.md — belongs to plugin-compliance-scan feature.
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

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<WhitelistSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
