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

	// AICODE-NOTE: status-bar-indicator - addStatusBarItem returns a rich mock element
	// so tests can inspect class list, attrs, text, event listeners, and detach state.
	// Production code treats it as HTMLElement; tests cast back to MockStatusBarElement
	// via asStatusBarMock() to inspect internals.
	addStatusBarItem(): HTMLElement {
		return createStatusBarMockElement() as unknown as HTMLElement;
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

// AICODE-NOTE: status-bar-indicator — rich mock element for the status bar item.
// Tracks text content, class list, attribute map, event listeners, detach state,
// child spans, inline style map, and tabIndex so tests can inspect every render
// branch of renderStatusBarIndicator. Cast via asStatusBarMock(plugin.statusBarItem)
// in tests.
export interface MockStatusBarElement {
	_text: string;
	_classes: Set<string>;
	_attrs: Record<string, string>;
	_events: Record<string, Array<(e: unknown) => void>>;
	_detached: boolean;
	_children: MockStatusBarElement[];
	_style: Record<string, string>;
	tabIndex: number;
	setText(text: string): MockStatusBarElement;
	addClass(...classes: string[]): void;
	removeClass(...classes: string[]): void;
	setAttr(name: string, value: string | number | boolean | null): void;
	setAttribute(name: string, value: string): void;
	getAttribute(name: string): string | null;
	addEventListener(type: string, handler: (e: unknown) => void): void;
	removeEventListener(type: string, handler: (e: unknown) => void): void;
	detach(): void;
	createSpan(options?: Record<string, unknown>): MockStatusBarElement;
	createEl(tag: string, options?: Record<string, unknown>): MockStatusBarElement;
	createDiv(options?: Record<string, unknown>): MockStatusBarElement;
	empty(): void;
	style: Record<string, string>;
	/** Fire a registered event handler — test helper. */
	_fire(type: string, event?: unknown): void;
}

/**
 * Factory for a rich status bar mock element. Each call returns a fresh instance
 * with isolated tracking state.
 */
export function createStatusBarMockElement(): MockStatusBarElement {
	const classes = new Set<string>();
	const attrs: Record<string, string> = {};
	const events: Record<string, Array<(e: unknown) => void>> = {};
	const children: MockStatusBarElement[] = [];
	const styleMap: Record<string, string> = {};

	const el: MockStatusBarElement = {
		_text: "",
		_classes: classes,
		_attrs: attrs,
		_events: events,
		_detached: false,
		_children: children,
		_style: styleMap,
		tabIndex: -1,
		style: styleMap,
		setText(text: string): MockStatusBarElement {
			el._text = text;
			return el;
		},
		addClass(...cls: string[]): void {
			for (const c of cls) classes.add(c);
		},
		removeClass(...cls: string[]): void {
			for (const c of cls) classes.delete(c);
		},
		setAttr(name: string, value: string | number | boolean | null): void {
			attrs[name] = value === null ? "" : String(value);
		},
		setAttribute(name: string, value: string): void {
			attrs[name] = value;
		},
		getAttribute(name: string): string | null {
			return name in attrs ? attrs[name] : null;
		},
		addEventListener(type: string, handler: (e: unknown) => void): void {
			if (!events[type]) events[type] = [];
			events[type].push(handler);
		},
		removeEventListener(type: string, handler: (e: unknown) => void): void {
			const list = events[type];
			if (!list) return;
			const idx = list.indexOf(handler);
			if (idx >= 0) list.splice(idx, 1);
		},
		detach(): void {
			el._detached = true;
		},
		createSpan(_options?: Record<string, unknown>): MockStatusBarElement {
			const child = createStatusBarMockElement();
			children.push(child);
			return child;
		},
		createEl(_tag: string, _options?: Record<string, unknown>): MockStatusBarElement {
			const child = createStatusBarMockElement();
			children.push(child);
			return child;
		},
		createDiv(_options?: Record<string, unknown>): MockStatusBarElement {
			const child = createStatusBarMockElement();
			children.push(child);
			return child;
		},
		empty(): void {
			children.length = 0;
			el._text = "";
		},
		_fire(type: string, event?: unknown): void {
			const list = events[type];
			if (!list) return;
			for (const h of list.slice()) h(event);
		},
	};
	return el;
}

/**
 * Cast an HTMLElement (as returned by addStatusBarItem in the mock) back to
 * MockStatusBarElement for test inspection.
 */
export function asStatusBarMock(el: unknown): MockStatusBarElement {
	return el as unknown as MockStatusBarElement;
}

// AICODE-NOTE: status-bar-indicator — module-level setIcon mock.
// Production code imports `setIcon` from "obsidian" (real Obsidian exports it as
// a module-level function); this mock records every call so tests can assert
// the correct icon name was applied to the correct element. Tests should call
// resetSetIcon() in beforeEach.
export const setIconCalls: Array<{ el: unknown; iconId: string }> = [];

export function setIcon(parent: unknown, iconId: string): void {
	setIconCalls.push({ el: parent, iconId });
}

export function resetSetIcon(): void {
	setIconCalls.length = 0;
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
