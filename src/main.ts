import { Plugin } from "obsidian";
import {
	type ComplianceResult,
	runComplianceScan,
} from "./compliance.js";
import { showComplianceModal } from "./compliance-modal.js";
import {
	DEFAULT_SETTINGS,
	WhitelistSettings,
	WhitelistSettingTab,
	mergeSettings,
} from "./settings.js";

// AICODE-NOTE: Enforcer class removed per plan.md -- belongs to plugin-compliance-scan feature.
// WhitelistPlugin now manages settings persistence and compliance scanning.

// AICODE-NOTE: IMPL-010 - Obsidian internal API type augmentation
// app.plugins and workspace.onLayoutReady are not in the public type definitions
// but are stable internal APIs used by many community plugins
interface ObsidianInternalApp {
	plugins: {
		manifests: Record<string, { id: string; name: string }>;
		enabledPlugins: Set<string>;
	};
	workspace: {
		onLayoutReady: (callback: () => void) => void;
	};
}

export default class WhitelistPlugin extends Plugin {
	settings: WhitelistSettings = DEFAULT_SETTINGS;

	// AICODE-NOTE: IMPL-010 implements [FR-008] - compliance scan result stored on plugin instance
	complianceResult: ComplianceResult | null = null;

	// AICODE-NOTE: IMPL-008 implements [FR-005] - user-submitted justification stored on plugin instance
	// Populated after showComplianceModal resolves; null when compliant or modal not yet submitted.
	justification: string | null = null;

	async onload() {
		console.debug("Loading plugin");
		await this.loadSettings();
		this.addSettingTab(new WhitelistSettingTab(this.app, this));

		// AICODE-NOTE: IMPL-010 implements [FR-008] - run compliance scan on layout ready
		// Uses onLayoutReady to ensure app.plugins.manifests is populated
		const internalApp = this.app as unknown as ObsidianInternalApp;
		internalApp.workspace.onLayoutReady(() => {
			void this.runBootComplianceFlow(internalApp);
		});
	}

	// AICODE-NOTE: IMPL-008 implements [FR-001, FR-008] - boot-time scan + modal flow
	// Extracted into async helper so onLayoutReady callback stays synchronous and
	// the promise chain is explicit. Guard on !compliant satisfies FR-008 (IMPL-006).
	private async runBootComplianceFlow(
		internalApp: ObsidianInternalApp,
	): Promise<void> {
		this.complianceResult = runComplianceScan(
			this.settings,
			internalApp.plugins.manifests,
			this.manifest.id,
		);

		// FR-008: only show modal when non-compliant (IMPL-006 guard)
		if (!this.complianceResult.compliant) {
			this.justification = await showComplianceModal(
				this.app,
				this.complianceResult.violations,
			);
		}
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
