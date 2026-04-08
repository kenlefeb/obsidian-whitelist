import { App, PluginSettingTab, Setting } from "obsidian";
import WhitelistPlugin from "./main";

export interface WhitelistSettings {
	mode: EnforcementMode;
	allowed: string[];
	prohibited: string[];
}

enum EnforcementMode {
	Strict = "strict",
	Lax = "lax",
	Warn = "warn",
	Off = "off",
}

export const DEFAULT_SETTINGS: WhitelistSettings = {
	mode: EnforcementMode.Warn,
	allowed: ["obsidian-whitelist", "obsidian-objects"],
	prohibited: ["obsidian-tasks-plugin"],
};

export class WhitelistSettingTab extends PluginSettingTab {
	plugin: WhitelistPlugin;

	constructor(app: App, plugin: WhitelistPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl: theContainer } = this;

		theContainer.empty();

		new Setting(theContainer)
			.setName("Enforcement mode")
			.setDesc("Select the enforcement mode for the whitelist")
			.addDropdown((dropdown) =>
				dropdown
					.addOption(EnforcementMode.Strict, "Strict")
					.addOption(EnforcementMode.Lax, "Lax")
					.addOption(EnforcementMode.Warn, "Warn")
					.addOption(EnforcementMode.Off, "Off")
					.setValue(this.plugin.settings.mode)
					.onChange(async (value) => {
						this.plugin.settings.mode = value as EnforcementMode;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(theContainer)
			.setName("Allowed plugins")
			.setDesc("List of allowed plugins (comma-separated)")
			.addTextArea((text) =>
				text
					.setPlaceholder("obsidian-whitelist, obsidian-objects")
					.setValue(this.plugin.settings.allowed.join(", "))
					.onChange(async (value) => {
						this.plugin.settings.allowed = value
							.split(",")
							.map((s) => s.trim());
						await this.plugin.saveSettings();
					}),
			);

		new Setting(theContainer)
			.setName("Prohibited plugins")
			.setDesc("List of prohibited plugins (comma-separated)")
			.addTextArea((text) =>
				text
					.setPlaceholder("obsidian-tasks-plugin")
					.setValue(this.plugin.settings.prohibited.join(", "))
					.onChange(async (value) => {
						this.plugin.settings.prohibited = value
							.split(",")
							.map((s) => s.trim());
						await this.plugin.saveSettings();
					}),
			);

		new Setting(theContainer)
			.setName("Enforce")
			.setDesc("Enforce the current whitelist settings immediately")
			.addButton((button) =>
				button
					.setButtonText("Enforce Now")
					.setWarning()
					.onClick(async () => {
						await this.plugin.enforce();
						this.display();
					}),
			);
	}
}
