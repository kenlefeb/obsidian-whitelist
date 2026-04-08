import { Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	WhitelistSettings,
	WhitelistSettingTab,
} from "./settings";

export default class WhitelistPlugin extends Plugin {
	settings: WhitelistSettings = DEFAULT_SETTINGS;
	enforcer: Enforcer = new Enforcer(this.settings);

	async enforce() {
		await this.loadSettings();

		this.enforcer.enforce();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItem = this.addStatusBarItem();
		statusBarItem.setText(
			`Whitelist: ${this.settings.mode} (${this.enforcer.status})`,
		);
	}

	async onload() {
		console.debug("Loading plugin");
		await this.enforce();
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

class Enforcer {
	settings: WhitelistSettings;

	constructor(settings: WhitelistSettings) {
		this.settings = settings;
	}

	enforce() {}

	get status(): string {
		return "compliant";
	}
}
