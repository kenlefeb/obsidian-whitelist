/**
 * AICODE-NOTE: Mock of Obsidian API for Vitest.
 * Only mocks the classes/interfaces used by settings.ts, main.ts, and compliance-modal.ts.
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

// AICODE-NOTE: INIT-003 (is-notification-file) - Vault adapter mock exposed
// so tests can spy on write/exists/mkdir via vi.spyOn(app.vault.adapter, "write") etc.
// Default implementations: write resolves, exists returns true, mkdir resolves.
// Tests override per-case as needed.
export interface MockVaultAdapter {
	write: (path: string, data: string) => Promise<void>;
	exists: (path: string) => Promise<boolean>;
	mkdir: (path: string) => Promise<void>;
}

export class App {
	vault = {
		getName: (): string => "test-vault",
		// AICODE-NOTE: INIT-003 - adapter with write/exists/mkdir for notification-file tests
		adapter: {
			write: async (_path: string, _data: string): Promise<void> => {},
			exists: async (_path: string): Promise<boolean> => true,
			mkdir: async (_path: string): Promise<void> => {},
		} as MockVaultAdapter,
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
		this.containerEl = createMockElement() as unknown as HTMLElement;
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

// AICODE-NOTE: INIT-003 (is-notification-file) - Notice tracks construction calls
// so tests can assert the error Notice was shown with ERROR_NOTICE_PREFIX.
// Access via Notice.instances in tests; call Notice.reset() in beforeEach.
export class Notice {
	static instances: Array<{ message: string; timeout?: number }> = [];

	message: string;
	timeout?: number;

	constructor(message: string, timeout?: number) {
		this.message = message;
		this.timeout = timeout;
		Notice.instances.push({ message, timeout });
	}

	static reset(): void {
		Notice.instances = [];
	}
}

// AICODE-NOTE: Mock element factory for recursive DOM stub creation.
// Supports createEl/createDiv chaining and setText used by ComplianceModal.onOpen().
// Not a full DOM — assertions should not depend on tree state, only on non-error execution.
interface MockElement {
	empty: () => void;
	createEl: (tag: string, options?: Record<string, unknown>) => MockElement;
	createDiv: (options?: Record<string, unknown>) => MockElement;
	setText: (text: string) => MockElement;
	addClass: (cls: string) => void;
	addEventListener: (event: string, handler: (e: unknown) => void) => void;
	value: string;
	placeholder: string;
	textContent: string;
	rows: number;
	focus: () => void;
}

function createMockElement(): MockElement {
	const el: MockElement = {
		empty: () => {},
		createEl: (_tag: string, _options?: Record<string, unknown>) => createMockElement(),
		createDiv: (_options?: Record<string, unknown>) => createMockElement(),
		setText: (_text: string) => el,
		addClass: (_cls: string) => {},
		addEventListener: (_event: string, _handler: (e: unknown) => void) => {},
		value: "",
		placeholder: "",
		textContent: "",
		rows: 0,
		focus: () => {},
	};
	return el;
}

// AICODE-NOTE: Modal mock added for compliance-notification-modal feature (INIT-001)
// Provides minimal stub of Obsidian's Modal class for unit testing ComplianceModal.
// AICODE-NOTE: Enhanced with recursive createEl/createDiv for IMPL-001 DOM rendering.
export class Modal {
	app: App;
	contentEl: HTMLElement;
	modalEl: HTMLElement;

	constructor(app: App) {
		this.app = app;
		this.contentEl = createMockElement() as unknown as HTMLElement;
		this.modalEl = {
			addClass: () => {},
		} as unknown as HTMLElement;
	}

	open(): void {
		// Mock Obsidian lifecycle: open() calls onOpen() if defined on subclass.
		const maybeOnOpen = (this as unknown as { onOpen?: () => void }).onOpen;
		if (typeof maybeOnOpen === "function") {
			maybeOnOpen.call(this);
		}
	}

	close(): void {}
}

// AICODE-NOTE: ButtonComponent mock for compliance-modal submit button (INIT-001)
export class ButtonComponent {
	private clickHandler: (() => void) | null = null;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(_containerEl: HTMLElement) {}

	setButtonText(): this { return this; }
	setCta(): this { return this; }
	onClick(handler: () => void): this {
		this.clickHandler = handler;
		return this;
	}

	/** Test helper: simulate button click */
	click(): void {
		if (this.clickHandler) {
			this.clickHandler();
		}
	}
}
