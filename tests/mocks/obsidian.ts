/**
 * AICODE-NOTE: Mock of Obsidian API for Vitest.
 * Only mocks the classes/interfaces used by settings.ts and main.ts.
 * Vitest alias in vitest.config.ts maps "obsidian" imports to this file.
 */

export class Plugin {
	app: App;
	manifest: { id: string; name: string; version: string };

	constructor() {
		this.app = new App();
		this.manifest = { id: "obsidian-whitelist", name: "Whitelist", version: "1.0.0" };
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	addSettingTab(_tab: PluginSettingTab): void {}

	addStatusBarItem(): { setText: (text: string) => void } {
		return { setText: () => {} };
	}

	async loadData(): Promise<unknown> {
		return null;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async saveData(_data: unknown): Promise<void> {}
}

export class App {
	vault = {
		getName: () => "test-vault",
	};

	// AICODE-NOTE: IMPL-010 - workspace mock with onLayoutReady for compliance scan integration
	workspace = {
		onLayoutReady: (callback: () => void) => {
			// Execute callback immediately in tests
			callback();
		},
	};

	// AICODE-NOTE: IMPL-010 - plugins mock for compliance scan integration
	plugins = {
		manifests: {} as Record<string, { id: string; name: string }>,
		enabledPlugins: new Set<string>(),
	};
}

export class PluginSettingTab {
	app: App;
	plugin: Plugin;
	containerEl: HTMLElement;

	constructor(app: App, plugin: Plugin) {
		this.app = app;
		this.plugin = plugin;
		// AICODE-NOTE: In test environment, containerEl is a minimal stub.
		// Full DOM testing of settings UI requires JSDOM or manual verification.
		this.containerEl = {
			empty: () => {},
			createEl: () => ({}),
			createDiv: () => ({}),
		} as unknown as HTMLElement;
	}
}

export class Setting {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(_containerEl: HTMLElement) {}

	setName(): this { return this; }
	setDesc(): this { return this; }
	setHeading(): this { return this; }
	addText(): this { return this; }
	addTextArea(): this { return this; }
	addToggle(): this { return this; }
	addButton(): this { return this; }
	addDropdown(): this { return this; }
}

export class Notice {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(_message: string, _timeout?: number) {}
}

// AICODE-NOTE: Modal mock added for compliance-notification-modal feature (INIT-001)
// Provides minimal stub of Obsidian's Modal class for unit testing ComplianceModal
export class Modal {
	app: App;
	contentEl: HTMLElement;
	modalEl: HTMLElement;

	constructor(app: App) {
		this.app = app;
		// Minimal DOM stubs for test environment
		this.contentEl = {
			empty: () => {},
			createEl: () => ({}),
			createDiv: () => ({}),
		} as unknown as HTMLElement;
		this.modalEl = {
			addClass: () => {},
		} as unknown as HTMLElement;
	}

	open(): void {}
	close(): void {}
}

// AICODE-NOTE: ButtonComponent mock for compliance-modal submit button (INIT-001)
export class ButtonComponent {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(_containerEl: HTMLElement) {}

	setButtonText(): this { return this; }
	setCta(): this { return this; }
	onClick(): this { return this; }
}
